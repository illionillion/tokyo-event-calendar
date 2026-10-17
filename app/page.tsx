import { Suspense } from "react";
import { EventExplorer } from "@/components/event-explorer";
import { ExplorerSkeleton } from "@/components/explorer-skeleton";

/**
 * 静的に書き出すページ。今日の日付・今の時刻とイベントは、ブラウザで決めて読む。
 * EventExplorer は useSearchParams を使うので、書き出した HTML には Suspense の fallback（骨組み）が入り、
 * 中身はブラウザでだけ描く（今日の日付がサーバーとずれてハイドレーションが食い違うことはない）。
 * クローラーには middleware.ts がサーバーで描くページ（app/crawler）を返す。
 */
export default function Page() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <EventExplorer />
    </Suspense>
  );
}
