import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <p className="label text-ink-mute">Error 404</p>
        <h1 className="display mt-8 text-6xl md:text-8xl">This party has <em className="serif-i text-rani">moved venues.</em></h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-ink-mute">The page you're looking for doesn't exist — but the celebration continues.</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <Link href="/" className="btn-ink">Back home</Link>
          <Link href="/events" className="link">Explore events</Link>
        </div>
      </div>
    </main>
  );
}
