import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-pretty text-[13px] text-secondary">
          掲載中のイベントはモックデータです。カードを開くと connpass のイベントページへ移動します。
        </p>
        <nav aria-label="規約・ポリシー" className="flex shrink-0 gap-4 text-[13px]">
          <Link
            href="/privacy"
            className="text-secondary underline-offset-2 hover:text-primary hover:underline"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            className="text-secondary underline-offset-2 hover:text-primary hover:underline"
          >
            利用規約
          </Link>
        </nav>
      </div>
    </footer>
  );
}
