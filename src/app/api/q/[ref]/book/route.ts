import { NextRequest } from "next/server";
import { fail, json, rateLimited, readJson } from "@/lib/api";
import { CommerceError, bookQuote } from "@/lib/commerce/engine";

export const dynamic = "force-dynamic";

/** Booking from the human review page (/q/[ref]) — same rules as an agent booking. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  if (rateLimited(req, "quote-book", 8)) return fail("Too many requests. Please try again shortly.", 429);
  const { ref } = await params;
  const body = await readJson(req);
  if (body.website) return json({ ok: true }); // honeypot
  try {
    const res = await bookQuote({ ...body, quoteRef: ref, customerConfirmed: body.customerConfirmed === true }, { channel: "web" });
    return json(res, 201);
  } catch (e) {
    if (e instanceof CommerceError) return fail(e.message, e.status);
    console.error("[quote-book]", e);
    return fail("Something went wrong on our side. Please try again in a moment.", 500);
  }
}
