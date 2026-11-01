import { NextRequest } from "next/server";
import { Subscriber } from "@/lib/models";
import { withDb } from "@/lib/api";
import { verifyUnsubscribe } from "@/lib/mail";

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#FAF6EF;color:#16130F;font-family:Georgia,serif;text-align:center;padding:24px">
<div><p style="font-style:italic;font-size:40px;margin:0">Lit</p><p style="font:600 10px Arial;letter-spacing:5px;margin:4px 0 32px">CONCIERGE</p>
<h1 style="font-weight:normal;font-size:32px;margin:0 0 12px">${title}</h1><p style="font:16px/1.6 Arial;color:#6B6052;max-width:420px;margin:0 auto 28px">${text}</p>
<a href="/" style="font:600 11px Arial;letter-spacing:2px;text-transform:uppercase;color:#FAF6EF;background:#16130F;padding:14px 24px;text-decoration:none">Back to the website</a></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

/** One-click unsubscribe from the newsletter (link in every newsletter email). */
async function handle(req: NextRequest) {
  const e = (req.nextUrl.searchParams.get("e") || "").toLowerCase().trim();
  const t = req.nextUrl.searchParams.get("t") || "";
  if (!e || !verifyUnsubscribe(e, t)) return page("Link not valid", "This unsubscribe link is incomplete or has expired. Reply to any of our emails and we'll remove you by hand.", 400);
  try {
    await withDb(() => Subscriber.updateOne({ email: e }, { $set: { active: false } }));
  } catch {
    return page("Please try again", "We couldn't update your preferences just now. Please try the link again in a moment.", 503);
  }
  return page("You're unsubscribed", "You won't receive the Lit Letter any more. You can subscribe again anytime from our website.");
}

export const GET = handle;
export const POST = handle; // RFC 8058 one-click unsubscribe
