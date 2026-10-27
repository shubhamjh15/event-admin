import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./reveal";
import { Stars } from "./stars";
import { sized } from "@/lib/img";

export { Stars };

export { Wordmark } from "./wordmark";

export function DynIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && (Icons as any)[name]) || Icons.Sparkles;
  return <Cmp className={className} strokeWidth={1.4} />;
}

/** Editorial section heading: "(02) — Label" over a large serif title. */
export function SectionHead({
  index, label, title, italic, text, action, light = false, className = "", center = false,
}: {
  index?: string; label: string; title: string; italic?: string; text?: string; action?: React.ReactNode; light?: boolean; className?: string; center?: boolean;
}) {
  return (
    <Reveal className={`mb-14 md:mb-20 ${className}`}>
      <div className={`flex items-center gap-4 ${center ? "justify-center" : ""} ${light ? "text-white/70" : "text-ink-mute"}`}>
        {index && <span className="font-display text-sm italic">({index})</span>}
        <span className={`h-px w-10 ${light ? "bg-white/40" : "bg-ink/30"}`} />
        <span className="label">{label}</span>
      </div>
      <div className={`mt-6 flex flex-col gap-8 lg:flex-row lg:items-end ${center ? "items-center text-center lg:flex-col lg:items-center" : "lg:justify-between"}`}>
        <h2 className={`display max-w-4xl text-[2.6rem] sm:text-6xl lg:text-[4.6rem] ${light ? "text-white" : "text-ink"}`}>
          {title} {italic && <em className={`serif-i ${light ? "text-white" : "text-rani"}`}>{italic}</em>}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {text && <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${center ? "mx-auto" : ""} ${light ? "text-white/75" : "text-ink-mute"}`}>{text}</p>}
    </Reveal>
  );
}

export function formatPrice(n?: number, currency = "$") {
  if (n == null) return "";
  return `${currency}${n.toLocaleString("en-US")}`;
}

/** Package card: image on top, editorial caption beneath. */
export function PackageCard({ e, currency = "$", categoryName, ratio = "aspect-[4/5]" }: { e: any; currency?: string; categoryName?: string; ratio?: string }) {
  return (
    <Link href={`/events/${e.slug}`} className="group block">
      <div className={`relative overflow-hidden bg-paper-3 ${ratio}`}>
        <img src={sized(e.heroImage, 900)} alt={e.title} loading="lazy" className="img-hover h-full w-full object-cover" />
        {e.featured && <span className="label absolute left-0 top-0 bg-paper px-3 py-2 text-[10px] text-ink">Featured</span>}
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div>
          <p className="label text-[10px] text-rani">{categoryName || e.destination}</p>
          <h3 className="mt-2 font-display text-[1.65rem] leading-[1.1] text-ink decoration-1 underline-offset-4 group-hover:underline">{e.title}</h3>
          <p className="mt-2 text-sm text-ink-mute">{[e.destination, e.duration].filter(Boolean).join(" · ")}</p>
        </div>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-ink/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rani" strokeWidth={1.4} />
      </div>
      {e.price ? (
        <p className="mt-4 border-t border-ink/15 pt-3 text-sm text-ink-soft">
          From <span className="font-display text-lg text-ink">{formatPrice(e.price, currency)}</span>{" "}
          <span className="text-ink-mute">{e.priceNote?.replace(/^starting from,?\s*/i, "")}</span>
        </p>
      ) : null}
    </Link>
  );
}

export function JournalCard({ b, rating, large = false }: { b: any; rating?: { avg: number; count: number }; large?: boolean }) {
  return (
    <Link href={`/blogs/${b.slug}`} className="group block">
      <div className={`overflow-hidden bg-paper-3 ${large ? "aspect-[4/3]" : "aspect-[3/2]"}`}>
        <img src={sized(b.cover, large ? 1400 : 900)} alt={b.title} loading="lazy" className="img-hover h-full w-full object-cover" />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-mute">
        <span className="label text-[10px] text-rani">{b.category}</span>
        <span className="text-xs">{new Date(b.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        {rating && <span className="flex items-center gap-1.5 text-xs"><Stars value={rating.avg} className="h-3 w-3" /> {rating.avg.toFixed(1)}</span>}
      </div>
      <h3 className={`mt-3 font-display leading-[1.12] text-ink decoration-1 underline-offset-4 group-hover:underline ${large ? "text-[2.2rem]" : "text-2xl"}`}>{b.title}</h3>
      <p className={`mt-3 leading-relaxed text-ink-mute ${large ? "text-base" : "line-clamp-2 text-sm"}`}>{b.excerpt}</p>
    </Link>
  );
}

const TONES = {
  rani: "bg-rani text-white",
  marigold: "bg-marigold text-ink",
  peacock: "bg-peacock text-white",
  ink: "bg-ink text-white",
} as const;

/** Full-bleed flat colour block call-to-action. */
export function CtaBlock({
  tone = "rani", label = "Enquiries", title = "Let's make it", italic = "unforgettable.", text,
  primary = { label: "Send an enquiry", href: "/contact" }, secondary = { label: "Book a consultation", href: "/book?type=appointment" }, image,
}: {
  tone?: keyof typeof TONES; label?: string; title?: string; italic?: string; text?: string;
  primary?: { label: string; href: string }; secondary?: { label: string; href: string }; image?: string;
}) {
  const dark = tone !== "marigold";
  return (
    <section className={`${TONES[tone]} relative overflow-hidden`}>
      <div className="wrap grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:items-center">
        <Reveal className={image ? "lg:col-span-7" : "lg:col-span-10"}>
          <p className={`label ${dark ? "text-white/70" : "text-ink/70"}`}>{label}</p>
          <h2 className="display mt-6 text-5xl md:text-7xl">
            {title} <em className="serif-i">{italic}</em>
          </h2>
          {text && <p className={`mt-6 max-w-xl text-lg ${dark ? "text-white/80" : "text-ink/75"}`}>{text}</p>}
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href={primary.href} className={dark ? "btn-paper" : "btn-ink"}>{primary.label}</Link>
            <Link href={secondary.href} className="link">{secondary.label} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </Reveal>
        {image && (
          <Reveal img className="lg:col-span-5">
            <img src={sized(image, 1000)} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/** Credentials strip shown under heroes: est. 1989, licensed/bonded/insured, price promise, payments. */
export function Credentials({ since, priceBadge, payments }: { since: string; priceBadge: string; payments: string[] }) {
  const items = [
    { k: "Established", v: since },
    { k: "Fully", v: "Licensed · Bonded · Insured" },
    { k: "Our promise", v: priceBadge.replace(/\s*—.*$/, "") },
    { k: "We accept", v: payments.slice(0, 4).join(", ") },
  ];
  return (
    <section className="border-b border-ink/15 bg-paper">
      <div className="wrap grid grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <div
            key={it.k}
            className={`py-7 lg:py-9 ${i % 2 ? "border-l border-ink/15 pl-5 sm:pl-8" : "pr-5"} ${i > 1 ? "border-t border-ink/15 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-8" : ""}`}
          >
            <p className="label text-[10px] text-ink-mute">{it.k}</p>
            <p className="mt-2 font-display text-lg leading-snug md:text-xl">{it.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items, light = true }: { items: { label: string; href?: string }[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`label flex flex-wrap items-center gap-3 text-[10px] ${light ? "text-white/70" : "text-ink-mute"}`}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3">
          {it.href ? <Link href={it.href} className={light ? "hover:text-white" : "hover:text-ink"}>{it.label}</Link> : <span className={light ? "text-white" : "text-ink"}>{it.label}</span>}
          {i < items.length - 1 && <span className="h-px w-4 bg-current opacity-50" />}
        </span>
      ))}
    </nav>
  );
}

/** Static full-bleed image hero for detail pages. */
export function ImageHero({ image, children, height = "h-[88svh] min-h-[600px]" }: { image: string; children: React.ReactNode; height?: string }) {
  return (
    <section data-hero className={`relative ${height} overflow-hidden bg-ink`}>
      <img src={sized(image, 2400, 85)} alt="" className="absolute inset-0 h-full w-full animate-slow-zoom object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />
      <div className="wrap relative flex h-full flex-col justify-end pb-14 pt-36 text-white md:pb-20">{children}</div>
    </section>
  );
}
