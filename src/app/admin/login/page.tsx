"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }
    router.replace(next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="label-lux">Email</span>
        <span className="relative block">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input name="email" type="email" required autoComplete="username" className="input-lux pl-11" placeholder="admin@litconcierge.com" />
        </span>
      </label>
      <label className="block">
        <span className="label-lux">Password</span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input name="password" type="password" required autoComplete="current-password" className="input-lux pl-11" placeholder="••••••••" />
        </span>
      </label>
      {error && <p className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose">{error}</p>}
      <button disabled={loading} className="btn-lit w-full">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="grain relative hidden overflow-hidden bg-ink lg:block">
        <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=85" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/80 via-ink/50 to-rose/40" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <p className="eyebrow text-saffron-light">Admin control</p>
          <h1 className="h-display mt-4 text-6xl">Run every event from <em className="text-lit">one place.</em></h1>
          <p className="mt-4 max-w-md text-white/70">Enquiries, bookings, events, services, banners, gallery, blogs, SEO, team and settings.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-ivory p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink">
              <svg viewBox="0 0 64 64" className="h-8 w-8"><defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E23E7D" /><stop offset=".5" stopColor="#F7931E" /><stop offset="1" stopColor="#E9CF8E" /></linearGradient></defs><path d="M32 6c5 10 15 15 15 28a15 15 0 0 1-30 0c0-8 4-12 6-15 1 5 4 8 6 8-1-8 0-14 3-21z" fill="url(#l)" /></svg>
            </span>
            <div>
              <p className="font-display text-2xl font-semibold"><em className="text-lit">Lit</em> Concierge</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-mute">Admin panel</p>
            </div>
          </div>
          <h2 className="h-display text-4xl">Welcome back</h2>
          <p className="mb-8 mt-2 text-ink-mute">Sign in to manage your website.</p>
          <Suspense><LoginForm /></Suspense>
        </div>
      </div>
    </main>
  );
}
