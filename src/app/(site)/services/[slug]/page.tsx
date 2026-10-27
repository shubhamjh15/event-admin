import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { docMetadata, getCategories, getService, getServices, getSettings } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { Reveal } from "@/components/reveal";
import { Breadcrumbs, CtaBlock, ImageHero } from "@/components/ui";
import { EnquiryForm } from "@/components/forms";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sv = await getService(slug);
  if (!sv) return {};
  return docMetadata(sv, { title: sv.title, description: sv.summary, image: sv.image }, `/services/${slug}`);
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ServiceDetail({ params }: Props) {
  const { slug } = await params;
  const sv = await getService(slug);
  if (!sv) notFound();
  const [s, all, categories] = await Promise.all([getSettings(), getServices(), getCategories()]);
  const idx = all.findIndex((x) => x.slug === slug);
  const others = all.filter((x) => x.slug !== slug);

  return (
    <>
      <ImageHero image={sv.image} height="h-[78svh] min-h-[560px]">
        <Breadcrumbs items={[{ label: "Services", href: "/services" }, { label: sv.title }]} />
        <p className="mt-8 font-display text-sm italic text-white/70">{pad(idx + 1)} / {pad(all.length)}</p>
        <h1 className="display mt-3 max-w-5xl text-[3.2rem] sm:text-7xl lg:text-[6rem]">{sv.title}</h1>
      </ImageHero>

      <section className="wrap grid gap-16 py-20 md:py-28 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <p className="display text-3xl leading-snug md:text-[2.4rem]">{sv.summary}</p>
          <div className="prose-lux mt-10 max-w-2xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(sv.description) }} />
          {sv.points?.length > 0 && (
            <ul className="mt-12 grid gap-x-10 border-t border-ink/15 sm:grid-cols-2">
              {sv.points.map((p: string) => (
                <li key={p} className="flex items-baseline gap-4 border-b border-ink/10 py-4 text-ink-soft"><span className="text-rani">—</span> {p}</li>
              ))}
            </ul>
          )}
          <p className="mt-12 border-l-2 border-rani pl-5 text-ink-soft">
            {s.priceBadge}. Licensed, bonded and insured since {s.since}. We accept {s.paymentMethods.join(", ")}.
          </p>
        </Reveal>
        <aside className="lg:col-span-5 lg:pl-6">
          <div className="border border-ink/15 bg-white/50 p-8 lg:sticky lg:top-28">
            <p className="label text-[10px] text-rani">Enquire</p>
            <h2 className="display mt-3 text-3xl">Ask about {sv.title.toLowerCase()}</h2>
            <p className="mb-8 mt-2 text-sm text-ink-mute">We reply within 24 hours.</p>
            <EnquiryForm eventTypes={categories.map((c) => c.name)} source={`service:${sv.slug}`} compact />
          </div>
        </aside>
      </section>

      <section className="border-t border-ink/15 bg-paper-2 py-20 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <h2 className="display text-4xl lg:col-span-4">Other <em className="serif-i text-rani">services</em></h2>
          <ol className="border-t border-ink/15 lg:col-span-8">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/services/${o.slug}`} className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-ink/15 py-5">
                  <span>
                    <span className="block font-display text-2xl group-hover:italic group-hover:text-rani">{o.title}</span>
                    <span className="mt-1 block text-sm text-ink-mute">{o.summary}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink/40 group-hover:text-rani" strokeWidth={1.4} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaBlock tone="rani" />
    </>
  );
}
