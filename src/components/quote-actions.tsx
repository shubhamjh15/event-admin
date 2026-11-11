"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";

/** Customer-side purchase of a quote, from the review page an AI assistant shares. */
export function QuoteBookForm({ quoteRef, total, deposit, methods, online, defaults }: {
  quoteRef: string; total: string; deposit: string; methods: string[]; online: boolean; defaults?: { name?: string; email?: string };
}) {
  const router = useRouter();
  const options = online ? ["Online", ...methods] : methods;
  const [pay, setPay] = useState(options[0] || "Bank Transfer");
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agree) return setState({ loading: false, error: "Please confirm you approve the total and deposit." });
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState({ loading: true });
    try {
      const res = await fetch(`/api/q/${quoteRef}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, paymentMethod: pay, customerConfirmed: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      if (pay === "Online") {
        window.location.href = `/api/pay/${quoteRef}`;
        return;
      }
      router.refresh();
    } catch (err: any) {
      setState({ loading: false, error: err?.message || "We couldn't reach our server. Please try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-y-6">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="block"><span className="field-label">Full name *</span><input name="name" required minLength={2} defaultValue={defaults?.name} autoComplete="name" className="field" /></label>
      <label className="block"><span className="field-label">Email *</span><input name="email" type="email" required defaultValue={defaults?.email} autoComplete="email" className="field" /></label>
      <label className="block"><span className="field-label">Phone (with country code) *</span><input name="phone" required autoComplete="tel" className="field" placeholder="+91" /></label>
      <fieldset>
        <legend className="field-label mb-3">Pay the deposit by</legend>
        <div className="grid grid-cols-2 gap-2">
          {options.map((m) => (
            <button key={m} type="button" aria-pressed={pay === m} onClick={() => setPay(m)}
              className={`border px-3 py-2.5 text-left text-sm transition-colors ${pay === m ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink"}`}>
              {m === "Online" ? "Card · UPI · Net banking" : m}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className="field-label">Notes for your planner</span><textarea name="notes" rows={2} className="field resize-none" /></label>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition-colors ${agree ? "border-ink bg-ink text-paper" : "border-ink/40"}`}>
          {agree && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
        </span>
        <input type="checkbox" className="sr-only" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I approve the total of <strong>{total}</strong> and will pay a deposit of <strong>{deposit}</strong> to confirm. My planner will confirm availability within 24 hours.</span>
      </label>
      {state.error && <p role="alert" className="text-sm text-rani">{state.error}</p>}
      <button disabled={state.loading} className="btn-ink w-full">
        {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pay === "Online" ? `Book & pay ${deposit}` : "Book at this price"}
        {!state.loading && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />}
      </button>
    </form>
  );
}
