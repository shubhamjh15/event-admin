const MONO_TONES = ["bg-rani text-white", "bg-marigold text-ink", "bg-peacock text-white", "bg-ink text-white"];

/** Typographic stand-in for a missing portrait: initials on a flat brand-colour block. */
export function Monogram({ name, index = 0, className = "", size = "lg" }: { name: string; index?: number; className?: string; size?: "sm" | "lg" }) {
  const initials = (name || "")
    .replace(/^(the|mr|mrs|ms|dr)\s+/i, "")
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className={`grid place-items-center ${MONO_TONES[index % MONO_TONES.length]} ${className}`} role="img" aria-label={name}>
      <span className={`font-display italic leading-none ${size === "lg" ? "text-[5.5rem] md:text-[7rem]" : "text-2xl"}`}>{initials}</span>
    </div>
  );
}
