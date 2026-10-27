import Link from "next/link";
import { notFound } from "next/navigation";
import { docMetadata, getBlog, getBlogs, getComments, getSettings, incrementViews } from "@/lib/data";
import { readingTime, renderMarkdown } from "@/lib/markdown";
import { sized } from "@/lib/img";
import { Reveal } from "@/components/reveal";
import { Breadcrumbs, JournalCard, Stars } from "@/components/ui";
import { CommentForm } from "@/components/forms";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const b = await getBlog(slug);
  if (!b) return {};
  return docMetadata(b, { title: b.title, description: b.excerpt, image: b.cover }, `/blogs/${slug}`);
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const b = await getBlog(slug);
  if (!b) notFound();
  const [s, comments, related] = await Promise.all([
    getSettings(), getComments(slug), getBlogs({ slug: { $ne: slug } }, { publishedAt: -1 }, 3), incrementViews(slug).catch(() => {}),
  ]);
  const rated = comments.filter((c) => c.rating);
  const avg = rated.length ? rated.reduce((a, c) => a + c.rating, 0) / rated.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: rated.filter((c) => c.rating === n).length }));
  const date = new Date(b.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: b.title,
    description: b.excerpt,
    image: b.cover,
    datePublished: b.publishedAt,
    author: { "@type": "Person", name: b.author },
    publisher: { "@type": "Organization", name: s.siteName },
    ...(rated.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: rated.length } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="pt-[78px]">
        <div className="wrap max-w-5xl pb-14 pt-16 text-center md:pt-24">
          <div className="flex justify-center"><Breadcrumbs light={false} items={[{ label: "Journal", href: "/blogs" }, { label: b.category || "Story" }]} /></div>
          <h1 className="display mt-8 text-[2.8rem] sm:text-6xl lg:text-[5.2rem]">{b.title}</h1>
          <p className="mx-auto mt-8 max-w-2xl font-display text-xl italic leading-relaxed text-ink-mute md:text-2xl">{b.excerpt}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-mute">
            <span>By <span className="text-ink">{b.author}</span></span>
            <span className="h-px w-5 bg-ink/30" />
            <span>{date}</span>
            <span className="h-px w-5 bg-ink/30" />
            <span>{readingTime(b.content)} min read</span>
            {rated.length > 0 && (<><span className="h-px w-5 bg-ink/30" /><span className="flex items-center gap-2"><Stars value={avg} className="h-3.5 w-3.5" /> {avg.toFixed(1)}</span></>)}
          </div>
        </div>
        <Reveal img className="wrap">
          <img src={sized(b.cover, 2000, 85)} alt={b.title} className="aspect-[16/9] w-full object-cover" />
        </Reveal>
      </header>

      <article className="wrap max-w-[46rem] py-16 md:py-24">
        <div className="prose-lux first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:text-rani" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.content) }} />
        {b.tags?.length > 0 && (
          <div className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/15 pt-6">
            {b.tags.map((t: string) => <Link key={t} href={`/blogs?q=${encodeURIComponent(t)}#all`} className="text-sm text-ink-mute hover:text-rani">#{t}</Link>)}
          </div>
        )}

        {/* Rate & comment */}
        <section id="comments" className="mt-24">
          <div className="flex items-center gap-4 text-ink-mute">
            <span className="label">Ratings & comments</span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <div className="mt-10 grid gap-10 sm:grid-cols-[12rem_1fr] sm:items-center">
            <div>
              <p className="display text-7xl">{rated.length ? avg.toFixed(1) : "—"}</p>
              <div className="mt-3"><Stars value={avg} /></div>
              <p className="mt-2 text-xs text-ink-mute">{rated.length} rating{rated.length === 1 ? "" : "s"}</p>
            </div>
            <div className="space-y-2.5">
              {dist.map(({ n, count }) => (
                <div key={n} className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-3 text-sm">
                  <span className="text-ink-mute">{n}</span>
                  <div className="h-[3px] bg-ink/10"><div className="h-full bg-rani" style={{ width: `${rated.length ? (count / rated.length) * 100 : 0}%` }} /></div>
                  <span className="text-right text-ink-mute">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="display mt-20 text-4xl">{comments.length} {comments.length === 1 ? "comment" : "comments"}</h2>
          <ul className="mt-8 border-t border-ink/15">
            {comments.map((c) => (
              <li key={c._id} className="border-b border-ink/15 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-xl">{c.name}</p>
                  <div className="flex items-center gap-4">
                    {c.rating && <Stars value={c.rating} className="h-3 w-3" />}
                    <span className="text-xs text-ink-mute">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <p className="mt-3 leading-relaxed text-ink-soft">{c.text}</p>
              </li>
            ))}
            {!comments.length && <li className="border-b border-ink/15 py-8 text-ink-mute">Be the first to share your thoughts.</li>}
          </ul>

          <div className="mt-16 border border-ink/15 bg-white/50 p-8 md:p-10">
            <h3 className="display mb-8 text-3xl">Leave a comment & rating</h3>
            <CommentForm blog={slug} />
          </div>
        </section>
      </article>

      {related.length > 0 && (
        <section className="border-t border-ink/15 bg-paper-2 py-20 md:py-28">
          <div className="wrap">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="display text-4xl md:text-5xl">Keep <em className="serif-i text-rani">reading</em></h2>
              <Link href="/blogs" className="link hidden sm:inline-flex">All stories</Link>
            </div>
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-3">{related.map((r) => <JournalCard key={r.slug} b={r} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
