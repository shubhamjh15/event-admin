import "server-only";
import crypto from "crypto";

/**
 * Razorpay Payment Links (cards, UPI, net banking, wallets).
 * Enabled when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set. Payments are confirmed two ways,
 * both signature-verified and idempotent: the customer's redirect back (callback) and the webhook.
 */

export function paymentsEnabled() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

export type PaymentLink = { id: string; short_url: string; status: string; amount: number; amount_paid?: number; expire_by?: number };

async function rzp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: auth(), "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.description || `Payment provider error (${res.status})`);
  return body as T;
}

export async function createPaymentLink(p: {
  amount: number; currency: string; referenceId: string; description: string;
  customer: { name: string; email: string; contact?: string }; callbackUrl: string; expireBy: Date;
}) {
  // Razorpay needs expiry at least 15 minutes ahead; amounts are in the smallest currency unit.
  const expire = Math.max(Math.floor(p.expireBy.getTime() / 1000), Math.floor(Date.now() / 1000) + 20 * 60);
  return rzp<PaymentLink>("/payment_links", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(p.amount * 100),
      currency: p.currency,
      accept_partial: false,
      reference_id: p.referenceId.slice(0, 40),
      description: p.description.slice(0, 2048),
      customer: { name: p.customer.name, email: p.customer.email, contact: p.customer.contact?.replace(/[^\d+]/g, "") || undefined },
      notify: { sms: false, email: false },
      reminder_enable: true,
      callback_url: p.callbackUrl,
      callback_method: "get",
      expire_by: expire,
      notes: { quote_ref: p.referenceId },
    }),
  });
}

export const fetchPaymentLink = (id: string) => rzp<PaymentLink>(`/payment_links/${encodeURIComponent(id)}`);

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Signature Razorpay appends to the callback URL after a payment-link payment. */
export function verifyCallbackSignature(p: { linkId: string; referenceId: string; status: string; paymentId: string; signature: string }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !p.signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${p.linkId}|${p.referenceId}|${p.status}|${p.paymentId}`).digest("hex");
  return safeEqual(expected, p.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
