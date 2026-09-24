export function ExplorerSkeleton() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-4" aria-hidden="true">
      <div className="h-[118px] rounded-lg border border-border bg-card" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <div className="h-40 rounded-lg border border-border bg-card lg:h-[640px]" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md bg-surface" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
