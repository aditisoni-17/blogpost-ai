export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-12">
      <div className="surface-card rounded-[2rem] p-8 md:p-12">
        <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 h-10 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="surface-card overflow-hidden rounded-3xl"
          >
            <div className="h-52 animate-pulse bg-slate-200" />
            <div className="space-y-4 p-6">
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
