import raw from "@/data/events.json";
import { toCalendarEvent } from "@/lib/connpass";
import { daysBetween, parseDateKey } from "@/lib/dates";
import type { ConnpassEvent, Event } from "@/lib/types";

/** モック JSON の開催日の基準。実データの JSON に差し替えるときは null を渡して日付をずらさない。 */
export const MOCK_DATE_ANCHOR = "2026-09-24";

/**
 * `data/events.json` は connpass API v2 のイベント一覧レスポンス。
 * https://connpass.com/about/api/v2/
 * 区・市・県と開催形態は API に無いので、住所とキャッチから画面用に決める。
 */
export function materializeEvents(
  today: string,
  records: ConnpassEvent[] = raw.events as ConnpassEvent[],
  anchor: string | null = MOCK_DATE_ANCHOR
): Event[] {
  if (!parseDateKey(today) || (anchor !== null && !parseDateKey(anchor))) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  const dayDelta = anchor ? daysBetween(anchor, today) : 0;

  return records.flatMap((record) => {
    const event = toCalendarEvent(record, dayDelta);
    return event ? [event] : [];
  });
}
