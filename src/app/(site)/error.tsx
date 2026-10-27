"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <section className="grid min-h-[80vh] place-items-center bg-paper px-6 pt-32 text-center">
      <div className="max-w-xl">
        <p className="label text-ink-mute">A brief intermission</p>
        <h1 className="display mt-8 text-5xl md:text-7xl">We couldn't load this page <em className="serif-i text-rani">just now.</em></h1>
        <p className="mt-6 text-lg text-ink-mute">Please try again in a moment. If it keeps happening, our planners are still a call away.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <button onClick={reset} className="btn-ink">Try again</button>
          <Link href="/" className="link">Back home</Link>
        </div>
      </div>
    </section>
  );
}
