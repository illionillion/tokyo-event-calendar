import raw from "@/data/events.json";
import { addDays, isValidTime, parseDateKey, toTokyoIso } from "@/lib/dates";
import type { Event, EventFormat, RawEvent } from "@/lib/types";

const FORMATS = new Set<EventFormat>(["online", "offline", "hybrid"]);

function assertRawEvent(value: RawEvent): void {
  if (!value.id || !value.title) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  if (!Number.isInteger(value.dayOffset)) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  if (!isValidTime(value.start) || !isValidTime(value.end)) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  if (!FORMATS.has(value.format)) {
    throw new Error("イベントデータを読み取れませんでした");
  }
}

/**
 * `data/events.json` は connpass API v2 のイベントを画面向けに正規化したもの。
 * https://connpass.com/about/api/v2/
 * title / url / started_at / ended_at / address / place / hash_tag / accepted / limit / image_url
 * に対応する。区・市と開催形態は API に無いので会場住所から決める。
 * dayOffset は API キー取得前のモック専用。
 */
export function materializeEvents(
  today: string,
  records: RawEvent[] = raw.events as RawEvent[]
): Event[] {
  if (!parseDateKey(today)) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  return records.map((record) => {
    assertRawEvent(record);
    const date = addDays(today, record.dayOffset);

    return {
      id: record.id,
      title: record.title,
      date,
      start: record.start,
      end: record.end,
      startedAt: toTokyoIso(date, record.start),
      endedAt: toTokyoIso(date, record.end),
      format: record.format,
      area: record.area,
      venueName: record.venueName,
      address: record.address,
      tags: record.tags,
      accepted: record.accepted,
      limit: record.limit,
      url: `https://connpass.com/event/${record.id}/`,
    };
  });
}
