"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type T = { id: number; text: string; tone: "ok" | "error" };
const listeners = new Set<(t: T) => void>();

export function toast(text: string, tone: "ok" | "error" = "ok") {
  const t = { id: Date.now() + Math.random(), text, tone };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (t: T) => {
      setItems((x) => [...x, t]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 3000);
    };
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[200] space-y-2" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`flex animate-[fadeUp_.3s_ease-out] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lux ${t.tone === "ok" ? "bg-ink" : "bg-rose"}`}>
          {t.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertCircle className="h-4 w-4" />} {t.text}
        </div>
      ))}
    </div>
  );
}
