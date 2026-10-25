import type { ReactNode } from "react";
import Link from "next/link";

const LINK_CLASS = "text-secondary underline-offset-2 hover:text-primary hover:underline";

const AUTHOR_PROFILE_URL = "https://github.com/illionillion";
const REPOSITORY_URL = "https://github.com/illionillion/tokyo-event-calendar";
const ISSUES_URL = `${REPOSITORY_URL}/issues`;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
      {children}
      <span className="sr-only">（新しいタブで開く）</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto min-w-0 border-t border-border bg-card">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-pretty text-[13px] text-secondary">
            掲載しているイベントは、connpass から 1 日 1 回取得した情報です。カードを開くと connpass
            のイベントページへ移動します。
          </p>
          <p className="text-pretty text-[13px] text-secondary">
            作者{" "}
            <ExternalLink href={AUTHOR_PROFILE_URL}>
              illionillion
              <span className="sr-only">の GitHub プロフィール</span>
            </ExternalLink>
            {" ・ "}
            <ExternalLink href={REPOSITORY_URL}>ソースコード</ExternalLink>
            {" ・ "}
            <ExternalLink href={ISSUES_URL}>
              不具合・要望
              <span className="sr-only">（GitHub Issues）</span>
            </ExternalLink>
          </p>
        </div>
        <nav aria-label="規約・ポリシー" className="flex shrink-0 gap-4 text-[13px]">
          <Link href="/privacy" className={LINK_CLASS}>
            プライバシーポリシー
          </Link>
          <Link href="/terms" className={LINK_CLASS}>
            利用規約
          </Link>
        </nav>
      </div>
    </footer>
  );
}
