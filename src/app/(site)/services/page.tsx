import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBanners, getServices, getSettings, pageMetadata } from "@/lib/data";
import { sized } from "@/lib/img";
import { BannerCarousel } from "@/components/carousel";
import { Reveal } from "@/components/reveal";
import { CtaBlock, SectionHead } from "@/components/ui";

export const generateMetadata = () => pageMetadata("services", "/services");

const NEGOTIATE = ["Hotel stays", "Private jets", "Villas", "Yachts", "Event spaces", "AV equipment", "Transportation", "Flights"];
const pad = (n: number) => String(n).padStart(2, "0");

export default async function ServicesPage() {
  const [s, banners, services] = await Promise.all([getSettings(), getBanners("services"), getServices()]);
  return (
    <>
      <BannerCarousel slides={banners} label="Our services" />

      {/* Intro + index */}
      <section className="wrap py-24 md:py-32">
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex items-center gap-4 text-ink-mute">
              <span className="font-display text-sm italic">(01)</span>
              <span className="h-px w-10 bg-ink/30" />
              <span className="label">What we do</span>
            </div>
            <h2 className="display mt-6 text-5xl md:text-6xl">Everything your event needs, <em className="serif-i text-rani">under one roof.</em></h2>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-mute">{s.expertise}</p>
          </Reveal>
          <ol className="border-t border-ink/15 lg:col-span-7">
            {services.map((sv, i) => (
              <li key={sv.slug}>
                <Link href={`#${sv.slug}`} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-b border-ink/15 py-4">
                  <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
                  <span className="font-display text-xl group-hover:italic group-hover:text-rani md:text-2xl">{sv.title}</span>
                  <span className="label text-[10px] text-ink-mute">View</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Negotiation — marigold block */}
      <section className="bg-marigold py-24 text-ink md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-5">
            <p className="label text-ink/70">Negotiation power</p>
            <h2 className="display mt-6 text-5xl md:text-7xl">Prices lower <em className="serif-i">than online.</em></h2>
            <p className="mt-6 max-w-md text-lg text-ink/75">Thirty-five years of partnerships mean real buying power. We negotiate every line — and pass the savings to you.</p>
            <Link href="/contact" className="btn-ink mt-10">Get my quote</Link>
          </Reveal>
          <div className="grid grid-cols-2 border-l border-t border-ink/25 lg:col-span-7">
            {NEGOTIATE.map((n, i) => (
              <Reveal key={n} delay={i * 50} className="border-b border-r border-ink/25 p-6 md:p-8">
                <span className="font-display text-sm italic text-ink/55">{pad(i + 1)}</span>
                <p className="display mt-6 text-2xl md:text-3xl">{n}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Each service in detail */}
      <section className="wrap py-24 md:py-32">
        <SectionHead index="02" label="In detail" title="How we" italic="look after you." />
        <div className="space-y-28 md:space-y-36">
          {services.map((sv, i) => (
            <article key={sv.slug} id={sv.slug} className="grid scroll-mt-32 gap-10 lg:grid-cols-12 lg:items-center">
              <Reveal img className={`lg:col-span-6 ${i % 2 ? "lg:order-2 lg:col-start-7" : ""}`}>
                <img src={sized(sv.image, 1300)} alt={sv.title} loading="lazy" className="aspect-[5/4] w-full object-cover" />
              </Reveal>
              <Reveal className={`lg:col-span-5 ${i % 2 ? "lg:order-1" : "lg:col-start-8"}`}>
                <p className="font-display text-sm italic text-ink-mute">{pad(i + 1)} / {pad(services.length)}</p>
                <h3 className="display mt-4 text-4xl md:text-5xl">{sv.title}</h3>
                <p className="mt-6 text-lg leading-relaxed text-ink-mute">{sv.description}</p>
                {sv.points?.length > 0 && (
                  <ul className="mt-8 grid gap-x-8 border-t border-ink/15 sm:grid-cols-2">
                    {sv.points.map((p: string) => (
                      <li key={p} className="flex items-baseline gap-3 border-b border-ink/10 py-3 text-[15px] text-ink-soft">
                        <span className="text-rani">—</span> {p}
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/services/${sv.slug}`} className="link mt-8">Learn more <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <CtaBlock tone="peacock" label="One service or all of them" title="Let's build" italic="your event." text="Tell us what you need and a senior planner will come back within 24 hours." image={banners[1]?.url} />
    </>
  );
}
