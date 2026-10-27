import Link from "next/link";
import { getBlogs, getRatings, pageMetadata } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { CtaBlock, JournalCard, Stars } from "@/components/ui";

export const generateMetadata = () => pageMetadata("blogs", "/blogs");

type Props = { searchParams: Promise<{ q?: string; category?: string }> };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pad = (n: number) => String(n).padStart(2, "0");

export default async function BlogsPage({ searchParams }: Props) {
  const { q = "", category = "" } = await searchParams;
  const filter: any = {};
  if (category) filter.category = category;
  if (q) filter.$or = [{ title: { $regex: escapeRegex(q), $options: "i" } }, { excerpt: { $regex: escapeRegex(q), $options: "i" } }, { tags: { $regex: escapeRegex(q), $options: "i" } }];

  const [all, featured, mostRead, list, ratings] = await Promise.all([
    getBlogs(), getBlogs({ featured: true }, { publishedAt: -1 }, 3), getBlogs({}, { views: -1 }, 5), getBlogs(filter), getRatings(),
  ]);
  const categories = Array.from(new Set(all.map((b) => b.category).filter(Boolean)));
  const filtering = !!(q || category);
  const [lead, ...rest] = featured;

  return (
    <>
      {/* Masthead */}
      <section className="border-b border-ink/15 pt-[78px]">
        <div className="wrap pb-12 pt-16 md:pb-16 md:pt-24">
          <div className="flex items-center justify-between text-ink-mute">
            <span className="label">The Lit Journal</span>
            <span className="font-display text-sm italic">{all.length} stories</span>
          </div>
          <h1 className="display mt-8 text-[18vw] leading-[0.85] md:text-[11rem]">
            The <em className="serif-i text-rani">Journal</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-ink-mute">Ideas, inspiration and insider advice from thirty-five years of planning the world's most joyful occasions.</p>
        </div>
      </section>

      {/* Featured + most read */}
      {!filtering && lead && (
        <section className="wrap grid gap-16 py-20 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="label mb-8 text-ink-mute">Featured</p>
            <Reveal><JournalCard b={lead} rating={ratings[lead.slug]} large /></Reveal>
            <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2">
              {rest.map((b, i) => <Reveal key={b.slug} delay={i * 100}><JournalCard b={b} rating={ratings[b.slug]} /></Reveal>)}
            </div>
          </div>
          <aside className="lg:col-span-4 lg:border-l lg:border-ink/15 lg:pl-10">
            <div className="lg:sticky lg:top-28">
              <p className="label mb-6 text-ink-mute">Most read</p>
              <ol className="border-t border-ink/15">
                {mostRead.map((b, i) => (
                  <li key={b.slug}>
                    <Link href={`/blogs/${b.slug}`} className="group grid grid-cols-[2.5rem_1fr] gap-3 border-b border-ink/15 py-5">
                      <span className="display text-3xl text-rani">{i + 1}</span>
                      <span>
                        <span className="block font-display text-lg leading-snug group-hover:underline">{b.title}</span>
                        <span className="mt-2 flex items-center gap-3 text-xs text-ink-mute">
                          {b.views?.toLocaleString("en-US")} reads
                          {ratings[b.slug] && <Stars value={ratings[b.slug].avg} className="h-3 w-3" />}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="mt-10 bg-marigold p-7">
                <p className="display text-2xl">Planning something special?</p>
                <p className="mt-2 text-sm text-ink/70">A free consultation with a senior planner.</p>
                <Link href="/book?type=appointment" className="btn-ink mt-6 w-full">Book a consultation</Link>
              </div>
            </div>
          </aside>
        </section>
      )}

      {/* All stories */}
      <section id="all" className="border-t border-ink/15 bg-paper-2 py-20 md:py-24">
        <div className="wrap">
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="display text-5xl md:text-6xl">
              {filtering ? <>Results{q && <> for <em className="serif-i text-rani">“{q}”</em></>}</> : <>All <em className="serif-i text-rani">stories</em></>}
            </h2>
            <form action="/blogs#all" className="flex w-full items-end gap-4 border-b border-ink/30 focus-within:border-ink lg:w-80">
              {category && <input type="hidden" name="category" value={category} />}
              <input name="q" defaultValue={q} placeholder="Search the journal" aria-label="Search the journal" className="w-full border-0 bg-transparent px-0 py-3 outline-none placeholder:text-ink/40 focus:ring-0" />
              <button className="label pb-3.5 text-[10px]">Search</button>
            </form>
          </div>
          <div className="no-scrollbar mb-14 flex gap-8 overflow-x-auto border-b border-ink/15">
            {[["", "All"], ...categories.map((c) => [c, c])].map(([v, l]) => (
              <Link key={l} href={v ? `/blogs?category=${encodeURIComponent(v)}#all` : "/blogs#all"} className={`label relative shrink-0 pb-4 text-[11px] ${category === v ? "text-ink" : "text-ink-mute hover:text-ink"}`}>
                {l}
                {category === v && <span className="absolute -bottom-px left-0 h-[2px] w-full bg-rani" />}
              </Link>
            ))}
          </div>
          {list.length ? (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((b, i) => <Reveal key={b.slug} delay={(i % 3) * 100}><JournalCard b={b} rating={ratings[b.slug]} /></Reveal>)}
            </div>
          ) : (
            <div className="border-y border-ink/15 py-16 text-center">
              <p className="display text-3xl">No stories found.</p>
              <Link href="/blogs#all" className="link mt-6">Clear filters</Link>
            </div>
          )}
          <p className="mt-16 font-display text-sm italic text-ink-mute">{pad(list.length)} {list.length === 1 ? "story" : "stories"}</p>
        </div>
      </section>
      <CtaBlock tone="rani" />
    </>
  );
}
