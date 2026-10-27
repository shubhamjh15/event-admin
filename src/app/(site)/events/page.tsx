import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { docMetadata, getBanners, getCategories, getCategory, getDestinations, getEvents, getSettings, pageMetadata } from "@/lib/data";
import { sized } from "@/lib/img";
import { BannerCarousel } from "@/components/carousel";
import { Reveal } from "@/components/reveal";
import { CtaBlock, ImageHero, PackageCard, SectionHead } from "@/components/ui";

type Props = { searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { category } = await searchParams;
  if (category) {
    const c = await getCategory(category);
    if (c) return docMetadata(c, { title: `${c.name} — Event Packages`, description: c.description, image: c.image }, `/events?category=${c.slug}`);
  }
  return pageMetadata("events", "/events");
}

const pad = (n: number) => String(n).padStart(2, "0");

function CategoryNav({ categories, active }: { categories: any[]; active?: string }) {
  return (
    <nav aria-label="Event categories" className="sticky top-[78px] z-30 border-b border-ink/15 bg-paper/95 backdrop-blur">
      <div className="wrap no-scrollbar flex gap-8 overflow-x-auto">
        <Link href="/events" scroll={false} className={`label relative shrink-0 py-5 text-[11px] ${!active ? "text-ink" : "text-ink-mute hover:text-ink"}`}>
          All
          {!active && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-rani" />}
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/events?category=${c.slug}`} scroll={false} className={`label relative shrink-0 py-5 text-[11px] ${active === c.slug ? "text-ink" : "text-ink-mute hover:text-ink"}`}>
            {c.name}
            {active === c.slug && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-rani" />}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function BespokeCard({ name, span }: { name: string; span: number }) {
  return (
    <Reveal className={span === 2 ? "sm:col-span-1 lg:col-span-2" : ""}>
      <Link
        href={`/contact?type=${encodeURIComponent(name)}`}
        className={`group flex h-full flex-col justify-between border border-ink/20 p-8 transition-colors duration-500 hover:border-ink hover:bg-ink hover:text-paper md:p-10 ${span === 2 ? "min-h-[360px] lg:min-h-0" : "aspect-[4/5] sm:aspect-auto sm:min-h-full"}`}
      >
        <span className="label text-[10px] text-rani">Bespoke</span>
        <span className={span === 2 ? "max-w-lg" : ""}>
          <span className={`display block ${span === 2 ? "text-5xl md:text-6xl" : "text-4xl"}`}>Something <em className="serif-i">entirely yours?</em></span>
          <span className="mt-4 block text-[15px] leading-relaxed text-ink-mute group-hover:text-paper/70">Share your idea and we'll design a {name.toLowerCase()} package around it — fully customised, priced lower than online.</span>
          <span className="link mt-8">Enquire <ArrowUpRight className="h-3.5 w-3.5" /></span>
        </span>
      </Link>
    </Reveal>
  );
}

export default async function EventsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [s, banners, categories, events, destinations] = await Promise.all([getSettings(), getBanners("events"), getCategories(), getEvents(), getDestinations()]);
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const activeCat = categories.find((c) => c.slug === category);

  /* ---------- Single category view ---------- */
  if (activeCat) {
    const list = events.filter((e) => e.category === activeCat.slug);
    const idx = categories.findIndex((c) => c.slug === activeCat.slug);
    return (
      <>
        <ImageHero image={activeCat.image} height="h-[72svh] min-h-[520px]">
          <p className="label text-white/75">Events — {pad(idx + 1)}</p>
          <h1 className="display mt-5 text-6xl md:text-8xl">{activeCat.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">{activeCat.tagline}</p>
        </ImageHero>
        <CategoryNav categories={categories} active={activeCat.slug} />
        <section className="wrap py-20 md:py-28">
          <Reveal className="mb-16 grid gap-8 border-b border-ink/15 pb-12 lg:grid-cols-12">
            <p className="display text-3xl leading-snug md:text-4xl lg:col-span-8">{activeCat.description}</p>
            <p className="label text-[10px] text-ink-mute lg:col-span-3 lg:col-start-10 lg:text-right">{list.length} package{list.length === 1 ? "" : "s"} · fully customisable</p>
          </Reveal>
          {list.length ? (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e, i) => <Reveal key={e.slug} delay={(i % 3) * 110}><PackageCard e={e} currency={s.currency} categoryName={activeCat.name} /></Reveal>)}
              {list.length % 3 !== 0 && <BespokeCard name={activeCat.name} span={3 - (list.length % 3)} />}
            </div>
          ) : (
            <div className="border border-ink/15 p-12 text-center">
              <p className="display text-3xl">Every {activeCat.name.toLowerCase()} we plan is bespoke.</p>
              <Link href={`/contact?type=${encodeURIComponent(activeCat.name)}`} className="btn-ink mt-8">Tell us what you need</Link>
            </div>
          )}
        </section>
        <CtaBlock tone="rani" label={activeCat.name} title="Let's plan it" italic="together." text="Every package is fully customisable — and always priced lower than online." />
      </>
    );
  }

  /* ---------- All events ---------- */
  const featured = events.filter((e) => e.featured).slice(0, 6);
  const ctaTones = ["marigold", "peacock", "rani"] as const;

  return (
    <>
      {/* 2.1 Luxury carousel */}
      <BannerCarousel slides={banners.length ? banners : [{ url: s.heroPoster, title: "Events for every story" }]} label="Events & packages" />
      <CategoryNav categories={categories} />

      {/* 2.2 Featured */}
      <section className="wrap py-24 md:py-32">
        <SectionHead index="01" label="Featured" title="Signature" italic="experiences." text="Our most-loved packages — each with a complete itinerary you can tailor to your guests." />
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((e, i) => <Reveal key={e.slug} delay={(i % 3) * 110}><PackageCard e={e} currency={s.currency} categoryName={catName[e.category]} /></Reveal>)}
        </div>
      </section>

      {/* 2.3 Top destinations */}
      <section className="bg-ink py-24 text-white md:py-32">
        <div className="wrap">
          <SectionHead index="02" label="Top destinations" title="Celebrate" italic="anywhere." light text="Distance weddings and events anywhere in the world — from the palaces of Jaipur to the cliffs of Santorini." />
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-x-5 lg:gap-y-12 lg:overflow-visible lg:px-0">
            {destinations.map((d, i) => (
              <Reveal key={d.name} delay={(i % 5) * 80} className="group w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-auto">
                <div className="overflow-hidden">
                  <img src={sized(d.image, 700)} alt={d.name} loading="lazy" className="img-hover aspect-[3/4] w-full object-cover" />
                </div>
                <p className="label mt-4 text-[10px] text-marigold">{d.country}</p>
                <p className="mt-1 font-display text-2xl">{d.name}</p>
                <p className="mt-1 text-sm text-white/60">{d.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2.4 – 2.9 and more: every category with its packages */}
      {categories.map((c, idx) => {
        const list = events.filter((e) => e.category === c.slug);
        return (
          <div key={c.slug}>
            <section id={c.slug} className={`scroll-mt-40 py-24 md:py-28 ${idx % 2 ? "bg-paper-2" : ""}`}>
              <div className="wrap">
                <Reveal className="mb-14 grid gap-8 border-b border-ink/15 pb-10 lg:grid-cols-12 lg:items-end">
                  <div className="lg:col-span-7">
                    <p className="flex items-center gap-4 text-ink-mute">
                      <span className="font-display text-sm italic">({pad(idx + 3)})</span>
                      <span className="h-px w-10 bg-ink/30" />
                      <span className="label">{c.tagline}</span>
                    </p>
                    <h2 className="display mt-5 text-5xl md:text-7xl">{c.name}</h2>
                  </div>
                  <div className="lg:col-span-5">
                    <p className="text-lg leading-relaxed text-ink-mute">{c.description}</p>
                    <Link href={`/events?category=${c.slug}`} className="link mt-5">View {c.name.toLowerCase()} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </Reveal>
                <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                  {list.slice(0, 3).map((e, i) => <Reveal key={e.slug} delay={i * 110}><PackageCard e={e} currency={s.currency} categoryName={c.name} /></Reveal>)}
                  {list.length > 0 && list.length < 3 && <BespokeCard name={c.name} span={3 - list.length} />}
                </div>
              </div>
            </section>
            {idx % 3 === 2 && idx !== categories.length - 1 && (
              <CtaBlock
                tone={ctaTones[Math.floor(idx / 3) % ctaTones.length]}
                label="Not sure where to start?"
                title="Let's design it"
                italic="together."
                text="Book a free consultation and a senior planner will shape the perfect event around you."
                primary={{ label: "Book a consultation", href: "/book?type=appointment" }}
                secondary={{ label: "Send an enquiry", href: "/contact" }}
              />
            )}
          </div>
        );
      })}

      <CtaBlock tone="ink" label={`Licensed · Bonded · Insured since ${s.since}`} title="Ready to plan something" italic="extraordinary?" text={s.priceBadge} image={banners[0]?.url} />
    </>
  );
}
