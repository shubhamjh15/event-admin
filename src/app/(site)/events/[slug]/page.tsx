import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { docMetadata, getCategory, getEvent, getEvents, getSettings } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { Reveal } from "@/components/reveal";
import { Breadcrumbs, CtaBlock, ImageHero, PackageCard, formatPrice } from "@/components/ui";
import { PhotoStrip } from "@/components/interactive";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) return {};
  return docMetadata(e, { title: e.title, description: e.summary, image: e.heroImage }, `/events/${slug}`);
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function EventDetail({ params }: Props) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) notFound();
  const [s, cat, related] = await Promise.all([getSettings(), getCategory(e.category), getEvents({ category: e.category, slug: { $ne: slug } }, 3)]);

  const facts = [
    ["Destination", e.destination],
    ["Duration", e.duration],
    ["Guests", e.guests],
    ["From", e.price ? formatPrice(e.price, s.currency) : null],
  ].filter(([, v]) => v) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: e.title,
    description: e.summary,
    image: [e.heroImage, ...(e.gallery || [])],
    brand: { "@type": "Brand", name: s.siteName },
    offers: e.price ? { "@type": "Offer", price: e.price, priceCurrency: "USD", availability: "https://schema.org/InStock" } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ImageHero image={e.heroImage}>
        <Breadcrumbs items={[{ label: "Events", href: "/events" }, ...(cat ? [{ label: cat.name, href: `/events?category=${cat.slug}` }] : []), { label: e.title }]} />
        <h1 className="display mt-6 max-w-5xl text-[3.2rem] sm:text-7xl lg:text-[6rem]">{e.title}</h1>
      </ImageHero>

      {/* Facts bar */}
      <section className="border-b border-ink/15">
        <div className="wrap grid grid-cols-2 md:grid-cols-4">
          {facts.map(([k, v], i) => (
            <div key={k} className={`py-7 ${i % 2 ? "border-l border-ink/15 pl-5 md:pl-8" : "pr-5"} ${i > 1 ? "border-t border-ink/15 md:border-t-0" : ""} ${i === 2 ? "md:border-l md:pl-8" : ""}`}>
              <p className="label text-[10px] text-ink-mute">{k}</p>
              <p className="mt-2 font-display text-xl md:text-2xl">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap grid gap-16 py-20 md:py-28 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Reveal>
            <p className="display text-3xl leading-snug md:text-[2.4rem]">{e.summary}</p>
            <div className="prose-lux mt-10 max-w-2xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(e.description) }} />
          </Reveal>

          {e.gallery?.length > 0 && (
            <Reveal className="mt-16">
              <PhotoStrip images={[e.heroImage, ...e.gallery]} title={e.title} />
            </Reveal>
          )}

          {e.itinerary?.length > 0 && (
            <div className="mt-24">
              <Reveal className="mb-10 flex items-center gap-4 text-ink-mute">
                <span className="label">The itinerary</span>
                <span className="h-px flex-1 bg-ink/15" />
                <span className="font-display text-sm italic">{pad(e.itinerary.length)} chapters</span>
              </Reveal>
              <ol className="border-t border-ink/15">
                {e.itinerary.map((d: any, i: number) => (
                  <Reveal as="li" key={i} delay={i * 70} className="grid gap-3 border-b border-ink/15 py-9 sm:grid-cols-[10rem_1fr] sm:gap-8">
                    <div>
                      <p className="label text-[10px] text-rani">{d.day}</p>
                      <p className="mt-1 font-display text-4xl italic text-ink/20">{pad(i + 1)}</p>
                    </div>
                    <div>
                      <h3 className="font-display text-[1.75rem] leading-tight">{d.title}</h3>
                      <p className="mt-3 max-w-xl leading-relaxed text-ink-mute">{d.details}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          )}

          {e.inclusions?.length > 0 && (
            <Reveal className="mt-24">
              <div className="mb-8 flex items-center gap-4 text-ink-mute">
                <span className="label">What's included</span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>
              <ul className="grid gap-x-10 sm:grid-cols-2">
                {e.inclusions.map((x: string) => (
                  <li key={x} className="flex items-baseline gap-4 border-b border-ink/10 py-4 text-ink-soft">
                    <span className="text-rani">—</span> {x}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <aside className="lg:col-span-4 lg:pl-4">
          <div className="border border-ink/15 bg-white/50 p-8 lg:sticky lg:top-28">
            <p className="label text-[10px] text-ink-mute">Starting from</p>
            <p className="display mt-3 text-6xl">{formatPrice(e.price, s.currency)}</p>
            <p className="mt-2 text-sm text-ink-mute">{e.priceNote}</p>
            <div className="mt-8 space-y-3">
              <Link href={`/book?package=${e.slug}`} className="btn-ink w-full">Book this package</Link>
              <Link href={`/contact?type=${encodeURIComponent(cat?.name || "")}`} className="btn-outline w-full">Customise & enquire</Link>
            </div>
            <dl className="mt-8 space-y-4 border-t border-ink/15 pt-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-mute">Price promise</dt><dd className="text-right">Lower than online</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-mute">Credentials</dt><dd className="text-right">Licensed · Bonded · Insured</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-mute">Payment</dt><dd className="text-right">{s.paymentMethods.slice(0, 4).join(", ")}</dd></div>
            </dl>
            <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="mt-8 block border-t border-ink/15 pt-6 font-display text-2xl hover:text-rani">{s.phone}</a>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="border-t border-ink/15 bg-paper-2 py-24">
          <div className="wrap">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 className="display text-4xl md:text-5xl">More {cat?.name?.toLowerCase() || "events"} <em className="serif-i text-rani">to consider</em></h2>
              {cat && <Link href={`/events?category=${cat.slug}`} className="link hidden sm:inline-flex">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            </div>
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <PackageCard key={r.slug} e={r} currency={s.currency} categoryName={cat?.name} />)}
            </div>
          </div>
        </section>
      )}
      <CtaBlock tone="rani" label="Make it yours" title="Every itinerary is" italic="yours to shape." text="Menus, activities, agendas and more — fully customisable." image={e.gallery?.[0]} />
    </>
  );
}
