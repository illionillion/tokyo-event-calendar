export function ExplorerSkeleton() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-6">
        <div className="h-28 w-full rounded-lg border border-border bg-card lg:h-16 lg:w-[40rem]" />
        <div className="hidden h-10 w-36 rounded-md bg-surface lg:block" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <div className="h-40 rounded-lg border border-border bg-card lg:h-[640px]" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-surface lg:hidden" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-56 rounded-lg border border-border bg-card lg:h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}
