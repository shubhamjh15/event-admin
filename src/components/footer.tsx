import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SiteSettings } from "@/lib/data";
import { NewsletterForm } from "./forms";

export function Footer({ s, categories }: { s: SiteSettings; categories: any[] }) {
  const socials = [
    ["Instagram", s.socials?.instagram],
    ["Facebook", s.socials?.facebook],
    ["LinkedIn", s.socials?.linkedin],
    ["YouTube", s.socials?.youtube],
  ].filter(([, h]) => h) as [string, string][];

  return (
    <footer className="bg-ink text-paper">
      <div className="wrap">
        {/* Newsletter */}
        <div className="grid gap-10 border-b border-white/15 py-16 md:py-20 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="label text-white/50">The Lit Letter</p>
            <h2 className="display mt-5 text-4xl md:text-6xl">
              Ideas, invitations & <em className="serif-i text-marigold">insider rates.</em>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <NewsletterForm />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-display text-[2rem] italic leading-none">Lit</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.42em]">Concierge</p>
            <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/60">{s.footerAbout}</p>
          </div>
          <div className="lg:col-span-3">
            <p className="label text-[10px] text-white/45">Events</p>
            <ul className="mt-6 space-y-3 text-[15px] text-white/80">
              {categories.slice(0, 8).map((c) => (
                <li key={c.slug}><Link href={`/events?category=${c.slug}`} className="hover:text-marigold">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <p className="label text-[10px] text-white/45">Company</p>
            <ul className="mt-6 space-y-3 text-[15px] text-white/80">
              {[["/about", "About"], ["/services", "Services"], ["/gallery", "Gallery"], ["/blogs", "Journal"], ["/contact", "Enquire"], ["/book", "Book"]].map(([h, l]) => (
                <li key={h}><Link href={h} className="hover:text-marigold">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <p className="label text-[10px] text-white/45">Contact</p>
            <ul className="mt-6 space-y-4 text-[15px] text-white/80">
              <li><a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="font-display text-2xl text-white hover:text-marigold">{s.phone}</a></li>
              <li><a href={`mailto:${s.email}`} className="hover:text-marigold">{s.email}</a></li>
              <li className="text-white/60">{s.address}</li>
              <li className="text-white/60">{s.hours}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noreferrer" className="link text-white/80 hover:text-white">{l} <ArrowUpRight className="h-3 w-3" /></a>
              ))}
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="grid gap-4 border-t border-white/15 py-8 text-xs text-white/55 md:grid-cols-3 md:items-center">
          <p className="label text-[10px] text-marigold">Est. {s.since} · Licensed · Bonded · Insured</p>
          <p className="md:text-center">We accept {s.paymentMethods.join(", ").replace(/, ([^,]*)$/, " & $1")}.</p>
          <p className="md:text-right">© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
