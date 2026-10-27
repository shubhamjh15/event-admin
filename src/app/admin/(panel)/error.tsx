"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl bg-white p-10 text-center ring-1 ring-ink/5">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose/10 text-rose"><AlertTriangle className="h-6 w-6" /></span>
      <h1 className="mt-5 font-display text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-mute">The database may be temporarily unreachable. Your data is safe. Please try again.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-mute">Ref: {error.digest}</p>}
      <button onClick={reset} className="btn-dark mt-6"><RotateCcw className="h-4 w-4" /> Retry</button>
    </div>
  );
}
