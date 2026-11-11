import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Check } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Booking, Quote } from "@/lib/models";
import { getEvent, getSettings } from "@/lib/data";
import { assistantLabel, commerceConfig, money, quoteView } from "@/lib/commerce/engine";
import { paymentsEnabled } from "@/lib/commerce/payments";
import { sized } from "@/lib/img";
import { QuoteBookForm } from "@/components/quote-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your quote", robots: { index: false, follow: false } };

type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ pay?: string }> };

const PAY_NOTICE: Record<string, [string, string]> = {
  success: ["ok", "Payment received — thank you. Your booking is confirmed and a receipt is on its way to your inbox."],
  cancelled: ["warn", "The payment wasn't completed. You can try again below whenever you're ready."],
  pending: ["warn", "We're waiting for the payment provider to confirm. This page updates once it does."],
  payments_disabled: ["warn", "Online payment isn't available right now. Your planner will send payment details."],
  already_paid: ["ok", "This deposit has already been paid."],
  busy: ["warn", "Too many attempts. Please wait a minute and try again."],
  error: ["warn", "We couldn't open the payment page. Please try again, or call us."],
};

const fmtDate = (iso?: string) => (iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");
const pad = (n: number) => String(n).padStart(2, "0");

export default async function QuotePage({ params, searchParams }: Props) {
  const ref = (await params).ref.toUpperCase();
  const { pay } = await searchParams;
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
  const online = paymentsEnabled();
  const paid = booking && ["deposit-paid", "paid"].includes(booking.paymentStatus);
  const fm = (n: number) => money(n, cfg);
  const notice = pay ? PAY_NOTICE[pay] || PAY_NOTICE.error : null;
  const expires = q.expiresAt ? new Date(q.expiresAt) : null;
  const assistant = doc.channel !== "web" ? assistantLabel(doc.agent) : null;
  const statusLabel = paid ? "Confirmed" : booking ? (booking.status === "cancelled" ? "Cancelled" : "Deposit due") : q.status === "open" ? "Open" : q.status === "expired" ? "Expired" : "Closed";

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
                  <dd className={`mt-2 font-display text-xl ${k === "Status" ? (paid ? "text-peacock" : q.status === "expired" ? "text-rani" : "") : ""}`}>{v}</dd>
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

      {notice && (
        <div role="status" className={`${notice[0] === "ok" ? "bg-peacock text-white" : "bg-marigold text-ink"}`}>
          <p className="wrap py-4 text-sm font-medium">{notice[1]}</p>
        </div>
      )}

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
          <p className="mt-4 text-sm text-ink-mute">Deposit to confirm: <strong className="text-ink">{q.depositFormatted}</strong> ({q.depositPercent}%). Balance per your planner's payment schedule.</p>

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
            {paid ? (
              <div role="status">
                <span className="grid h-14 w-14 place-items-center border border-peacock text-peacock"><Check className="h-6 w-6" strokeWidth={1.4} /></span>
                <h2 className="display mt-6 text-4xl">You're confirmed.</h2>
                <p className="mt-4 leading-relaxed text-ink-mute">We've received {fm(booking.paidAmount || booking.deposit)}. Your senior planner will be in touch within 24 hours to start planning.</p>
              </div>
            ) : booking ? (
              booking.status === "cancelled" ? (
                <div><h2 className="display text-4xl">Booking cancelled.</h2><p className="mt-4 text-ink-mute">Questions? Call {s.phone}.</p></div>
              ) : (
                <div>
                  <p className="label text-[10px] text-ink-mute">Booked · price locked</p>
                  <h2 className="display mt-3 text-4xl">Pay the deposit to confirm.</h2>
                  <p className="display mt-6 text-5xl">{fm(booking.deposit)}</p>
                  {online && booking.paymentMethod === "Online" ? (
                    <>
                      <a href={`/api/pay/${ref}`} className="btn-ink mt-8 w-full">Pay securely</a>
                      <p className="mt-3 text-xs text-ink-mute">Cards, UPI and net banking via Razorpay. We never see your card details.</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{cfg.paymentInstructions || `Your planner will share how to pay${booking.paymentMethod ? ` by ${booking.paymentMethod.toLowerCase()}` : ""} within 24 hours.`}</p>
                      {online && <a href={`/api/pay/${ref}`} className="btn-outline mt-6 w-full">Or pay online now</a>}
                    </>
                  )}
                </div>
              )
            ) : q.status === "open" ? (
              <div>
                <p className="label text-[10px] text-ink-mute">Book at this price</p>
                <h2 className="display mt-3 text-4xl">Lock it in.</h2>
                {expires && <p className="mt-3 text-sm text-ink-mute">Price held until {expires.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST.</p>}
                <div className="mt-8">
                  <QuoteBookForm quoteRef={ref} total={q.totalFormatted} deposit={q.depositFormatted} methods={s.paymentMethods} online={online} defaults={{ name: doc.customerName, email: doc.customerEmail }} />
                </div>
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
            <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="mt-8 block border-t border-ink/15 pt-6 text-sm text-ink-mute hover:text-rani">Questions? <span className="font-display text-xl text-ink">{s.phone}</span></a>
          </div>
        </aside>
      </section>
    </>
  );
}
