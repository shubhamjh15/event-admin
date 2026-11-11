import "server-only";
import { dbConnect } from "../db";
import { Booking, Quote } from "../models";
import { getSettings } from "../data";
import { adminInbox, detailsTable, detailsText, esc, layout, sendMail } from "../mail";
import { CommerceError, SITE_URL, commerceConfig, money, normaliseRef } from "./engine";
import { createPaymentLink, fetchPaymentLink, paymentsEnabled } from "./payments";

/** Return a live payment-link URL for a booked quote's deposit, creating (or reusing) the link. */
export async function paymentUrlFor(refInput: string) {
  if (!paymentsEnabled()) throw new CommerceError("Online payment isn't enabled. Your planner will send payment details.", 409, "payments_disabled");
  const ref = normaliseRef(refInput);
  await dbConnect();
  const b: any = await Booking.findOne({ quoteRef: ref }).sort({ createdAt: -1 });
  if (!b) throw new CommerceError("This quote hasn't been booked yet.", 404, "not_booked");
  if (["deposit-paid", "paid"].includes(b.paymentStatus)) throw new CommerceError("The deposit for this booking has already been paid.", 409, "already_paid");
  if (b.status === "cancelled") throw new CommerceError("This booking has been cancelled.", 409, "cancelled");

  if (b.paymentLinkId) {
    try {
      const link = await fetchPaymentLink(b.paymentLinkId);
      if (link.status === "paid") {
        await markPaid({ ref, linkId: link.id, paymentId: "", amountPaid: (link.amount_paid || link.amount) / 100 });
        throw new CommerceError("The deposit for this booking has already been paid.", 409, "already_paid");
      }
      if (link.status === "created" || link.status === "partially_paid") return link.short_url;
    } catch (e) {
      if (e instanceof CommerceError) throw e;
      // Fall through and create a fresh link.
    }
  }
  const s = await getSettings();
  const link = await createPaymentLink({
    amount: b.deposit,
    currency: b.currency || commerceConfig(s).currency,
    referenceId: ref,
    description: `${s.siteName} — ${b.deposit === b.amount ? "payment" : "deposit"} for booking ${ref}`,
    customer: { name: b.name, email: b.email, contact: b.phone },
    callbackUrl: `${SITE_URL()}/api/payments/razorpay/callback`,
    expireBy: new Date(Date.now() + 7 * 86_400_000),
  });
  b.paymentLinkId = link.id;
  b.paymentLinkUrl = link.short_url;
  b.paymentStatus = "link-created";
  await b.save();
  return link.short_url;
}

/** Idempotently record a successful payment and notify the customer and the admin once. */
export async function markPaid(p: { ref: string; linkId: string; paymentId: string; amountPaid: number }) {
  await dbConnect();
  const current: any = await Booking.findOne({ quoteRef: p.ref }).sort({ createdAt: -1 }).lean();
  if (!current) return false;
  const fullyPaid = current.amount != null && p.amountPaid >= current.amount;
  // The status filter makes this a one-time transition even if the callback and webhook race.
  const b: any = await Booking.findOneAndUpdate(
    { _id: current._id, paymentStatus: { $nin: ["deposit-paid", "paid"] }, ...(p.linkId ? { paymentLinkId: p.linkId } : {}) },
    { $set: { paymentStatus: fullyPaid ? "paid" : "deposit-paid", paidAmount: p.amountPaid, ...(p.paymentId ? { paymentId: p.paymentId } : {}), status: "confirmed" } },
    { new: true },
  );
  if (!b) return false; // already recorded (or unknown link)
  await Quote.updateOne({ ref: p.ref }, { $set: { status: "booked" } }).catch(() => {});

  const s = await getSettings();
  const cfg = commerceConfig(s);
  const rows: [string, unknown][] = [
    ["Booking", p.ref], ["Package", b.eventPackage], ["Event date", b.eventDate], ["Guests", b.guests],
    ["Paid now", money(p.amountPaid, cfg)], ["Booking total", b.amount != null ? money(b.amount, cfg) : undefined],
    ["Balance", b.amount != null ? money(Math.max(0, b.amount - p.amountPaid), cfg) : undefined], ["Payment ID", p.paymentId || undefined],
  ];
  const first = String(b.name || "").split(" ")[0] || "there";
  await Promise.all([
    sendMail({
      to: b.email, replyTo: s.email, subject: `Payment received — booking ${p.ref} is confirmed`,
      html: layout(s, {
        preheader: `We've received ${money(p.amountPaid, cfg)}. Your booking is confirmed.`,
        title: `You're confirmed, ${esc(first)}.`,
        body: `<p style="margin:0 0 14px;">We've received your payment and your booking is now confirmed. Your senior planner will be in touch within 24 hours to begin planning.</p>${detailsTable(rows)}`,
        cta: { label: "View your booking", href: `${SITE_URL()}/q/${p.ref}` },
      }),
      text: `Payment received — booking ${p.ref} is confirmed.\n\n${detailsText(rows)}`,
    }, s.siteName),
    sendMail({
      to: adminInbox(s), replyTo: b.email, subject: `Payment received: ${money(p.amountPaid, cfg)} — ${b.name} (${p.ref})`,
      html: layout(s, {
        preheader: `${b.name} paid ${money(p.amountPaid, cfg)} for ${p.ref}`, title: "Payment received", body: detailsTable([["Customer", b.name], ["Email", b.email], ["Phone", b.phone], ...rows]),
        cta: { label: "Open in admin", href: `${SITE_URL()}/admin/bookings/${b._id}` },
      }),
      text: `Payment received\n\n${detailsText(rows)}`,
    }, s.siteName),
  ]).catch(() => {});
  return true;
}
