export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-ink/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-white ring-1 ring-ink/5" />)}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-white ring-1 ring-ink/5" />
    </div>
  );
}
