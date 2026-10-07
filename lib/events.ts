import raw from "@/data/events.json";
import { toCalendarEvent } from "@/lib/connpass";
import { daysBetween, parseDateKey } from "@/lib/dates";
import type { ConnpassEvent, Event } from "@/lib/types";

/**
 * 公開カレンダーから写したスナップショットは、ページ上の開催日のまま読む。
 * 日付をまとめて動かして試すときだけ、materializeEvents の anchor に基準日を渡す。
 */
export const MOCK_DATE_ANCHOR: string | null = null;

/**
 * 同じ isolate では、同じスナップショットと同じ日付ずらしの変換結果を使い回す。
 * 開催日をずらさない本番では today が違っても中身は同じなので、1 回分の変換で足りる。
 */
const materialized = new WeakMap<ConnpassEvent[], Map<string, Event[]>>();

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
  const cacheKey = `${anchor ?? ""}\0${dayDelta}`;
  const cached = materialized.get(records)?.get(cacheKey);
  if (cached) return cached;

  const events = records.flatMap((record) => {
    const event = toCalendarEvent(record, dayDelta);
    return event ? [event] : [];
  });
  const bucket = materialized.get(records) ?? new Map<string, Event[]>();
  bucket.set(cacheKey, events);
  materialized.set(records, bucket);
  return events;
}
