import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Check, Phone } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Booking, Quote } from "@/lib/models";
import { getEvent, getSettings } from "@/lib/data";
import { assistantLabel, commerceConfig, money, quoteView } from "@/lib/commerce/engine";
import { sized } from "@/lib/img";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your quote", robots: { index: false, follow: false } };

type Props = { params: Promise<{ ref: string }> };

const fmtDate = (iso?: string) => (iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");
const pad = (n: number) => String(n).padStart(2, "0");

export default async function QuotePage({ params }: Props) {
  const ref = (await params).ref.toUpperCase();
  if (!/^LQ-[A-Z0-9]{8}$/.test(ref)) notFound();
  await dbConnect();
  const [doc, booking, s]: any[] = await Promise.all([
    Quote.findOne({ ref }).lean(),
    Booking.findOne({ quoteRef: ref }).sort({ createdAt: -1 }).lean(),
    getSettings(),
  ]);
  if (!doc) notFound();
  const cfg = commerceConfig(s);
  const q = quoteView(doc, cfg);
  const event = await getEvent(q.package.slug).catch(() => null);
  const confirmed = booking && ["confirmed", "completed"].includes(booking.status);
  const cancelled = booking?.status === "cancelled" || q.status === "withdrawn";
  const fm = (n: number) => money(n, cfg);
  const expires = q.expiresAt ? new Date(q.expiresAt) : null;
  const assistant = doc.channel !== "web" ? assistantLabel(doc.agent) : null;
  const statusLabel = confirmed ? "Confirmed" : cancelled ? "Cancelled" : booking ? "Price locked" : q.status === "open" ? "Open" : q.status === "expired" ? "Expired" : "Closed";
  const phoneHref = `tel:${s.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <section className="border-b border-ink/15 bg-paper pt-[120px] md:pt-[150px]">
        <div className="wrap grid grid-cols-1 gap-10 pb-14 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-8">
            <p className="label flex flex-wrap items-center gap-3 text-ink-mute">
              <span>Your quote</span><span className="h-px w-8 bg-ink/30" /><span className="font-mono tracking-normal text-ink">{q.quoteRef}</span>
              {assistant && <span className="inline-flex items-center gap-1.5 border border-ink/20 px-2 py-1 normal-case tracking-normal"><Bot className="h-3.5 w-3.5" /> Prepared with {assistant}</span>}
            </p>
            <h1 className="display mt-6 break-words text-[2.6rem] sm:text-5xl md:text-7xl">{q.package.title}</h1>
            <dl className="mt-10 grid grid-cols-2 border-t border-ink/15 md:grid-cols-4">
              {[
                ["Date", fmtDate(q.eventDate)],
                ["Guests", String(q.guests)],
                ...(q.days ? [["Days", String(q.days)]] : []),
                ["Destination", event?.destination || "—"],
                ["Status", statusLabel],
              ].slice(0, 4).map(([k, v], i) => (
                <div key={k} className={`py-6 ${i % 2 ? "border-l border-ink/15 pl-5" : "pr-5"} ${i > 1 ? "border-t border-ink/15 md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-5" : ""}`}>
                  <dt className="label text-[10px] text-ink-mute">{k}</dt>
                  <dd className={`mt-2 font-display text-xl ${k === "Status" ? (confirmed ? "text-peacock" : q.status === "expired" || cancelled ? "text-rani" : "") : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {event?.heroImage && (
            <div className="hidden lg:col-span-4 lg:block">
              <img src={sized(event.heroImage, 900, 80)} alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="wrap grid grid-cols-1 gap-16 py-12 md:py-24 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <div className="mb-8 flex items-center gap-4 text-ink-mute">
            <h2 className="label">The statement</h2>
            <span className="h-px flex-1 bg-ink/15" />
            <span className="font-display text-sm italic">{q.currency}</span>
          </div>
          <table className="w-full text-[15px]">
            <tbody>
              {q.lineItems.map((l, i) => (
                <tr key={i} className="border-b border-ink/10 align-baseline">
                  <td className="py-4 pr-6 text-ink-soft">{l.label}</td>
                  <td className={`whitespace-nowrap py-4 text-right tabular-nums ${l.amount < 0 ? "text-peacock" : ""}`}>{l.amount < 0 ? `− ${fm(-l.amount)}` : l.formatted}</td>
                </tr>
              ))}
              <tr className="border-b border-ink/10"><td className="py-4 pr-6 text-ink-soft">Package price</td><td className="py-4 text-right tabular-nums">{fm(q.priceExTax)}</td></tr>
              <tr className="border-b border-ink/30"><td className="py-4 pr-6 text-ink-soft">{q.tax.label}</td><td className="py-4 text-right tabular-nums">{fm(q.tax.amount)}</td></tr>
            </tbody>
          </table>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-[10px] text-ink-mute">Total, all taxes included</p>
              <p className="display mt-2 text-[clamp(2.75rem,12vw,4.5rem)]">{q.totalFormatted}</p>
            </div>
            {q.savings > 0 && (
              <p className="bg-marigold px-4 py-2 text-sm font-semibold">You save {q.savingsFormatted}</p>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-mute">Nothing to pay online. Your planner confirms availability and the payment schedule with you on WhatsApp.</p>

          {q.complimentary.length > 0 && (
            <div className="mt-20">
              <div className="mb-6 flex items-center gap-4 text-ink-mute"><h2 className="label">Complimentary with this quote</h2><span className="h-px flex-1 bg-ink/15" /></div>
              <ol className="border-t border-ink/15">
                {q.complimentary.map((p, i) => (
                  <li key={p} className="grid grid-cols-[3rem_1fr] items-baseline border-b border-ink/10 py-4">
                    <span className="font-display text-2xl italic text-marigold-deep">{pad(i + 1)}</span><span className="text-ink-soft">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {q.includes.length > 0 && (
            <div className="mt-20">
              <div className="mb-6 flex items-center gap-4 text-ink-mute"><h2 className="label">Included in the package</h2><span className="h-px flex-1 bg-ink/15" /></div>
              <ul className="grid gap-x-10 sm:grid-cols-2">
                {q.includes.map((x) => <li key={x} className="flex items-baseline gap-4 border-b border-ink/10 py-4 text-ink-soft"><span className="text-rani">—</span> {x}</li>)}
              </ul>
            </div>
          )}

          {q.negotiation.history.length > 0 && (
            <div className="mt-20">
              <div className="mb-6 flex items-center gap-4 text-ink-mute"><h2 className="label">How the price was negotiated</h2><span className="h-px flex-1 bg-ink/15" /></div>
              <ol className="border-l border-ink/20 pl-6">
                {q.negotiation.history.map((h, i) => (
                  <li key={i} className="relative pb-8 last:pb-0">
                    <span className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 ${h.response === "accepted" ? "bg-peacock" : h.response === "final" ? "bg-rani" : "bg-marigold"}`} />
                    <p className="label text-[10px] text-ink-mute">Round {i + 1} · {h.response}</p>
                    <p className="mt-2 font-display text-xl">
                      {h.offer ? <>Offered {fm(h.offer)}</> : "Price-match request"} <span className="text-ink-mute">→</span> {fm(h.priceAfter)}
                    </p>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-mute">{h.message}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <ul className="mt-16 space-y-2 text-sm text-ink-mute">
            {q.notes.map((n) => <li key={n}>{n}</li>)}
            <li>{s.siteName} is licensed, bonded and insured, and has been in business since {s.since}.</li>
          </ul>
        </div>

        <aside className="order-first min-w-0 lg:order-none lg:col-span-5 lg:pl-6">
          <div className="border border-ink/15 bg-white/60 p-7 md:p-9 lg:sticky lg:top-28">
            {confirmed ? (
              <div role="status">
                <span className="grid h-14 w-14 place-items-center border border-peacock text-peacock"><Check className="h-6 w-6" strokeWidth={1.4} /></span>
                <h2 className="display mt-6 text-4xl">You're confirmed.</h2>
                <p className="mt-4 leading-relaxed text-ink-mute">Your planner has confirmed this booking at {fm(booking.amount ?? q.total)} and will keep in touch on WhatsApp.</p>
                {cfg.whatsapp && <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noreferrer" className="btn-outline mt-8 w-full"><WhatsAppIcon className="h-4 w-4" /> Message your planner</a>}
              </div>
            ) : cancelled ? (
              <div>
                <h2 className="display text-4xl">This booking is cancelled.</h2>
                <p className="mt-4 leading-relaxed text-ink-mute">Ask your assistant for a fresh quote, or talk to us directly.</p>
                <Link href={`/events/${q.package.slug}`} className="btn-outline mt-8 w-full">View the package</Link>
              </div>
            ) : q.bookOnWhatsAppUrl ? (
              <div>
                <p className="label text-[10px] text-ink-mute">{booking ? "Price locked" : "Book at this price"}</p>
                <h2 className="display mt-3 text-4xl">{booking ? "Send it to your planner." : "Book on WhatsApp."}</h2>
                <p className="display mt-6 text-5xl">{q.totalFormatted}</p>
                <p className="mt-1 text-xs text-ink-mute">incl. {q.tax.label}</p>
                <a href={q.bookOnWhatsAppUrl} target="_blank" rel="noreferrer" className="btn mt-8 w-full bg-[#1FAF54] text-white hover:bg-ink">
                  <WhatsAppIcon className="h-4 w-4" /> Book on WhatsApp
                </a>
                <ol className="mt-6 space-y-2 text-sm leading-relaxed text-ink-mute">
                  <li><span className="font-display italic text-ink">01</span>&ensp;WhatsApp opens with this quote already typed. Just tap send.</li>
                  <li><span className="font-display italic text-ink">02</span>&ensp;A senior planner confirms availability and payment with you within 24 hours.</li>
                </ol>
                {expires && q.status === "open" && <p className="mt-6 border-t border-ink/15 pt-4 text-xs text-ink-mute">Price held until {expires.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST.</p>}
              </div>
            ) : (
              <div>
                <h2 className="display text-4xl">This quote has {q.status === "expired" ? "expired" : "closed"}.</h2>
                <p className="mt-4 leading-relaxed text-ink-mute">Prices are held for a limited time. Ask your assistant for a fresh quote, or book directly with us.</p>
                <div className="mt-8 space-y-3">
                  <Link href={`/book?package=${q.package.slug}`} className="btn-ink w-full">Book this package</Link>
                  <Link href={`/events/${q.package.slug}`} className="btn-outline w-full">View the package</Link>
                </div>
              </div>
            )}
            <a href={phoneHref} className="mt-8 flex items-center gap-3 border-t border-ink/15 pt-6 text-sm text-ink-mute hover:text-rani"><Phone className="h-4 w-4" strokeWidth={1.5} /> Prefer to call? <span className="font-display text-xl text-ink">{s.phone}</span></a>
          </div>
        </aside>
      </section>
    </>
  );
}
