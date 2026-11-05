import type { Event, EventSummary } from "@/lib/types";

/**
 * イベントは Worker にバンドルせず、ビルド時に `public/data/` へ日ごとの JSON として書き出す。
 * ブラウザは表示に要る日の分だけ静的ファイルとして取りにいく。
 *
 *   /data/events/index.json        … データのある日と件数
 *   /data/events/YYYY-MM-DD.json   … その日に始まるイベント（説明文を含む全項目）
 *   /data/events-lite.json         … 全イベントの軽い一覧（カレンダーの印・エリアの候補・クローラー向け）
 */
export const EVENT_DATA_BASE_PATH = "/data/events";
export const EVENT_INDEX_PATH = `${EVENT_DATA_BASE_PATH}/index.json`;
export const EVENT_LITE_PATH = "/data/events-lite.json";

export function dayDataPath(date: string): string {
  return `${EVENT_DATA_BASE_PATH}/${date}.json`;
}

export type EventIndex = {
  generatedAt: string;
  /** データのある日（YYYY-MM-DD）とその日に始まるイベントの件数。日付順。 */
  dates: Record<string, number>;
};

export type DailyEventData = {
  index: EventIndex;
  days: Map<string, Event[]>;
  lite: EventSummary[];
};

export function toEventSummary(event: Event): EventSummary {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    start: event.start,
    end: event.end,
    format: event.format,
    area: event.area,
    venueName: event.venueName,
    url: event.url,
    cancelled: event.cancelled,
  };
}

function byStart(left: Event, right: Event): number {
  return left.startedAt.localeCompare(right.startedAt) || left.id.localeCompare(right.id);
}

/** 変換済みのイベントを、開始日ごとのファイルと索引・軽い一覧に分ける。 */
export function buildDailyEventData(events: Event[], generatedAt: string): DailyEventData {
  const days = new Map<string, Event[]>();
  for (const event of [...events].sort(byStart)) {
    const list = days.get(event.date) ?? [];
    list.push(event);
    days.set(event.date, list);
  }

  const sortedDates = [...days.keys()].sort();
  const sortedDays = new Map(sortedDates.map((date) => [date, days.get(date) ?? []]));
  const dates = Object.fromEntries(sortedDates.map((date) => [date, sortedDays.get(date)!.length]));

  return {
    index: { generatedAt, dates },
    days: sortedDays,
    lite: sortedDates.flatMap((date) => sortedDays.get(date)!.map(toEventSummary)),
  };
}
