"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Stars } from "./stars";
import { sized } from "@/lib/img";
import { Monogram } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

/** Testimonials on a flat rani-pink field: one large quote at a time. */
export function Testimonials({ items }: { items: any[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % items.length), 8000);
    return () => clearTimeout(t);
  }, [i, items.length]);
  if (!items.length) return null;
  const t = items[i];
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-9">
        <span className="font-display text-[7rem] leading-[0.5] text-white/60" aria-hidden>“</span>
        <blockquote key={i} className="display animate-[fadeUp_.9s_ease-out] text-[2rem] leading-[1.15] sm:text-5xl lg:text-[3.6rem]">
          {t.quote}
        </blockquote>
      </div>
      <div className="lg:col-span-3">
        <div key={`p${i}`} className="flex animate-[fadeUp_.9s_ease-out] items-center gap-4">
          {t.photo ? <img src={sized(t.photo, 300)} alt={t.name} className="h-16 w-16 object-cover grayscale" /> : <Monogram name={t.name} index={i} size="sm" className="h-16 w-16 !bg-white !text-rani" />}
          <div>
            <p className="font-display text-xl">{t.name}</p>
            <p className="text-sm text-white/90">{t.role}</p>
          </div>
        </div>
        <div className="mt-5"><Stars value={t.rating} tone="light" className="h-3.5 w-3.5" /></div>
        <div className="mt-10 flex items-center justify-between border-t border-white/30 pt-5">
          <span className="font-display text-sm italic">{pad(i + 1)} <span className="text-white/95">/ {pad(items.length)}</span></span>
          <div className="flex gap-2">
            <button onClick={() => setI((i - 1 + items.length) % items.length)} aria-label="Previous testimonial" className="grid h-11 w-11 place-items-center border border-white/50 transition hover:bg-white hover:text-rani"><ArrowLeft className="h-4 w-4" strokeWidth={1.4} /></button>
            <button onClick={() => setI((i + 1) % items.length)} aria-label="Next testimonial" className="grid h-11 w-11 place-items-center border border-white/50 transition hover:bg-white hover:text-rani"><ArrowRight className="h-4 w-4" strokeWidth={1.4} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Faqs({ items }: { items: any[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t border-ink/15">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-ink/15">
            <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-6 text-left">
              <span className="font-display text-sm italic text-ink-mute">{pad(i + 1)}</span>
              <span className={`font-display text-xl leading-snug transition-colors md:text-2xl ${isOpen ? "text-rani" : "text-ink"}`}>{f.question}</span>
              <span className="relative mt-2 h-3 w-3 shrink-0">
                <span className="absolute left-0 top-1/2 h-px w-3 bg-ink" />
                <span className={`absolute left-1/2 top-0 h-3 w-px bg-ink transition-transform duration-300 ${isOpen ? "scale-y-0" : ""}`} />
              </span>
            </button>
            <div className={`grid transition-all duration-500 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-7 pl-[3.5rem] leading-relaxed text-ink-mute">{f.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Lightbox({ images, index, onClose, onIndex }: { images: { image: string; title?: string; category?: string }[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onIndex]);
  if (index == null) return null;
  const img = images[index];
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ink text-white" role="dialog" aria-modal aria-label="Image viewer">
      <div className="wrap flex h-20 items-center justify-between">
        <span className="font-display text-sm italic">{pad(index + 1)} <span className="text-white/50">/ {pad(images.length)}</span></span>
        <button onClick={onClose} className="label flex items-center gap-2 text-[10px] text-white/80 hover:text-white">Close <X className="h-4 w-4" strokeWidth={1.4} /></button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={onClose}>
        <img key={img.image} src={sized(img.image, 2000, 85)} alt={img.title || ""} onClick={(e) => e.stopPropagation()} className="max-h-[calc(100vh-11rem)] max-w-full animate-[fadeUp_.5s_ease-out] object-contain" />
      </div>
      <div className="wrap flex h-20 items-center justify-between border-t border-white/15">
        <div>
          {img.category && <p className="label text-[10px] text-marigold">{img.category}</p>}
          <p className="font-display text-lg">{img.title}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onIndex((index - 1 + images.length) % images.length)} aria-label="Previous" className="grid h-11 w-11 place-items-center border border-white/30 hover:bg-white hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.4} /></button>
          <button onClick={() => onIndex((index + 1) % images.length)} aria-label="Next" className="grid h-11 w-11 place-items-center border border-white/30 hover:bg-white hover:text-ink"><ArrowRight className="h-4 w-4" strokeWidth={1.4} /></button>
        </div>
      </div>
    </div>
  );
}

/** Asymmetric editorial collage (home / about). */
export function GalleryCollage({ items }: { items: { image: string; title?: string; category?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const list = items.slice(0, 7);
  const spans = [
    "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-2",
    "col-span-1 row-span-1",
    "col-span-1 row-span-1",
    "col-span-2 row-span-1 md:col-span-1",
    "col-span-2 row-span-1 md:col-span-2",
  ];
  return (
    <>
      <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-4 md:gap-4">
        {list.map((g, i) => (
          <button key={g.image + i} onClick={() => setOpen(i)} className={`group relative overflow-hidden bg-paper-3 text-left ${spans[i]}`}>
            <img src={sized(g.image, i === 0 ? 1400 : 900)} alt="" loading="lazy" className="img-hover h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 translate-y-full bg-paper px-4 py-3 transition-transform duration-500 group-hover:translate-y-0">
              <span className="label block text-[10px] text-rani">{g.category}</span>
              <span className="font-display text-base text-ink">{g.title}</span>
            </span>
          </button>
        ))}
      </div>
      <Lightbox images={list} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}

/** Filterable masonry gallery (gallery page). */
export function GalleryGrid({ items, filters = true }: { items: { image: string; title?: string; category?: string }[]; filters?: boolean }) {
  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[]))];
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const shown = cat === "All" ? items : items.filter((i) => i.category === cat);
  return (
    <>
      {filters && cats.length > 2 && (
        <div className="no-scrollbar mb-12 flex gap-8 overflow-x-auto border-b border-ink/15">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`label relative shrink-0 pb-4 text-[11px] transition-colors ${cat === c ? "text-ink" : "text-ink-mute hover:text-ink"}`}>
              {c}
              <span className={`absolute -bottom-px left-0 h-px bg-rani transition-all ${cat === c ? "w-full" : "w-0"}`} />
            </button>
          ))}
        </div>
      )}
      <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {shown.map((g, i) => (
          <button key={g.image + i} onClick={() => setOpen(i)} className="group block w-full break-inside-avoid text-left">
            <span className="block overflow-hidden bg-paper-3">
              <img src={sized(g.image, 900)} alt="" loading="lazy" className={`img-hover w-full object-cover ${["aspect-[3/4]", "aspect-[4/3]", "aspect-square", "aspect-[4/5]"][i % 4]}`} />
            </span>
            <span className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-display text-base text-ink">{g.title}</span>
              <span className="label shrink-0 text-[9px] text-ink-mute">{g.category}</span>
            </span>
          </button>
        ))}
      </div>
      <Lightbox images={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}

/** Package photo set: lead image + grid, opens the lightbox. */
export function PhotoStrip({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const list = images.map((image, i) => ({ image, title: `${title} — ${pad(i + 1)}` }));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {images.slice(0, 5).map((src, i) => (
          <button key={src + i} onClick={() => setOpen(i)} aria-label={`View photo ${i + 1} of ${images.length}`} className={`group relative overflow-hidden bg-paper-3 ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}>
            <img src={sized(src, i === 0 ? 1400 : 700)} alt="" loading="lazy" className="img-hover h-full w-full object-cover" />
            {i === 4 && images.length > 5 && <span className="absolute inset-0 grid place-items-center bg-ink/55 font-display text-2xl text-white">+{images.length - 5}</span>}
          </button>
        ))}
      </div>
      <Lightbox images={list} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </>
  );
}
