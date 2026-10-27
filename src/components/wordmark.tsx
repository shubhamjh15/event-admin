import Link from "next/link";

export function Wordmark({ light = false, size = "md" }: { light?: boolean; size?: "md" | "lg" }) {
  return (
    <Link href="/" aria-label="Lit Concierge — home" className={`group inline-flex flex-col items-center leading-none transition-colors duration-500 ${light ? "text-white" : "text-ink"}`}>
      <span className={`font-display italic ${size === "lg" ? "text-6xl" : "text-[2.1rem]"} -mb-0.5 transition-colors group-hover:text-rani`}>Lit</span>
      <span className={`${size === "lg" ? "text-[11px]" : "text-[9px]"} font-semibold uppercase tracking-[0.42em]`}>Concierge</span>
    </Link>
  );
}
