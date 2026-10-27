"use client";
import { useEffect, useRef } from "react";

/** Fades content up (or wipes an image in) the first time it scrolls into view. */
export function Reveal({
  children, className = "", delay = 0, as: Tag = "div", img = false,
}: { children: React.ReactNode; className?: string; delay?: number; as?: any; img?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`${img ? "reveal-img" : "reveal"} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const m = value.match(/^([^\d]*)([\d,]+)(.*)$/);
    if (!el || !m) return;
    const target = parseInt(m[2].replace(/,/g, ""), 10);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1800);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = `${m[1]}${Math.round(target * eased).toLocaleString("en-US")}${m[3]}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{value}</span>;
}
