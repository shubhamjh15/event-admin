import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Inbox, MessageSquare, Newspaper, PartyPopper, Plus, Mail, Eye } from "lucide-react";
import { dbConnect } from "@/lib/db";
import * as M from "@/lib/models";
import { ENQUIRY_STATUS } from "@/lib/resources";
import { StatusBadge } from "@/components/admin/badges";

export default async function Dashboard() {
  await dbConnect();
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1);
  since.setHours(0, 0, 0, 0);
  const today = new Date().toISOString().slice(0, 10);

  const [
    enquiriesTotal, enquiriesNew, bookingsPending, appointmentsUpcoming, eventsCount, blogsCount, commentsPending, subscribers,
    recentEnquiries, upcoming, pendingComments, topBlogs, byStatus, byMonth,
  ] = await Promise.all([
    M.Enquiry.countDocuments(),
    M.Enquiry.countDocuments({ status: "new" }),
    M.Booking.countDocuments({ status: "pending" }),
    M.Booking.countDocuments({ kind: "appointment", eventDate: { $gte: today }, status: { $ne: "cancelled" } }),
    M.Event.countDocuments(),
    M.Blog.countDocuments(),
    M.Comment.countDocuments({ approved: { $ne: true } }),
    M.Subscriber.countDocuments({ active: true }),
    M.Enquiry.find().sort({ createdAt: -1 }).limit(6).lean(),
    M.Booking.find({ eventDate: { $gte: today }, status: { $ne: "cancelled" } }).sort({ eventDate: 1 }).limit(6).lean(),
    M.Comment.find({ approved: { $ne: true } }).sort({ createdAt: -1 }).limit(4).lean(),
    M.Blog.find().sort({ views: -1 }).limit(4).select("title slug views").lean(),
    M.Enquiry.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    M.Enquiry.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, n: { $sum: 1 } } },
    ]),
  ]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    const hit = byMonth.find((x: any) => x._id.y === d.getFullYear() && x._id.m === d.getMonth() + 1);
    return { label: d.toLocaleString("en-US", { month: "short" }), n: hit?.n || 0 };
  });
  const maxMonth = Math.max(1, ...months.map((m) => m.n));
  const statusCount = Object.fromEntries(byStatus.map((s: any) => [s._id, s.n]));

  const stats = [
    { label: "Total enquiries", value: enquiriesTotal, sub: `${enquiriesNew} new`, href: "/admin/enquiries", I: Inbox },
    { label: "Pending bookings", value: bookingsPending, sub: `${appointmentsUpcoming} upcoming appointments`, href: "/admin/bookings", I: CalendarCheck },
    { label: "Event packages", value: eventsCount, sub: "Live in catalogue", href: "/admin/events", I: PartyPopper },
    { label: "Blog posts", value: blogsCount, sub: `${commentsPending} comments awaiting`, href: "/admin/blogs", I: Newspaper },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-ink-mute">A snapshot of enquiries, bookings and content across your site.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/events/new" className="btn-dark !py-2.5"><Plus className="h-4 w-4" /> New event</Link>
          <Link href="/admin/blogs/new" className="btn-soft !py-2.5"><Plus className="h-4 w-4" /> New post</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, href, I }, i) => (
          <Link key={label} href={href} className={`group relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5 ${i === 0 ? "bg-ink text-white" : "bg-white ring-1 ring-ink/5"}`}>
            {i === 0 && <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose/40 blur-3xl" />}
            <div className="relative flex items-start justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${i === 0 ? "bg-lit text-white" : "bg-ivory-deep text-rose"}`}><I className="h-5 w-5" /></span>
              <ArrowUpRight className={`h-5 w-5 transition group-hover:rotate-45 ${i === 0 ? "text-white/50" : "text-ink/30"}`} />
            </div>
            <p className="relative mt-5 font-display text-4xl font-semibold">{value}</p>
            <p className={`relative mt-1 text-sm font-semibold ${i === 0 ? "text-white/80" : "text-ink"}`}>{label}</p>
            <p className={`relative text-xs ${i === 0 ? "text-white/50" : "text-ink-mute"}`}>{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Enquiries per month</h2>
              <p className="text-xs text-ink-mute">Last 6 months</p>
            </div>
            <Link href="/admin/enquiries" className="text-xs font-semibold text-rose">View all</Link>
          </div>
          <div className="relative mt-8 h-56" role="img" aria-label={`Enquiries per month: ${months.map((m) => `${m.label} ${m.n}`).join(", ")}`}>
            {[0, 0.5, 1].map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-ink/5" style={{ bottom: `${t * 100}%` }}>
                <span className="absolute -top-2 left-0 text-[10px] text-ink-mute">{Math.round(maxMonth * t)}</span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px] pl-8">
              {months.map((m) => (
                <div key={m.label} className="group relative flex h-full flex-1 items-end justify-center">
                  <div className="w-full max-w-[44px] rounded-t-[4px] bg-rose transition group-hover:bg-ink" style={{ height: `${(m.n / maxMonth) * 100}%`, minHeight: m.n ? 4 : 0 }} />
                  <span className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100" style={{ bottom: `calc(${(m.n / maxMonth) * 100}% + 8px)`, top: "auto" }}>
                    {m.label}: {m.n} enquir{m.n === 1 ? "y" : "ies"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-[2px] pl-8">
            {months.map((m) => <span key={m.label} className="flex-1 text-center text-xs text-ink-mute">{m.label}</span>)}
          </div>
          <table className="sr-only">
            <caption>Enquiries per month</caption>
            <tbody>{months.map((m) => <tr key={m.label}><th>{m.label}</th><td>{m.n}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="font-display text-xl font-semibold">Enquiry pipeline</h2>
          <p className="text-xs text-ink-mute">By status</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {ENQUIRY_STATUS.map((s) => (
              <Link key={s} href={`/admin/enquiries?status=${s}`} className="rounded-2xl bg-[#F6F3F8] p-4 transition hover:ring-1 hover:ring-rose">
                <p className="font-display text-3xl font-semibold">{statusCount[s] || 0}</p>
                <div className="mt-1"><StatusBadge value={s} /></div>
              </Link>
            ))}
            <Link href="/admin/subscribers" className="rounded-2xl bg-ink p-4 text-white">
              <p className="font-display text-3xl font-semibold">{subscribers}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-white/70"><Mail className="h-3 w-3" /> Subscribers</p>
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="text-xs font-semibold text-rose">View all</Link>
          </div>
          <div className="divide-y divide-ink/5">
            {recentEnquiries.map((e: any) => (
              <Link key={String(e._id)} href={`/admin/enquiries/${e._id}`} className="flex items-center gap-4 py-3 hover:bg-ivory/60">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ivory-deep font-semibold text-rose">{e.name?.[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.name}</span>
                  <span className="block truncate text-xs text-ink-mute">{e.eventType || "General"} · {e.guests ? `${e.guests} guests · ` : ""}{new Date(e.createdAt).toLocaleDateString()}</span>
                </span>
                <StatusBadge value={e.status} />
              </Link>
            ))}
            {!recentEnquiries.length && <p className="py-6 text-center text-sm text-ink-mute">No enquiries yet.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Upcoming bookings & appointments</h2>
            <Link href="/admin/bookings" className="text-xs font-semibold text-rose">View all</Link>
          </div>
          <div className="divide-y divide-ink/5">
            {upcoming.map((b: any) => {
              const d = new Date(b.eventDate);
              return (
                <Link key={String(b._id)} href={`/admin/bookings/${b._id}`} className="flex items-center gap-4 py-3 hover:bg-ivory/60">
                  <span className="w-12 shrink-0 rounded-xl bg-ink py-1.5 text-center text-white">
                    <span className="block text-[10px] font-bold uppercase">{d.toLocaleString("en-US", { month: "short" })}</span>
                    <span className="block font-display text-lg font-semibold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{b.name}</span>
                    <span className="block truncate text-xs text-ink-mute">{b.kind === "appointment" ? `Consultation · ${b.time || ""} · ${b.mode || ""}` : b.eventPackage || "Custom event"}</span>
                  </span>
                  <StatusBadge value={b.status} />
                </Link>
              );
            })}
            {!upcoming.length && <p className="py-6 text-center text-sm text-ink-mute">Nothing scheduled.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><MessageSquare className="h-5 w-5 text-rose" /> Comments awaiting approval</h2>
            <Link href="/admin/comments?approved=false" className="text-xs font-semibold text-rose">Moderate</Link>
          </div>
          <div className="space-y-3">
            {pendingComments.map((c: any) => (
              <Link key={String(c._id)} href={`/admin/comments/${c._id}`} className="block rounded-2xl bg-[#F6F3F8] p-4 hover:ring-1 hover:ring-rose">
                <p className="text-sm font-semibold">{c.name} <span className="font-normal text-ink-mute">on {c.blog}</span></p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{c.text}</p>
              </Link>
            ))}
            {!pendingComments.length && <p className="py-6 text-center text-sm text-ink-mute">All caught up ✦</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><Eye className="h-5 w-5 text-rose" /> Most-read posts</h2>
          <div className="divide-y divide-ink/5">
            {topBlogs.map((b: any, i: number) => (
              <Link key={String(b._id)} href={`/admin/blogs/${b._id}`} className="flex items-center gap-4 py-3">
                <span className="font-display text-2xl font-semibold text-ink/20">{i + 1}</span>
                <span className="flex-1 truncate font-medium">{b.title}</span>
                <span className="text-sm font-semibold text-ink-mute">{b.views?.toLocaleString("en-US")}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
