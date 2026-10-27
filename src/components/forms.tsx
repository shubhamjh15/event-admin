"use client";
import { useState } from "react";
import { ArrowRight, Check, Loader2, Star } from "lucide-react";

type Status = { state: "idle" | "loading" | "ok" | "error"; message?: string };
type Tone = "light" | "dark";

async function post(url: string, body: unknown) {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("We couldn't reach our server. Please check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function formData(e: React.FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
}

const fieldCls = (tone: Tone) => (tone === "dark" ? "field-dark" : "field");
const labelCls = (tone: Tone) => `field-label ${tone === "dark" ? "!text-white/60" : ""}`;

function Field({ label, children, className = "", tone = "light" }: { label: string; children: React.ReactNode; className?: string; tone?: Tone }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls(tone)}>{label}</span>
      {children}
    </label>
  );
}

function Success({ title, text, onReset, tone = "light" }: { title: string; text: string; onReset: () => void; tone?: Tone }) {
  return (
    <div className="py-10" role="status">
      <span className={`grid h-14 w-14 place-items-center border ${tone === "dark" ? "border-white/60" : "border-ink"}`}><Check className="h-6 w-6" strokeWidth={1.4} /></span>
      <h3 className="display mt-8 text-4xl">{title}</h3>
      <p className={`mt-4 max-w-md leading-relaxed ${tone === "dark" ? "text-white/75" : "text-ink-mute"}`}>{text}</p>
      <button onClick={onReset} className="link mt-8">Send another</button>
    </div>
  );
}

function Submit({ loading, children, tone = "light", className = "" }: { loading: boolean; children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <button disabled={loading} className={`${tone === "dark" ? "btn-paper" : "btn-ink"} ${className}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
      {!loading && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />}
    </button>
  );
}

export function EnquiryForm({ eventTypes, source = "contact", compact = false, defaultType, tone = "light" }: { eventTypes: string[]; source?: string; compact?: boolean; defaultType?: string; tone?: Tone }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "loading" });
    try {
      await post("/api/enquiries", { ...formData(e), source });
      form.reset();
      setStatus({ state: "ok" });
    } catch (err: any) {
      setStatus({ state: "error", message: err.message });
    }
  }
  if (status.state === "ok") {
    return <Success tone={tone} title="Thank you." text="A Lit Concierge planner will be in touch within one business day with ideas and a tailored proposal." onReset={() => setStatus({ state: "idle" })} />;
  }
  const f = fieldCls(tone);
  return (
    <form onSubmit={onSubmit} className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Field tone={tone} label="Full name *"><input name="name" required className={f} autoComplete="name" /></Field>
      <Field tone={tone} label="Email *"><input name="email" type="email" required className={f} autoComplete="email" /></Field>
      <Field tone={tone} label="Phone *"><input name="phone" required className={f} autoComplete="tel" /></Field>
      <Field tone={tone} label="Occasion">
        <select name="eventType" className={f} defaultValue={defaultType || ""}>
          <option value="">Select an occasion</option>
          {eventTypes.map((t) => <option key={t}>{t}</option>)}
          <option>Other</option>
        </select>
      </Field>
      {!compact && (
        <>
          <Field tone={tone} label="Event date"><input name="eventDate" type="date" min={new Date().toISOString().slice(0, 10)} suppressHydrationWarning className={f} /></Field>
          <Field tone={tone} label="Guests"><input name="guests" inputMode="numeric" className={f} placeholder="Approx. number" /></Field>
          <Field tone={tone} label="Budget">
            <select name="budget" className={f} defaultValue="">
              <option value="">Select a range</option>
              {["Under $25k", "$25k – $50k", "$50k – $100k", "$100k – $250k", "$250k+"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field tone={tone} label="Destination"><input name="destination" className={f} placeholder="City or country" /></Field>
        </>
      )}
      <Field tone={tone} label="Tell us about it" className="sm:col-span-2">
        <textarea name="message" rows={compact ? 3 : 4} className={`${f} resize-none`} placeholder="Your vision, must-haves, questions…" />
      </Field>
      {status.state === "error" && <p role="alert" className={`text-sm sm:col-span-2 ${tone === "dark" ? "text-marigold" : "text-rani"}`}>{status.message}</p>}
      <div className="flex flex-col items-start gap-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${tone === "dark" ? "text-white/60" : "text-ink-mute"}`}>We reply within 24 hours. Your details are never shared.</p>
        <Submit tone={tone} loading={status.state === "loading"}>Send enquiry</Submit>
      </div>
    </form>
  );
}

