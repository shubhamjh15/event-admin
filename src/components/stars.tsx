import { Star } from "lucide-react";

export function Stars({ value = 5, className = "h-4 w-4", tone = "rani" }: { value?: number; className?: string; tone?: "rani" | "light" }) {
  const on = tone === "light" ? "fill-white text-white" : "fill-rani text-rani";
  const off = tone === "light" ? "fill-white/25 text-white/25" : "fill-ink/10 text-ink/10";
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= Math.round(value) ? on : off}`} strokeWidth={1.2} />
      ))}
    </span>
  );
}
