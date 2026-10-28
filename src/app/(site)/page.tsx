import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  getBanners, getBlogs, getCategories, getEvents, getFaqs, getGallery, getMilestones, getRatings, getServices, getSettings, getTestimonials, pageMetadata,
} from "@/lib/data";
import { sized } from "@/lib/img";
import { HeroVideo, CategoryShowcase } from "@/components/carousel";
import { Reveal, CountUp } from "@/components/reveal";
import { Credentials, JournalCard, PackageCard, SectionHead } from "@/components/ui";
import { Faqs, GalleryCollage, Testimonials } from "@/components/interactive";
import { EnquiryForm } from "@/components/forms";

export const generateMetadata = () => pageMetadata("home", "/");

const pad = (n: number) => String(n).padStart(2, "0");

export default async function Home() {
  const [s, banners, categories, events, services, testimonials, gallery, milestones, blogs, faqs, ratings] = await Promise.all([
    getSettings(), getBanners("home"), getCategories(), getEvents(), getServices(), getTestimonials(),
    getGallery(7), getMilestones(), getBlogs({}, { publishedAt: -1 }, 3), getFaqs(), getRatings(),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const counts = events.reduce<Record<string, number>>((a, e) => ({ ...a, [e.category]: (a[e.category] || 0) + 1 }), {});
  const featured = events.filter((e) => e.featured).slice(0, 3);

  return (
    <>
      {/* 1.1 Hero — luxury video */}
      <HeroVideo video={s.heroVideo} poster={s.heroPoster} since={s.since} lines={banners} />
      <Credentials since={s.since} priceBadge={s.priceBadge} payments={s.paymentMethods} />

      {/* 1.1a Values, mission & vision */}
      <section className="wrap py-24 md:py-36">
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal img className="lg:col-span-5">
            <figure>
              <img src={sized(categories[1]?.image || s.heroPoster, 1100)} alt="Palace mandap prepared for a wedding" className="aspect-[4/5] w-full object-cover" />
              <figcaption className="mt-3 flex justify-between text-xs text-ink-mute">
                <span className="font-display italic">A palace wedding, Rajasthan</span>
                <span className="label text-[10px]">Lit Concierge</span>
              </figcaption>
            </figure>
          </Reveal>
          <div className="lg:col-span-7 lg:pl-8">
            <Reveal>
              <div className="flex items-center gap-4 text-ink-mute">
                <span className="font-display text-sm italic">(01)</span>
                <span className="h-px w-10 bg-ink/30" />
                <span className="label">Who we are</span>
              </div>
              <p className="display mt-8 text-[2rem] leading-[1.15] md:text-[2.75rem]">
                Licensed, bonded and insured — and planning the world's most joyful occasions <em className="serif-i text-rani">since {s.since}.</em>
              </p>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-mute">{s.expertise}</p>
            </Reveal>

            <div className="mt-14 grid gap-px bg-ink/15 sm:grid-cols-2">
              <Reveal className="bg-paper pb-8 pr-8 pt-2 sm:pb-2">
                <p className="label text-[10px] text-rani">Our mission</p>
                <p className="mt-4 font-display text-xl leading-snug">{s.mission}</p>
              </Reveal>
              <Reveal delay={120} className="bg-paper pt-8 sm:pl-8 sm:pt-2">
                <p className="label text-[10px] text-rani">Our vision</p>
                <p className="mt-4 font-display text-xl leading-snug">{s.vision}</p>
              </Reveal>
            </div>
          </div>
        </div>

        <div className="mt-24 border-t border-ink/15 md:mt-32">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {s.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className={`border-b border-ink/15 py-10 lg:border-b-0 ${i > 0 ? "lg:border-l lg:pl-8" : ""} ${i % 2 ? "sm:border-l sm:pl-8" : "sm:pr-8"} lg:pr-8`}>
                <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
                <h2 className="display mt-6 text-3xl">{v.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-mute">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 1.2 Our events */}
      <section className="bg-paper-2 py-24 md:py-36">
        <div className="wrap">
          <SectionHead
            index="02"
            label="Our events"
            title="Every kind of"
            italic="celebration."
            action={<Link href="/events" className="link">All events <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
          />
          <CategoryShowcase categories={categories} counts={counts} />

          {featured.length > 0 && <div className="mt-28">
            <Reveal className="mb-10 flex items-end justify-between gap-6 border-b border-ink/15 pb-5">
              <h3 className="display text-3xl md:text-4xl">Featured <em className="serif-i text-rani">packages</em></h3>
              <Link href="/events" className="link hidden sm:inline-flex">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Reveal>
            <div tabIndex={0} role="region" aria-label="Featured packages" className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0">
              {featured.map((e, i) => (
                <Reveal key={e.slug} delay={i * 120} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-auto">
                  <PackageCard e={e} currency={s.currency} categoryName={catName[e.category]} />
                </Reveal>
              ))}
            </div>
          </div>}
        </div>
      </section>

      {/* 1.3 Services snapshot — marigold block */}
      <section className="bg-marigold py-24 text-ink md:py-36">
        <div className="wrap">
          <Reveal className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 text-ink/85">
                <span className="font-display text-sm italic">(03)</span>
                <span className="h-px w-10 bg-ink/40" />
                <span className="label">Services</span>
              </div>
              <h2 className="display mt-6 text-[2.6rem] sm:text-6xl lg:text-[4.6rem]">White-glove, <em className="serif-i">end to end.</em></h2>
            </div>
            <p className="text-lg leading-relaxed text-ink/85 lg:col-span-4">One team for planning, negotiation, logistics, hosting and onsite management — at prices lower than online.</p>
          </Reveal>
          <div className="grid border-t border-ink/25 md:grid-cols-2">
            {services.slice(0, 10).map((sv, i) => (
              <Link
                key={sv.slug}
                href={`/services/${sv.slug}`}
                className={`group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-b border-ink/25 py-6 ${i % 2 ? "md:border-l md:pl-8" : "md:pr-8"}`}
              >
                <span className="font-display text-sm italic text-ink/80">{pad(i + 1)}</span>
                <span>
                  <span className="block font-display text-2xl leading-tight group-hover:italic">{sv.title}</span>
                  <span className="mt-1 block text-sm text-ink/85">{sv.summary}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 text-ink/80 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" strokeWidth={1.4} />
              </Link>
            ))}
          </div>
          <div className="mt-12">
            <Link href="/services" className="btn-ink">All services</Link>
          </div>
        </div>
      </section>

      {/* Signature touches */}
      <section className="wrap py-24 md:py-32">
        <SectionHead index="04" label="Signature touches" title="The details guests" italic="remember." />
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {s.signatureTouches.map((t, i) => (
            <Reveal key={t.title} delay={i * 100}>
              <div className="overflow-hidden bg-paper-3">
                <img src={sized(t.image, 800)} alt={t.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
              </div>
              <h3 className="mt-5 font-display text-2xl">{t.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-mute">{t.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 1.4 Testimonials — rani block */}
      {testimonials.length > 0 && <section className="bg-rani py-24 text-white md:py-36">
        <div className="wrap">
          <div className="mb-14 flex items-center gap-4 text-white/90">
            <span className="font-display text-sm italic">(05)</span>
            <span className="h-px w-10 bg-white/50" />
            <span className="label">Kind words</span>
          </div>
          <Testimonials items={testimonials} />
        </div>
      </section>}

      {/* 1.6 Gallery */}
      {gallery.length > 0 && <section className="wrap py-24 md:py-36">
        <SectionHead
          index="06"
          label="Gallery"
          title="Moments we've"
          italic="lit up."
          action={<Link href="/gallery" className="link">Full gallery <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
        />
        <GalleryCollage items={gallery} />
      </section>}

      {/* 1.7 Story / journey */}
      <section className="border-t border-ink/15 bg-paper-2 py-24 md:py-36">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <SectionHead index="07" label="Our story" title="A journey that began" italic={`in ${s.since}.`} className="!mb-10" />
              <div className="grid grid-cols-2 gap-px bg-ink/15">
                {s.stats.map((st) => (
                  <div key={st.label} className="bg-paper-2 py-5 pr-4 [&:nth-child(even)]:pl-5">
                    <p className="display text-4xl"><CountUp value={st.value} /></p>
                    <p className="mt-1 text-xs text-ink-mute">{st.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ol className="border-t border-ink/15 lg:col-span-8">
            {milestones.map((m) => (
              <Reveal as="li" key={m.year + m.title} className="grid gap-6 border-b border-ink/15 py-10 sm:grid-cols-[8rem_1fr_11rem] sm:items-start">
                <span className="display text-5xl text-rani">{m.year}</span>
                <div>
                  <h3 className="font-display text-2xl">{m.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-mute">{m.description}</p>
                </div>
                {m.image && <img src={sized(m.image, 500)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover sm:w-44" />}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 1.8 Journal */}
      {blogs.length > 0 && <section className="wrap py-24 md:py-36">
        <SectionHead
          index="08"
          label="The journal"
          title="Ideas &"
          italic="inspiration."
          action={<Link href="/blogs" className="link">Read the journal <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
        />
        <div className="grid gap-x-8 gap-y-14 md:grid-cols-3">
          {blogs.map((b, i) => (
            <Reveal key={b.slug} delay={i * 110}><JournalCard b={b} rating={ratings[b.slug]} /></Reveal>
          ))}
        </div>
      </section>}

      {/* 1.9 CTA — enquiry & booking on peacock */}
      <section id="enquire" className="bg-peacock text-white">
        <div className="wrap grid gap-16 py-24 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4 text-white/90">
              <span className="font-display text-sm italic">(09)</span>
              <span className="h-px w-10 bg-white/40" />
              <span className="label">Enquire & book</span>
            </div>
            <h2 className="display mt-6 text-5xl md:text-6xl">Tell us about the <em className="serif-i text-marigold">occasion.</em></h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90">A senior planner will reply within 24 hours with ideas and a tailored proposal — free, and without obligation.</p>
            <div className="mt-12 border-t border-white/25">
              <Link href="/book" className="group flex items-center justify-between border-b border-white/25 py-5">
                <span className="font-display text-2xl group-hover:italic">Book an event package</span>
                <ArrowUpRight className="h-5 w-5" strokeWidth={1.4} />
              </Link>
              <Link href="/book?type=appointment" className="group flex items-center justify-between border-b border-white/25 py-5">
                <span className="font-display text-2xl group-hover:italic">Schedule a free consultation</span>
                <ArrowUpRight className="h-5 w-5" strokeWidth={1.4} />
              </Link>
              <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="group flex items-center justify-between border-b border-white/25 py-5">
                <span className="font-display text-2xl group-hover:italic">{s.phone}</span>
                <span className="label text-[10px] text-white/85">Call</span>
              </a>
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <EnquiryForm eventTypes={categories.map((c) => c.name)} source="home" tone="dark" />
          </div>
        </div>
      </section>

      {/* 1.10 FAQs */}
      {faqs.length > 0 && <section className="wrap grid gap-14 py-24 md:py-36 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHead index="10" label="Questions" title="Good to" italic="know." className="!mb-8" />
          <p className="max-w-sm text-ink-mute">Can't find your answer? Our planners are a call away.</p>
          <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="link mt-6">{s.phone}</a>
        </div>
        <div className="lg:col-span-8">
          <Faqs items={faqs} />
        </div>
      </section>}
    </>
  );
}
