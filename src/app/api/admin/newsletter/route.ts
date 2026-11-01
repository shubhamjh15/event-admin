import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { Blog, Subscriber } from "@/lib/models";
import { fail, json, readJson, withDb, route } from "@/lib/api";
import { getSettings } from "@/lib/data";
import { adminInbox, esc, layout, mailConfigured, sendMail, unsubscribeUrl } from "@/lib/mail";
import { plainText } from "@/lib/markdown";
import { sized } from "@/lib/img";

export const maxDuration = 60;

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Status for the blog editor: subscriber count, last push, whether email is set up. */
async function _GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("blog") || "";
  return withDb(async () => {
    const [subscribers, blog]: any = await Promise.all([
      Subscriber.countDocuments({ active: { $ne: false } }),
      isValidObjectId(id) ? Blog.findById(id).select("pushedAt pushedCount published").lean() : null,
    ]);
    return json({ subscribers, mailConfigured: mailConfigured(), pushedAt: blog?.pushedAt || null, pushedCount: blog?.pushedCount || 0, published: blog?.published ?? null });
  });
}

/** Email a published post to every active subscriber (or a test copy to the admin inbox). */
async function _POST(req: NextRequest) {
  const { blogId, test } = await readJson(req);
  if (!isValidObjectId(blogId)) return fail("Post not found", 404);
  if (!mailConfigured()) return fail("Email isn't configured on this server. Add the SMTP_* environment variables first.", 400);
  return withDb(async () => {
    const b: any = await Blog.findById(blogId).lean();
    if (!b) return fail("Post not found", 404);
    if (!test && b.published === false) return fail("Publish the post before pushing it to subscribers.", 400);
    const s = await getSettings();
    const url = `${site()}/blogs/${b.slug}`;
    const excerpt = b.excerpt || plainText(b.content).slice(0, 220) + "…";
    const build = (to: string) => {
      const unsub = unsubscribeUrl(to);
      return {
        to,
        subject: test ? `[Test] ${b.title}` : b.title,
        html: layout(s, {
          preheader: excerpt,
          title: esc(b.title),
          body: `${b.cover ? `<img src="${esc(sized(b.cover, 1100))}" alt="" width="528" style="display:block;width:100%;height:auto;margin:0 0 20px;border:0;">` : ""}
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C41D61;">${esc(b.category || "The Lit Journal")}</p>
<p style="margin:0 0 14px;">${esc(excerpt)}</p>`,
          cta: { label: "Read the full story", href: url },
          footerNote: `You're receiving this because you subscribed to the Lit Letter. <a href="${esc(unsub)}" style="color:#6B6052;">Unsubscribe</a>`,
        }),
        text: `${b.title}\n\n${excerpt}\n\nRead more: ${url}\n\nUnsubscribe: ${unsub}`,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    };

    if (test) {
      const r = await sendMail(build(adminInbox(s)), s.siteName);
      return r.sent ? json({ ok: true, sent: 1, test: true }) : fail(r.error || "Test email failed", 502);
    }

    const subs: any[] = await Subscriber.find({ active: { $ne: false } }).select("email").lean();
    if (!subs.length) return fail("There are no active subscribers yet.", 400);
    let sent = 0, failed = 0, i = 0;
    const started = Date.now();
    async function worker() {
      while (i < subs.length && Date.now() - started < 50_000) {
        const sub = subs[i++];
        const r = await sendMail(build(sub.email), s.siteName);
        r.sent ? sent++ : failed++;
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker));
    const remaining = subs.length - sent - failed;
    await Blog.updateOne({ _id: blogId }, { $set: { pushedAt: new Date(), pushedCount: sent } });
    return json({ ok: true, sent, failed, remaining, total: subs.length });
  });
}

export const GET = route(_GET);
export const POST = route(_POST);
