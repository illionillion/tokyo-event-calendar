import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  title: string;
  dateText: string;
  dateLabel?: string;
  children: ReactNode;
};

/**
 * プライバシーポリシー・利用規約など、本文が長い静的ページ用のレイアウト。
 */
export function LegalPageLayout({
  title,
  dateText,
  dateLabel = "最終更新日",
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="text-pretty text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-[13px] text-secondary">
        {dateLabel}: {dateText}
      </p>
      <div className="mt-6 text-sm leading-relaxed text-foreground">{children}</div>
    </main>
  );
}
