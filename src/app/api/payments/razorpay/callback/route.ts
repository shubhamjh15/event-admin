import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/lib/commerce/engine";
import { markPaid } from "@/lib/commerce/checkout";
import { fetchPaymentLink, verifyCallbackSignature } from "@/lib/commerce/payments";

export const dynamic = "force-dynamic";

/** Customer returns here from Razorpay. Signature-verified; the webhook is the backup path. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const p = {
    paymentId: sp.get("razorpay_payment_id") || "",
    linkId: sp.get("razorpay_payment_link_id") || "",
    referenceId: sp.get("razorpay_payment_link_reference_id") || "",
    status: sp.get("razorpay_payment_link_status") || "",
    signature: sp.get("razorpay_signature") || "",
  };
  const ref = /^LQ-[A-Z0-9]{8}$/.test(p.referenceId) ? p.referenceId : "";
  if (!ref) return NextResponse.redirect(`${SITE_URL()}/`, 303);
  let result = "pending";
  try {
    if (p.status === "paid" && verifyCallbackSignature(p)) {
      const link = await fetchPaymentLink(p.linkId).catch(() => null);
      const amount = link ? (link.amount_paid || link.amount) / 100 : NaN;
      if (Number.isFinite(amount)) await markPaid({ ref, linkId: p.linkId, paymentId: p.paymentId, amountPaid: amount });
      result = "success";
    } else if (p.status && p.status !== "paid") {
      result = "cancelled";
    }
  } catch (e) {
    console.error("[razorpay callback]", e);
  }
  return NextResponse.redirect(`${SITE_URL()}/q/${ref}?pay=${result}`, 303);
}
