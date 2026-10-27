const TONES: Record<string, string> = {
  new: "bg-violet/10 text-violet",
  contacted: "bg-saffron/15 text-[#B45F06]",
  "proposal-sent": "bg-teal/10 text-teal",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-ink/5 text-ink-mute",
  pending: "bg-saffron/15 text-[#B45F06]",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-teal/10 text-teal",
  cancelled: "bg-ink/5 text-ink-mute",
  booking: "bg-rose/10 text-rose",
  appointment: "bg-violet/10 text-violet",
};

export function StatusBadge({ value }: { value?: string }) {
  if (!value) return null;
  return <span className={`chip whitespace-nowrap capitalize ${TONES[value] || "bg-ivory-deep text-ink-soft"}`}>{value.replace(/-/g, " ")}</span>;
}
