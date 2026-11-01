import Link from "next/link";
import { notFound } from "next/navigation";
import { docMetadata, getCelebEvent, getCelebEvents } from "@/lib/data";
import { renderRich } from "@/lib/markdown";
import { sized } from "@/lib/img";
import { Reveal } from "@/components/reveal";
import { Breadcrumbs, CtaBlock, ImageHero } from "@/components/ui";
import { PhotoStrip } from "@/components/interactive";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 600;
export const generateStaticParams = async () => [];

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const e = await getCelebEvent(slug);
  if (!e) return {};
  return docMetadata(e, { title: e.title, description: e.summary, image: e.cover }, `/celeb-zone/${slug}`);
}

/** Accepts watch, youtu.be, shorts, live and embed links. Returns null for anything else. */
function youtubeId(url: string) {
  const m = String(url).trim().match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}

export default async function CelebEventPage({ params }: Props) {
  const { slug } = await params;
  const e = await getCelebEvent(slug);
  if (!e) notFound();
  const others = (await getCelebEvents()).filter((x) => x.slug !== slug).slice(0, 3);
  const videos = (e.videos || []).map(youtubeId).filter(Boolean) as string[];
  const date = e.date ? new Date(e.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  const facts = [["Location", e.location], ["Date", date], ["Guests of honour", e.celebrities?.join(", ")]].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <ImageHero image={e.cover}>
        <Breadcrumbs items={[{ label: "Celeb Zone", href: "/celeb-zone" }, { label: e.title }]} />
        <h1 className="display mt-6 max-w-5xl text-[3.2rem] sm:text-7xl lg:text-[6rem]">{e.title}</h1>
      </ImageHero>

      {facts.length > 0 && (
        <section className="border-b border-ink/15">
          <div className="wrap grid sm:grid-cols-3">
            {facts.map(([k, v], i) => (
              <div key={k} className={`py-7 ${i ? "border-t border-ink/15 sm:border-l sm:border-t-0 sm:pl-8" : ""}`}>
                <p className="label text-[10px] text-ink-mute">{k}</p>
                <p className="mt-2 font-display text-xl md:text-2xl">{v}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="wrap py-20 md:py-28">
        <div className="grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            {e.summary && <h2 className="display text-3xl leading-snug md:text-[2.4rem]">{e.summary}</h2>}
            {e.description && <div className="prose-lux mt-10 max-w-2xl" dangerouslySetInnerHTML={{ __html: renderRich(e.description) }} />}
          </Reveal>
          {e.highlights?.length > 0 && (
            <Reveal className="lg:col-span-4">
              <h2 className="label text-ink-mute">Highlights</h2>
              <ul className="mt-5 border-t border-ink/15">
                {e.highlights.map((h: string) => (
                  <li key={h} className="flex items-baseline gap-4 border-b border-ink/10 py-4 text-ink-soft"><span className="text-rani">—</span> {h}</li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        {e.gallery?.length > 0 && (
          <Reveal className="mt-20">
            <h2 className="label mb-6 text-ink-mute">Photos</h2>
            <PhotoStrip images={e.gallery} title={e.title} />
          </Reveal>
        )}

        {videos.length > 0 && (
          <Reveal className="mt-20">
            <h2 className="label mb-6 text-ink-mute">Videos</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {videos.map((id, i) => (
                <div key={id} className="aspect-video overflow-hidden bg-ink">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={`${e.title} video ${i + 1}`}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full border-0"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </section>

      {others.length > 0 && (
        <section className="border-t border-ink/15 bg-paper-2 py-20 md:py-28">
          <div className="wrap">
            <div className="mb-12 flex items-end justify-between gap-6">
              <h2 className="display text-4xl md:text-5xl">More from the <em className="serif-i text-rani">Celeb Zone</em></h2>
              <Link href="/celeb-zone" className="link hidden sm:inline-flex">View all</Link>
            </div>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <Link key={o.slug} href={`/celeb-zone/${o.slug}`} className="group block">
                  <div className="overflow-hidden bg-paper-3"><img src={sized(o.cover, 800)} alt="" loading="lazy" className="img-hover aspect-[4/3] w-full object-cover" /></div>
                  <p className="label mt-4 text-[10px] text-rani">{o.location}</p>
                  <h3 className="mt-1 font-display text-2xl group-hover:underline">{o.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBlock tone="rani" />
    </>
  );
}
