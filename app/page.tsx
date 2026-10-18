import { connection } from "next/server";
import { Suspense } from "react";
import { EventExplorer } from "@/components/event-explorer";
import { ExplorerSkeleton } from "@/components/explorer-skeleton";
import { todayKey } from "@/lib/dates";

async function CalendarLoader() {
  await connection();
  const today = todayKey();
  const now = new Date().toISOString();

  // イベントはサーバーで渡さない。ブラウザが表示に要る日の分を静的ファイルから読む。
  return <EventExplorer today={today} now={now} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <CalendarLoader />
    </Suspense>
  );
}
