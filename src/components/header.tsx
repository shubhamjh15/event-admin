"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "./wordmark";

const LEFT = [
  { href: "/events", label: "Events" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
];
const RIGHT = [
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Journal" },
  { href: "/contact", label: "Contact" },
];
const ALL = [{ href: "/", label: "Home" }, ...LEFT, ...RIGHT, { href: "/book", label: "Book" }];

// Pages whose first section is a dark full-bleed image/video (header starts transparent & light).
const DARK_HERO = /^\/($|events|services|about)/;

export function Header({ phone, since }: { phone: string; since: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const overHero = DARK_HERO.test(pathname) && !scrolled && !open;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const navCls = (href: string) =>
    `relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
      overHero ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-ink"
    } ${isActive(href) ? (overHero ? "!text-white" : "!text-ink") : ""}`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color] duration-500 ${
          overHero ? "border-b border-white/15 bg-transparent" : open ? "border-b border-transparent bg-paper" : "border-b border-ink/10 bg-paper/95 backdrop-blur"
        }`}
      >
        <div className="wrap grid h-[78px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {LEFT.map((n) => (
              <Link key={n.href} href={n.href} className={navCls(n.href)}>
                {n.label}
                {isActive(n.href) && <span className="absolute -bottom-px left-0 h-px w-full bg-current" />}
              </Link>
            ))}
          </nav>
          <p className={`label hidden text-[10px] sm:block lg:hidden ${overHero ? "text-white/80" : "text-ink-mute"}`}>Est. {since}</p>
          <span className="sm:hidden" />

          <Wordmark light={overHero} />

          <div className="flex items-center justify-end gap-9">
            <nav className="hidden items-center gap-9 lg:flex" aria-label="Secondary">
              {RIGHT.map((n) => (
                <Link key={n.href} href={n.href} className={navCls(n.href)}>
                  {n.label}
                  {isActive(n.href) && <span className="absolute -bottom-px left-0 h-px w-full bg-current" />}
                </Link>
              ))}
            </nav>
            <Link
              href="/book"
              className={`hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors xl:inline-flex ${
                overHero ? "bg-white text-ink hover:bg-marigold" : "bg-ink text-paper hover:bg-rani"
              }`}
            >
              Book now
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label="Menu"
              className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] lg:hidden ${overHero ? "text-white" : "text-ink"}`}
            >
              {open ? "Close" : "Menu"}
              <span className="relative block h-3 w-6">
                <span className={`absolute left-0 h-px w-6 bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 h-px w-6 bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet full-screen menu */}
      <div className={`fixed inset-0 z-40 bg-paper transition-[opacity,visibility] duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="wrap flex h-full flex-col pb-10 pt-[110px]">
          <nav className="flex-1">
            {ALL.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                className={`flex items-baseline gap-5 border-b border-ink/10 py-3.5 transition-all duration-700 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                <span className="w-6 font-display text-sm italic text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className={`display text-[2.4rem] ${isActive(n.href) ? "italic text-rani" : "text-ink"}`}>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <p className="label text-[10px] text-ink-mute">Est. {since} · Licensed · Bonded · Insured</p>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-2 block font-display text-2xl">{phone}</a>
            </div>
            <Link href="/contact" className="btn-ink !px-5">Enquire <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </>
  );
}
