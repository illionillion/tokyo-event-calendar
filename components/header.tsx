import Link from "next/link";

function CalendarMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7.5h14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 2.5v2.5M12 2.5v2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center px-4">
        <a
          href="#events"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-sm"
        >
          イベント一覧へ
        </a>
        <Link href="/" className="flex items-center gap-2.5 rounded-md text-foreground">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
            <CalendarMark />
          </span>
          <span>
            <span className="block text-[15px] leading-tight font-semibold text-balance">
              東京イベントカレンダー
            </span>
            <span className="hidden text-[12px] text-secondary sm:block">
              connpass の東京イベントを日付で眺める
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
