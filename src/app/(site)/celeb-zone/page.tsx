import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCelebEvents, pageMetadata } from "@/lib/data";
import { sized } from "@/lib/img";
import { Reveal } from "@/components/reveal";
import { CtaBlock } from "@/components/ui";

export const revalidate = 600;
export const generateMetadata = () => pageMetadata("celeb-zone", "/celeb-zone");

export default async function CelebZonePage() {
  const events = await getCelebEvents();
  return (
    <>
      <section className="pt-[78px]">
        <div className="wrap pb-12 pt-16 md:pb-16 md:pt-24">
          <div className="flex items-center justify-between text-ink-mute">
            <span className="label">Celeb Zone</span>
            <span className="font-display text-sm italic">{events.length} {events.length === 1 ? "event" : "events"}</span>
          </div>
          <h1 className="display mt-8 text-[15vw] leading-[0.88] md:text-[9.5rem]">
            Hosted for the <em className="serif-i text-rani">stars.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-mute">Weddings, galas, concerts and private parties we have hosted for celebrities: discreet, flawless and unforgettable.</p>
        </div>
      </section>

      <section className="wrap pb-24 md:pb-32">
        {events.length ? (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Reveal key={e.slug} delay={(i % 3) * 110}>
                <Link href={`/celeb-zone/${e.slug}`} className="group block">
                  <div className="overflow-hidden bg-paper-3">
                    <img src={sized(e.cover, 900)} alt="" loading="lazy" className="img-hover aspect-[4/5] w-full object-cover" />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-6">
                    <div>
                      <p className="label text-[10px] text-rani">{e.location}</p>
                      <h2 className="mt-2 font-display text-[1.65rem] leading-[1.1] decoration-1 underline-offset-4 group-hover:underline">{e.title}</h2>
                    </div>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-ink/40 transition group-hover:text-rani" strokeWidth={1.4} />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="border-y border-ink/15 py-16 text-center font-display text-3xl">New stories coming soon.</p>
        )}
      </section>
      <CtaBlock tone="ink" label="Discreet by design" title="Planning a high-profile" italic="event?" text="Private security, media management and white-glove hospitality, handled quietly." />
    </>
  );
}