export function BookingForm({ events, payments, defaultPackage, defaultKind = "booking" }: { events: { slug: string; title: string }[]; payments: string[]; defaultPackage?: string; defaultKind?: "booking" | "appointment" }) {
  const [kind, setKind] = useState<"booking" | "appointment">(defaultKind);
  const [pay, setPay] = useState(payments[0] || "Credit Card");
  const [mode, setMode] = useState("Video call");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "loading" });
    try {
      await post("/api/bookings", { ...formData(e), kind, paymentMethod: kind === "booking" ? pay : undefined, mode: kind === "appointment" ? mode : undefined });
      form.reset();
      setStatus({ state: "ok" });
    } catch (err: any) {
      setStatus({ state: "error", message: err.message });
    }
  }

  if (status.state === "ok") {
    return (
      <Success
        title={kind === "booking" ? "Request received." : "See you soon."}
        text={kind === "booking" ? "Your planner will confirm availability, final pricing and payment details within 24 hours." : "We'll confirm your consultation time by email shortly."}
        onReset={() => setStatus({ state: "idle" })}
      />
    );
  }

  const choice = (on: boolean) => `border px-4 py-3 text-left text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink hover:border-ink"}`;

  return (
    <div>
      <div className="mb-10 flex gap-8 border-b border-ink/15" role="tablist">
        {([["booking", "Book an event"], ["appointment", "Free consultation"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={`relative pb-4 font-display text-xl transition-colors md:text-2xl ${kind === k ? "text-ink" : "text-ink-mute hover:text-ink"}`}>
            {l}
            <span className={`absolute -bottom-px left-0 h-[2px] bg-rani transition-all duration-300 ${kind === k ? "w-full" : "w-0"}`} />
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field label="Full name *"><input name="name" required className="field" autoComplete="name" /></Field>
        <Field label="Email *"><input name="email" type="email" required className="field" autoComplete="email" /></Field>
        <Field label="Phone *"><input name="phone" required className="field" autoComplete="tel" /></Field>
        {kind === "booking" ? (
          <Field label="Event package">
            <select name="eventPackage" className="field" defaultValue={defaultPackage || ""}>
              <option value="">Bespoke / not sure yet</option>
              {events.map((e) => <option key={e.slug} value={e.slug}>{e.title}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Preferred time *"><input name="time" type="time" required className="field" defaultValue="11:00" /></Field>
        )}
        <Field label={kind === "booking" ? "Event date *" : "Preferred date *"}><input name="eventDate" type="date" required min={new Date().toISOString().slice(0, 10)} suppressHydrationWarning className="field" /></Field>
        {kind === "booking" && <Field label="Guests"><input name="guests" inputMode="numeric" className="field" /></Field>}

        <fieldset className="sm:col-span-2">
          <legend className="field-label mb-3">{kind === "booking" ? "Preferred payment — we accept all forms" : "Meeting"}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {(kind === "booking" ? payments : ["In person", "Video call", "Phone call"]).map((p) => {
              const on = kind === "booking" ? pay === p : mode === p;
              return (
                <button type="button" key={p} aria-pressed={on} onClick={() => (kind === "booking" ? setPay(p) : setMode(p))} className={choice(on)}>
                  {p}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field label="Notes" className="sm:col-span-2"><textarea name="message" rows={3} className="field resize-none" placeholder="Anything we should know?" /></Field>
        {status.state === "error" && <p role="alert" className="text-sm text-rani sm:col-span-2">{status.message}</p>}
        <div className="sm:col-span-2">
          <Submit loading={status.state === "loading"} className="w-full sm:w-auto">{kind === "booking" ? "Request booking" : "Request consultation"}</Submit>
        </div>
      </form>
    </div>
  );
}

export function RatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
          <Star className={`h-6 w-6 transition ${(hover || value) >= n ? "fill-rani text-rani" : "text-ink/25"}`} strokeWidth={1.2} />
        </button>
      ))}
    </div>
  );
}

export function CommentForm({ blog }: { blog: string }) {
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "loading" });
    try {
      await post(`/api/blogs/${blog}/comments`, { ...formData(e), rating });
      form.reset();
      setStatus({ state: "ok", message: "Thank you — your comment will appear once our editors approve it." });
    } catch (err: any) {
      setStatus({ state: "error", message: err.message });
    }
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <span className="field-label mb-3">Your rating</span>
        <RatingInput value={rating} onChange={setRating} />
      </div>
      <Field label="Name *"><input name="name" required className="field" /></Field>
      <Field label="Email * (never published)"><input name="email" type="email" required className="field" /></Field>
      <Field label="Comment *" className="sm:col-span-2"><textarea name="text" required rows={4} className="field resize-none" /></Field>
      {status.message && <p role="status" className={`text-sm sm:col-span-2 ${status.state === "error" ? "text-rani" : "text-peacock"}`}>{status.message}</p>}
      <div><Submit loading={status.state === "loading"}>Post comment</Submit></div>
    </form>
  );
}

export function NewsletterForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: "loading" });
    try {
      await post("/api/subscribe", formData(e));
      form.reset();
      setStatus({ state: "ok", message: "Thank you — you're on the list." });
    } catch (err: any) {
      setStatus({ state: "error", message: err.message });
    }
  }
  return (
    <form onSubmit={onSubmit} className="w-full">
      <label className="field-label !text-white/50" htmlFor="nl-email">Email address</label>
      <div className="flex items-end gap-4 border-b border-white/40 focus-within:border-white">
        <input id="nl-email" name="email" type="email" required placeholder="you@example.com" className="w-full border-0 bg-transparent px-0 py-3 text-lg text-white outline-none placeholder:text-white/35 focus:ring-0" />
        <button disabled={status.state === "loading"} className="label flex shrink-0 items-center gap-2 pb-3.5 text-[11px] text-white hover:text-marigold">
          {status.state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>}
        </button>
      </div>
      {status.message && <p className={`mt-3 text-sm ${status.state === "error" ? "text-rani" : "text-marigold"}`}>{status.message}</p>}
    </form>
  );
}
