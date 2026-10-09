import {
  NEIGHBOR_PREFECTURE_HINTS,
  NEIGHBOR_PREFECTURES,
  TOKYO_CITIES,
  TOKYO_WARDS,
} from "@/lib/areas";
import { plainTextFromHtml } from "@/lib/html-text";
import type { ConnpassEvent, ConnpassUserField, Event, EventFormat } from "@/lib/types";

const AREAS = [...TOKYO_WARDS, ...TOKYO_CITIES].sort((left, right) => right.length - left.length);

const EVENT_TYPES = new Set<ConnpassEvent["event_type"]>(["participation", "advertisement"]);
const OPEN_STATUSES = new Set<ConnpassEvent["open_status"]>([
  "preopen",
  "open",
  "close",
  "cancelled",
]);

/** 画面用の変換に使う項目。ユーザー項目を除いたスナップショットのイベントも、API のイベントもそのまま渡せる。 */
export type CalendarSourceEvent = Omit<ConnpassEvent, ConnpassUserField>;

/**
 * 近隣の県の地名を含む東京都の市町村。絞り込みの選択肢にはないが、県と取り違えないよう地名としては探す
 * （「東大和市」を神奈川県の「大和市」にしない）。
 */
const TOKYO_LOOKALIKES = ["東大和市"] as const;

/** 県名のない住所で探す地名と、そのときのエリア。東京都の区・市と、近隣の県の市町村。 */
const PLACE_NAMES: ReadonlyArray<readonly [name: string, area: string]> = [
  ...AREAS.map((name) => [name, name] as const),
  ...TOKYO_LOOKALIKES.map((name) => [name, ""] as const),
  ...NEIGHBOR_PREFECTURES.flatMap((prefecture) =>
    NEIGHBOR_PREFECTURE_HINTS[prefecture].map((hint) => [hint, prefecture] as const)
  ),
];

/**
 * 住所から絞り込みのエリアを決める。東京都は区・市、神奈川県・埼玉県・千葉県は県名にまとめる。
 * API の EventSchema には都道府県の項目がないので、住所（address）だけで判断する。
 * 県名がないときは、住所の中でいちばん前に出てくる地名を使う（住所は大きい単位から書くので、
 * 「さいたま市中央区」は埼玉県、「東大和市」は「大和市」ではなく東京都として扱える）。
 */
export function areaFromAddress(address: string | null): string {
  if (!address) return "";
  if (address.includes("東京都")) {
    return AREAS.find((name) => address.includes(name)) ?? "";
  }

  const prefecture = NEIGHBOR_PREFECTURES.find((name) => address.includes(name));
  if (prefecture) return prefecture;

  let found: { index: number; name: string; area: string } | null = null;
  for (const [name, area] of PLACE_NAMES) {
    const index = address.indexOf(name);
    if (index < 0) continue;
    if (
      !found ||
      index < found.index ||
      (index === found.index && name.length > found.name.length)
    ) {
      found = { index, name, area };
    }
  }
  return found?.area ?? "";
}

export function formatFromConnpass(
  event: Pick<ConnpassEvent, "title" | "catch" | "place" | "address">
): EventFormat {
  const address = event.address?.trim() ?? "";
  if (address === "" || address === "オンライン") return "online";

  const mentionsOnline = [event.title, event.catch, event.place, event.address].some((value) =>
    value?.includes("オンライン")
  );
  return mentionsOnline ? "hybrid" : "offline";
}

function assertConnpassEvent(event: CalendarSourceEvent): void {
  if (!Number.isInteger(event.id) || !event.title || !event.url) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  if (!EVENT_TYPES.has(event.event_type) || !OPEN_STATUSES.has(event.open_status)) {
    throw new Error("イベントデータを読み取れませんでした");
  }
}

function clockParts(instant: Date): { date: string; time: string; second: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const hour = value("hour") === "24" ? "00" : value("hour").padStart(2, "0");

  return {
    date: `${value("year")}-${value("month").padStart(2, "0")}-${value("day").padStart(2, "0")}`,
    time: `${hour}:${value("minute").padStart(2, "0")}`,
    second: value("second").padStart(2, "0"),
  };
}

function tokyoClock(iso: string): { date: string; time: string } | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;
  const clock = clockParts(instant);
  return { date: clock.date, time: clock.time };
}

function shiftIso(iso: string, dayDelta: number): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  const shifted = new Date(instant.getTime() + dayDelta * 86_400_000);
  const clock = clockParts(shifted);
  return `${clock.date}T${clock.time}:${clock.second}+09:00`;
}

export function toCalendarEvent(event: CalendarSourceEvent, dayDelta = 0): Event | null {
  assertConnpassEvent(event);
  if (!event.started_at) return null;

  const startedAt = dayDelta === 0 ? event.started_at : shiftIso(event.started_at, dayDelta);
  const endedAt = event.ended_at
    ? dayDelta === 0
      ? event.ended_at
      : shiftIso(event.ended_at, dayDelta)
    : startedAt;
  const started = tokyoClock(startedAt);
  const ended = tokyoClock(endedAt);
  if (!started || !ended) {
    throw new Error("イベントデータを読み取れませんでした");
  }

  return {
    id: String(event.id),
    title: event.title,
    catch: event.catch,
    description: plainTextFromHtml(event.description),
    date: started.date,
    start: started.time,
    end: ended.time,
    startedAt,
    endedAt,
    format: formatFromConnpass(event),
    area: areaFromAddress(event.address),
    venueName: event.place ?? "",
    address: event.address ?? "",
    tags: event.hash_tag ? [event.hash_tag] : [],
    imageUrl: event.image_url,
    accepted: event.accepted,
    limit: event.limit,
    url: event.url,
  };
}
