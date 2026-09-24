import { connection } from "next/server";
import { Suspense } from "react";
import { EventExplorer } from "@/components/event-explorer";
import { ExplorerSkeleton } from "@/components/explorer-skeleton";
import { todayKey } from "@/lib/dates";
import { materializeEvents } from "@/lib/events";

async function CalendarLoader() {
  await connection();
  const today = todayKey();
  const now = new Date().toISOString();
  const events = materializeEvents(today);

  return <EventExplorer events={events} today={today} now={now} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <CalendarLoader />
    </Suspense>
  );
}
