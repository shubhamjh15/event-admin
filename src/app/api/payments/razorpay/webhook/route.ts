import { NextRequest, NextResponse } from "next/server";
import { markPaid } from "@/lib/commerce/checkout";
import { verifyWebhookSignature } from "@/lib/commerce/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook (Dashboard → Webhooks → https://<site>/api/payments/razorpay/webhook,
 * event "payment_link.paid", secret = RAZORPAY_WEBHOOK_SECRET).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    const evt = JSON.parse(raw);
    if (evt?.event === "payment_link.paid") {
      const link = evt.payload?.payment_link?.entity || {};
      const payment = evt.payload?.payment?.entity || {};
      const ref = String(link.reference_id || "");
      if (/^LQ-[A-Z0-9]{8}$/.test(ref)) {
        await markPaid({ ref, linkId: String(link.id || ""), paymentId: String(payment.id || ""), amountPaid: Number(link.amount_paid || payment.amount || 0) / 100 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[razorpay webhook]", e);
    // Non-2xx makes Razorpay retry.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
