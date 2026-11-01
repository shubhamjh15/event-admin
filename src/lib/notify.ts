import "server-only";
import { getEvent, getSettings, type SiteSettings } from "./data";
import { settings as defaults } from "./seed-data";
import { adminInbox, detailsTable, detailsText, esc, layout, sendMail, type MailResult } from "./mail";

const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

async function settingsSafe(): Promise<SiteSettings> {
  return getSettings().catch(() => defaults as SiteSettings);
}

/** Human-readable delivery summary stored on the record so the admin can see what was sent. */
function summary(customer: MailResult | null, admin: MailResult) {
  const fmt = (label: string, r: MailResult | null) => (r === null ? null : `${label} ${r.sent ? "sent" : r.skipped ? "skipped (email not configured)" : `failed (${r.error})`}`);
  return [fmt("Customer email", customer), fmt("Admin alert", admin)].filter(Boolean).join(" · ") + ` · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export async function notifyEnquiry(e: Record<string, any>) {
  const s = await settingsSafe();
  const rows: [string, unknown][] = [
    ["Name", e.name], ["Email", e.email], ["Phone", e.phone], ["Occasion", e.eventType], ["Event date", e.eventDate],
    ["Guests", e.guests], ["Budget", e.budget], ["Destination", e.destination], ["Message", e.message], ["Submitted from", e.source],
  ];
  const first = String(e.name || "").split(" ")[0] || "there";
  const [customer, admin] = await Promise.all([
    sendMail({
      to: e.email,
      replyTo: s.email,
      subject: `We've received your enquiry — ${s.siteName}`,
      html: layout(s, {
        preheader: "A senior planner will be in touch within one business day.",
        title: `Thank you, ${esc(first)}.`,
        body: `<p style="margin:0 0 14px;">We've received your enquiry${e.eventType ? ` for <strong>${esc(e.eventType)}</strong>` : ""} and a senior planner will be in touch within one business day with ideas and a tailored proposal.</p>
<p style="margin:0 0 6px;">Here's a copy of what you sent us:</p>${detailsTable(rows.slice(2, 9))}
<p style="margin:18px 0 0;">Need us sooner? Call <a href="tel:${esc(s.phone.replace(/[^\d+]/g, ""))}" style="color:#C41D61;">${esc(s.phone)}</a> or simply reply to this email.</p>`,
        cta: site() ? { label: "Explore our events", href: `${site()}/events` } : undefined,
      }),
      text: `Thank you, ${first}.\n\nWe've received your enquiry and a senior planner will be in touch within one business day.\n\n${detailsText(rows.slice(2, 9))}\n\n${s.siteName} · ${s.phone} · ${s.email}`,
    }, s.siteName),
    sendMail({
      to: adminInbox(s),
      replyTo: e.email,
      subject: `New enquiry: ${e.name}${e.eventType ? ` — ${e.eventType}` : ""}`,
      html: layout(s, {
        preheader: `${e.name} · ${e.eventType || "General enquiry"} · ${e.phone}`,
        title: "New enquiry",
        body: `${detailsTable(rows)}<p style="margin:16px 0 0;">Reply to this email to answer ${esc(first)} directly.</p>`,
        cta: site() && e._id ? { label: "Open in admin", href: `${site()}/admin/enquiries/${e._id}` } : undefined,
      }),
      text: `New enquiry\n\n${detailsText(rows)}`,
    }, s.siteName),
  ]);
  return summary(customer, admin);
}

export async function notifyBooking(b: Record<string, any>) {
  const s = await settingsSafe();
  const pkg = b.eventPackage ? await getEvent(b.eventPackage).catch(() => null) : null;
  const isAppt = b.kind === "appointment";
  const rows: [string, unknown][] = [
    ["Type", isAppt ? "Free consultation" : "Event booking"], ["Name", b.name], ["Email", b.email], ["Phone", b.phone],
    ["Package", pkg?.title || (isAppt ? undefined : "Bespoke / not sure yet")], [isAppt ? "Preferred date" : "Event date", b.eventDate],
    ["Time", b.time], ["Guests", b.guests], ["Meeting", b.mode], ["Payment preference", b.paymentMethod], ["Notes", b.message],
  ];
  const first = String(b.name || "").split(" ")[0] || "there";
  const [customer, admin] = await Promise.all([
    sendMail({
      to: b.email,
      replyTo: s.email,
      subject: isAppt ? `Your consultation request — ${s.siteName}` : `Your booking request — ${s.siteName}`,
      html: layout(s, {
        preheader: isAppt ? "We'll confirm your consultation time shortly." : "Your planner will confirm availability within 24 hours.",
        title: isAppt ? `See you soon, ${esc(first)}.` : `Request received, ${esc(first)}.`,
        body: `<p style="margin:0 0 14px;">${isAppt ? "Thank you for booking a free consultation. We'll confirm your time by email shortly." : "Thank you for your booking request. Your planner will confirm availability, final pricing and payment details within 24 hours."}</p>
<p style="margin:0 0 6px;">Your request:</p>${detailsTable(rows.filter(([k]) => !["Name", "Email"].includes(k)))}
<p style="margin:18px 0 0;">Questions? Call <a href="tel:${esc(s.phone.replace(/[^\d+]/g, ""))}" style="color:#C41D61;">${esc(s.phone)}</a> or reply to this email.</p>`,
        cta: pkg && site() ? { label: "View your package", href: `${site()}/events/${pkg.slug}` } : undefined,
      }),
      text: `${isAppt ? "Consultation request received" : "Booking request received"}.\n\n${detailsText(rows)}\n\n${s.siteName} · ${s.phone} · ${s.email}`,
    }, s.siteName),
    sendMail({
      to: adminInbox(s),
      replyTo: b.email,
      subject: `New ${isAppt ? "consultation" : "booking"}: ${b.name}${pkg ? ` — ${pkg.title}` : ""} (${b.eventDate})`,
      html: layout(s, {
        preheader: `${b.name} · ${b.eventDate} · ${b.phone}`,
        title: isAppt ? "New consultation request" : "New booking request",
        body: detailsTable(rows),
        cta: site() && b._id ? { label: "Open in admin", href: `${site()}/admin/bookings/${b._id}` } : undefined,
      }),
      text: `New ${isAppt ? "consultation" : "booking"}\n\n${detailsText(rows)}`,
    }, s.siteName),
  ]);
  return summary(customer, admin);
}

export async function notifyTestimonial(t: Record<string, any>) {
  const s = await settingsSafe();
  const rows: [string, unknown][] = [["Name", t.name], ["Event", t.role], ["Rating", `${t.rating} / 5`], ["Email", t.email], ["Testimonial", t.quote]];
  const admin = await sendMail({
    to: adminInbox(s),
    replyTo: t.email,
    subject: `New testimonial awaiting approval — ${t.name}`,
    html: layout(s, {
      preheader: `${t.name} left a ${t.rating}-star testimonial`,
      title: "New testimonial to review",
      body: `${detailsTable(rows)}<p style="margin:16px 0 0;">It stays hidden until you approve it in the admin.</p>`,
      cta: site() && t._id ? { label: "Review in admin", href: `${site()}/admin/testimonials/${t._id}` } : undefined,
    }),
    text: `New testimonial awaiting approval\n\n${detailsText(rows)}`,
  }, s.siteName);
  return summary(null, admin);
}
