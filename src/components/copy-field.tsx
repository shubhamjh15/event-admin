"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ value, tone = "light" }: { value: string; tone?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the text is selectable */
    }
  }
  const dark = tone === "dark";
  return (
    <div className={`flex items-stretch border ${dark ? "border-white/30" : "border-ink/25 bg-white/60"}`}>
      <code className={`min-w-0 flex-1 select-all overflow-x-auto whitespace-nowrap px-4 py-3 font-mono text-[13px] ${dark ? "text-white" : "text-ink"}`}>{value}</code>
      <button type="button" onClick={copy} aria-label="Copy to clipboard"
        className={`flex shrink-0 items-center gap-2 border-l px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${dark ? "border-white/30 hover:bg-white hover:text-ink" : "border-ink/25 hover:bg-ink hover:text-paper"}`}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
