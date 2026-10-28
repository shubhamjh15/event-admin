"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { sized } from "@/lib/img";

type Slide = { _id?: string; mediaType?: string; url: string; poster?: string; title?: string; subtitle?: string; ctaLabel?: string; ctaLink?: string };

function useAutoplay(count: number, ms: number) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % count), ms);
    return () => clearTimeout(t);
  }, [i, paused, count, ms]);
  const go = useCallback((n: number) => setI(((n % count) + count) % count), [count]);
  return { i, go, setPaused };
}

const pad = (n: number) => String(n).padStart(2, "0");

function Media({ s, active }: { s: Slide; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);
  if (s.mediaType === "video") {
    return (
      <>
        {s.poster && <img src={sized(s.poster, 2400, 85)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <video ref={ref} src={s.url} muted loop playsInline preload="metadata" onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 h-full w-full object-cover" />
      </>
    );
  }
  return <img src={sized(s.url, 2400, 85)} alt={s.title || ""} className={`absolute inset-0 h-full w-full object-cover ${active ? "animate-slow-zoom" : ""}`} />;
}

/** Full-bleed editorial carousel for inner-page heroes. */
export function BannerCarousel({ slides, label, height = "h-[92svh] min-h-[620px]" }: { slides: Slide[]; label?: string; height?: string }) {
  const { i, go, setPaused } = useAutoplay(slides.length, 7000);
  if (!slides.length) return null;
  const cur = slides[i];
  return (
    <section data-hero className={`relative ${height} overflow-hidden bg-ink text-white`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, idx) => (
        <div key={s._id || idx} className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${idx === i ? "opacity-100" : "opacity-0"}`} aria-hidden={idx !== i}>
          <Media s={s} active={idx === i} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/40" />

      <div className="wrap relative flex h-full flex-col justify-end pb-10 pt-36 md:pb-14">
        <div key={i} className="max-w-4xl animate-[fadeUp_1s_ease-out]">
          {label && <p className="label text-white/75">{label}</p>}
          <h1 className="display mt-5 text-[3.2rem] sm:text-7xl lg:text-[6.2rem]">{cur.title}</h1>
          {cur.subtitle && <p className="mt-5 max-w-xl text-lg text-white/80">{cur.subtitle}</p>}
          {cur.ctaLabel && cur.ctaLink && (
            <Link href={cur.ctaLink} className="link mt-8 text-white">{cur.ctaLabel} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          )}
        </div>

        {slides.length > 1 && (
          <div className="mt-12 grid grid-cols-[auto_1fr_auto] items-center gap-6 border-t border-white/25 pt-5">
            <span className="font-display text-sm italic">{pad(i + 1)} <span className="text-white/50">/ {pad(slides.length)}</span></span>
            <div className="hidden gap-3 sm:flex">
              {slides.map((s, idx) => (
                <button key={idx} onClick={() => go(idx)} className="group min-w-0 flex-1 text-left" aria-label={`Show ${s.title}`}>
                  <span className="relative block h-px w-full bg-white/25">
                    <span className={`absolute inset-y-0 left-0 bg-white ${idx === i ? "w-full transition-[width] duration-[7000ms] ease-linear" : idx < i ? "w-full" : "w-0"}`} />
                  </span>
                  <span className={`label mt-3 block truncate text-[10px] transition ${idx === i ? "text-white" : "text-white/45 group-hover:text-white/80"}`}>{s.title}</span>
                </button>
              ))}
            </div>
            <div className="col-start-3 flex gap-6">
              <button onClick={() => go(i - 1)} className="label text-[10px] text-white/70 hover:text-white">Prev</button>
              <button onClick={() => go(i + 1)} className="label text-[10px] text-white/70 hover:text-white">Next</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Home hero: full-bleed luxury video, editorial headline, credentials rail. */
export function HeroVideo({ video, poster, since, lines }: { video: string; poster: string; since: string; lines: { title?: string; subtitle?: string }[] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const { i } = useAutoplay(lines.length, 5000);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => setPlaying(false));
  }, []);
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <section data-hero className="relative h-[100svh] min-h-[680px] overflow-hidden bg-ink text-white">
      <img src={sized(poster, 2400, 85)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {video && (
        <video ref={ref} src={video} autoPlay muted={muted} loop playsInline onError={(e) => (e.currentTarget.style.display = "none")} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/45" />

      <div className="wrap relative flex h-full flex-col justify-end pb-8 pt-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <h1 className="display text-[15vw] leading-[0.9] sm:text-[11vw] lg:col-span-8 lg:text-[8.6rem]">
            Celebrations,
            <br />
            <em className="serif-i text-marigold">beautifully</em> lit.
          </h1>
          <div className="lg:col-span-4 lg:pb-4">
            <p className="max-w-sm text-lg leading-relaxed text-white/85">
              Weddings, incentives, summits and once-in-a-lifetime celebrations — designed and delivered anywhere in the world, since {since}.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/contact" className="btn-paper">Plan your event</Link>
              <Link href="/events" className="link text-white">Explore events <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 items-center gap-4 border-t border-white/25 pt-5 text-white/80 md:grid-cols-4">
          <p className="label text-[10px]">Est. {since}</p>
          <p className="label hidden text-[10px] md:block">Licensed · Bonded · Insured</p>
          <div className="hidden h-4 overflow-hidden md:block">
            {lines[i] && <p key={i} className="label animate-[fadeUp_.7s_ease-out] truncate text-[10px] text-white">{lines[i].title}</p>}
          </div>
          <div className="flex items-center justify-end gap-6">
            <button onClick={toggle} className="label text-[10px] hover:text-white">{playing ? "Pause" : "Play"}</button>
            <button onClick={() => setMuted((m) => !m)} className="label text-[10px] hover:text-white">{muted ? "Sound on" : "Sound off"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Editorial category index. The active category follows the scroll position: as each row passes
 * the middle of the screen its photo takes over the sticky image panel. Works on touch devices too.
 */
export function CategoryShowcase({ categories, counts }: { categories: any[]; counts: Record<string, number> }) {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const els = rows.current.filter(Boolean) as HTMLLIElement[];
    if (!els.length) return;
    // A thin band across the vertical middle of the viewport decides which row is "current".
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [categories.length]);

  const cur = categories[active];
  return (
    <div className="grid gap-x-12 lg:grid-cols-12">
      {/* Sticky image panel: a wide strip under the header on phones, a tall portrait beside the list on desktop */}
      <div className="sticky top-[78px] z-10 -mx-5 bg-paper-2 px-5 pb-4 pt-3 sm:-mx-8 sm:px-8 lg:order-2 lg:col-span-5 lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:top-28 lg:self-start">
        <div className="relative aspect-[16/9] overflow-hidden bg-paper-3 lg:aspect-[4/5]">
          {categories.map((c, idx) => (
            <img
              key={c.slug}
              src={sized(c.image, 1100)}
              alt={c.name}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-[900ms] ease-out ${idx === active ? "scale-100 opacity-100" : "scale-110 opacity-0"}`}
            />
          ))}
          <span className="label absolute left-0 top-0 bg-paper px-3 py-2 text-[10px] text-ink">
            {pad(active + 1)} / {pad(categories.length)}
          </span>
        </div>
        {cur && <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-ink-mute lg:block">{cur.description}</p>}
      </div>

      <ul className="border-t border-ink/15 lg:col-span-7">
        {categories.map((c, idx) => (
          <li key={c.slug} data-i={idx} ref={(el) => { rows.current[idx] = el; }} className="flex min-h-[24vh] items-center border-b border-ink/15 lg:min-h-[19vh]">
            <Link href={`/events?category=${c.slug}`} className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-6 md:grid-cols-[3rem_1fr_auto]">
              <span className="font-display text-sm italic text-ink-mute">{pad(idx + 1)}</span>
              <span>
                <span className={`display block text-[2.1rem] transition-all duration-500 md:text-[3rem] ${active === idx ? "translate-x-2 italic text-rani" : "text-ink/60"}`}>{c.name}</span>
                <span className={`mt-1 block text-sm transition-colors duration-500 ${active === idx ? "text-ink-mute" : "text-ink-mute"}`}>{c.tagline}</span>
                {active === idx && <span className="mt-3 block text-sm leading-relaxed text-ink-mute lg:hidden">{c.description}</span>}
              </span>
              <span className="label flex items-center gap-2 text-[10px] text-ink-mute">
                <span className="hidden sm:inline">{counts[c.slug] ? `${counts[c.slug]} package${counts[c.slug] > 1 ? "s" : ""}` : "Bespoke"}</span>
                <ArrowUpRight className={`h-4 w-4 transition ${active === idx ? "text-rani" : ""}`} strokeWidth={1.4} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
