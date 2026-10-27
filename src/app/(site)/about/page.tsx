import { getBanners, getCategories, getGallery, getMilestones, getSettings, getTeam, pageMetadata } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { sized } from "@/lib/img";
import { BannerCarousel } from "@/components/carousel";
import { CountUp, Reveal } from "@/components/reveal";
import { CtaBlock, SectionHead } from "@/components/ui";
import { GalleryCollage } from "@/components/interactive";
import { EnquiryForm } from "@/components/forms";

export const generateMetadata = () => pageMetadata("about", "/about");

const pad = (n: number) => String(n).padStart(2, "0");

export default async function AboutPage() {
  const [s, banners, milestones, gallery, team, categories] = await Promise.all([
    getSettings(), getBanners("about"), getMilestones(), getGallery(7), getTeam(), getCategories(),
  ]);
  return (
    <>
      {/* Carousel */}
      <BannerCarousel slides={banners} label="About Lit Concierge" />

      {/* Brief about company */}
      <section className="wrap py-24 md:py-36">
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="flex items-center gap-4 text-ink-mute">
              <span className="font-display text-sm italic">(01)</span>
              <span className="h-px w-10 bg-ink/30" />
              <span className="label">The company</span>
            </div>
            <p className="display mt-8 text-[2.2rem] leading-[1.12] md:text-[3.2rem]">
              Licensed. Bonded. Insured. And in the business of joy <em className="serif-i text-rani">since {s.since}.</em>
            </p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5 lg:pt-16">
            <div className="prose-lux !text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.about) }} />
          </Reveal>
        </div>
        <div className="mt-20 grid grid-cols-2 border-t border-ink/15 lg:grid-cols-4">
          {s.stats.map((st, i) => (
            <Reveal key={st.label} delay={i * 80} className={`py-10 ${i % 2 ? "border-l border-ink/15 pl-6 md:pl-8" : "pr-6"} ${i > 1 ? "border-t border-ink/15 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-8" : ""}`}>
              <p className="display text-5xl md:text-7xl"><CountUp value={st.value} /></p>
              <p className="mt-3 text-sm text-ink-mute">{st.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Mission & vision — colour blocks */}
      <section className="grid md:grid-cols-2">
        <div className="bg-rani px-5 py-20 text-white sm:px-8 md:py-28 lg:px-12">
          <Reveal className="ml-auto max-w-[580px]">
            <p className="label text-white/70">Our mission</p>
            <p className="display mt-8 text-3xl leading-[1.2] md:text-[2.6rem]">{s.mission}</p>
          </Reveal>
        </div>
        <div className="bg-peacock px-5 py-20 text-white sm:px-8 md:py-28 lg:px-12">
          <Reveal delay={120} className="max-w-[580px]">
            <p className="label text-white/70">Our vision</p>
            <p className="display mt-8 text-3xl leading-[1.2] md:text-[2.6rem]">{s.vision}</p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="wrap py-24 md:py-32">
        <SectionHead index="02" label="What we stand for" title="Four values," italic="every event." />
        <div className="grid border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {s.values.map((v, i) => (
            <Reveal key={v.title} delay={i * 90} className={`border-b border-ink/15 py-10 lg:border-b-0 ${i > 0 ? "lg:border-l lg:pl-8" : ""} ${i % 2 ? "sm:border-l sm:pl-8" : "sm:pr-8"} lg:pr-8`}>
              <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
              <h3 className="display mt-6 text-3xl">{v.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-mute">{v.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="border-t border-ink/15 bg-paper-2 py-24 md:py-32">
        <div className="wrap">
          <SectionHead index="03" label="Our journey" title="From one phone line" italic="to 48 countries." />
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-8 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
            {milestones.map((m, i) => (
              <Reveal key={m.title} delay={i * 80} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[30%]">
                <div className="flex items-baseline justify-between border-t border-ink py-4">
                  <span className="display text-5xl text-rani">{m.year}</span>
                  <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
                </div>
                {m.image && <img src={sized(m.image, 800)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                <h3 className="mt-5 font-display text-2xl">{m.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-mute">{m.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="wrap py-24 md:py-32">
        <SectionHead index="04" label="Our team" title="The people behind" italic="the magic." />
        <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 100} className="group">
              <div className="overflow-hidden bg-paper-3">
                <img src={sized(t.photo, 800)} alt={t.name} loading="lazy" className="img-hover aspect-[4/5] w-full object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0" />
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-ink/15 pb-4">
                <h3 className="font-display text-2xl">{t.name}</h3>
                <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
              </div>
              <p className="label mt-4 text-[10px] text-rani">{t.role}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-mute">{t.bio}</p>
              {(t.linkedin || t.email) && (
                <div className="mt-4 flex gap-6">
                  {t.linkedin && <a href={t.linkedin} target="_blank" rel="noreferrer" className="link">LinkedIn</a>}
                  {t.email && <a href={`mailto:${t.email}`} className="link">Email</a>}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="border-t border-ink/15 py-24 md:py-32">
        <div className="wrap">
          <SectionHead index="05" label="Gallery" title="A glimpse of" italic="our work." />
          <GalleryCollage items={gallery} />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-ink text-white">
        <div className="wrap grid gap-16 py-24 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label text-white/60">(06) — Contact</p>
            <h2 className="display mt-6 text-5xl md:text-6xl">Let's <em className="serif-i text-marigold">talk.</em></h2>
            <dl className="mt-12 border-t border-white/20">
              {[["Telephone", s.phone, `tel:${s.phone.replace(/[^\d+]/g, "")}`], ["Email", s.email, `mailto:${s.email}`], ["Studio", s.address], ["Hours", s.hours]].map(([k, v, href]) => (
                <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-white/20 py-5">
                  <dt className="label pt-1 text-[10px] text-white/50">{k}</dt>
                  <dd className="font-display text-xl">{href ? <a href={href} className="hover:text-marigold">{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <EnquiryForm eventTypes={categories.map((c) => c.name)} source="about" tone="dark" />
          </div>
        </div>
      </section>

      <CtaBlock tone="marigold" label="Since 1989" title="Your celebration," italic="our life's work." text={s.priceBadge} />
    </>
  );
}
