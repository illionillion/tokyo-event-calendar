import { TOKYO_CITIES, TOKYO_WARDS } from "@/lib/areas";
import type { ConnpassEvent, Event, EventFormat } from "@/lib/types";

const AREAS = [...TOKYO_WARDS, ...TOKYO_CITIES].sort((left, right) => right.length - left.length);

const EVENT_TYPES = new Set<ConnpassEvent["event_type"]>(["participation", "advertisement"]);
const OPEN_STATUSES = new Set<ConnpassEvent["open_status"]>([
  "preopen",
  "open",
  "close",
  "cancelled",
]);

export function areaFromAddress(address: string | null): string {
  if (!address) return "";
  return AREAS.find((name) => address.includes(name)) ?? "";
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

function assertConnpassEvent(event: ConnpassEvent): void {
  if (!Number.isInteger(event.id) || !event.title || !event.url || !event.owner_nickname) {
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

export function toCalendarEvent(event: ConnpassEvent, dayDelta = 0): Event | null {
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
    description: event.description,
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
