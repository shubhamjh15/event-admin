import { NextRequest } from "next/server";
import { Blog } from "@/lib/models";
import { json, rateLimited, withDb, route } from "@/lib/api";

/** Counts a read. Called from the browser because article pages are served from cache. */
async function _POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (rateLimited(req, `view:${slug}`, 3)) return json({ ok: true });
  await withDb(() => Blog.updateOne({ slug: String(slug), published: { $ne: false } }, { $inc: { views: 1 } }));
  return json({ ok: true });
}

export const POST = route(_POST);
