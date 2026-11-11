import { NextRequest, NextResponse } from "next/server";
import { rateLimited } from "@/lib/api";
import { CommerceError, SITE_URL } from "@/lib/commerce/engine";
import { paymentUrlFor } from "@/lib/commerce/checkout";

export const dynamic = "force-dynamic";

/** Sends the customer to a live Razorpay payment link for their booking's deposit. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const back = (code: string) => NextResponse.redirect(`${SITE_URL()}/q/${encodeURIComponent(ref.toUpperCase())}?pay=${code}`, 303);
  if (rateLimited(req, "pay", 20)) return back("busy");
  try {
    return NextResponse.redirect(await paymentUrlFor(ref), 303);
  } catch (e) {
    if (e instanceof CommerceError) return back(e.code);
    console.error("[pay]", e);
    return back("error");
  }
}
