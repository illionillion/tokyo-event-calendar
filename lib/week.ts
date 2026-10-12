import { addDays, formatDateParts, parseDateKey, weekdayIndex } from "@/lib/dates";
import type { Event } from "@/lib/types";

/**
 * 週表示（Google カレンダー風）の配置を決める。時刻はすべて日本時間（UTC+9、夏時間なし）で扱う。
 *
 * - 週は日曜始まり（ミニカレンダーと同じ）
 * - 24 時間以上のイベントは上段の「終日・複数日」の帯に出し、週の範囲で切り詰める
 * - 24 時間未満で日付をまたぐイベント（例: 20:00〜翌 6:00）は日ごとに分けて時間軸に出す
 * - 重なるイベントは横に並べる（重なりがつながっている間は同じ列数で割る）
 */

const MINUTE_MS = 60_000;
const DAY_MINUTES = 24 * 60;
const TOKYO_OFFSET_MS = 9 * 60 * MINUTE_MS;

/**
 * 時間軸のブロックの最低の高さ（分）。短いイベントでも時刻・エリア・タイトルの 3 行が読めるようにし、
 * 重なりの判定もこの長さで行う。
 */
export const MIN_BLOCK_MINUTES = 45;

/**
 * 1 日の列に横並びにする最大数。これを超える重なりは、最後の枠を「+N件」にまとめる
 * （細くしすぎるとタイトルが読めなくなるため。押すとその日の一覧を開く）。
 */
export const MAX_VISIBLE_COLUMNS = 2;

/** この長さ以上のイベントは終日・複数日の帯に出す。 */
export const ALL_DAY_MINUTES = DAY_MINUTES;

/** 既定でスクロールする時刻（時）。これより早いイベントがある週はそのイベントの時刻から見せる。 */
export const DEFAULT_SCROLL_HOUR = 8;

/** `date` を含む週の日曜〜土曜。 */
export function weekDates(date: string): string[] {
  const start = addDays(date, -weekdayIndex(date));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** 「2026年10月11日〜17日」。月や年をまたぐときは後ろにも月・年を付ける。 */
export function formatWeekRange(dates: string[]): string {
  const first = parseDateKey(dates[0] ?? "");
  const last = parseDateKey(dates.at(-1) ?? "");
  if (!first || !last) return "";
  const head = `${first.year}年${first.month}月${first.day}日`;
  if (first.year !== last.year) return `${head}〜${last.year}年${last.month}月${last.day}日`;
  if (first.month !== last.month) return `${head}〜${last.month}月${last.day}日`;
  return `${head}〜${last.day}日`;
}

/** 日本時間の日付と、その日の 0 時からの分。 */
function tokyoPosition(iso: string): { date: string; minutes: number } {
  const shifted = new Date(Date.parse(iso) + TOKYO_OFFSET_MS);
  return {
    date: formatDateParts(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth() + 1,
      shifted.getUTCDate()
    ),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function durationMinutes(event: Event): number {
  return Math.max(0, (Date.parse(event.endedAt) - Date.parse(event.startedAt)) / MINUTE_MS);
}

/** 終了日（日本時間）。ちょうど 0:00 に終わるイベントは前の日までとする。 */
export function lastDate(event: Event): string {
  if (durationMinutes(event) === 0) return tokyoPosition(event.startedAt).date;
  return tokyoPosition(new Date(Date.parse(event.endedAt) - MINUTE_MS).toISOString()).date;
}

/** `from`〜`to`（両端を含む）のどこかで開催しているか。 */
export function overlapsDates(event: Event, from: string, to: string): boolean {
  return event.date <= to && lastDate(event) >= from;
}

export function isAllDayEvent(event: Event): boolean {
  return durationMinutes(event) >= ALL_DAY_MINUTES;
}

export type TimedSegment = {
  event: Event;
  date: string;
  /** その日の 0 時からの分 */
  start: number;
  end: number;
  /** 前の日から続いている / 次の日に続く */
  continuesBefore: boolean;
  continuesAfter: boolean;
  column: number;
  columns: number;
  /** 重なりがつながっているまとまりの番号（その日の中で 0 から） */
  cluster: number;
};

/** 横並びに収まらなかったイベントのまとまり（「+N件」の枠）。 */
export type OverflowSlot = {
  date: string;
  start: number;
  end: number;
  count: number;
  column: number;
  columns: number;
};

export type AllDayBar = {
  event: Event;
  /** 週の中の列（0 = 日曜） */
  startIndex: number;
  endIndex: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type WeekLayout = {
  dates: string[];
  allDay: AllDayBar[];
  allDayLanes: number;
  timed: Map<string, TimedSegment[]>;
};

/** 24 時間未満のイベントを日ごとの区間に分ける。 */
type DaySegment = Omit<TimedSegment, "column" | "columns" | "cluster">;

export function splitByDay(event: Event): DaySegment[] {
  const start = tokyoPosition(event.startedAt);
  const length = durationMinutes(event);
  const segments: DaySegment[] = [];
  let date = start.date;
  let from = start.minutes;
  let remaining = length;

  do {
    const to = Math.min(DAY_MINUTES, from + remaining);
    segments.push({
      event,
      date,
      start: from,
      end: to,
      continuesBefore: segments.length > 0,
      continuesAfter: false,
    });
    remaining -= to - from;
    if (remaining > 0) {
      segments[segments.length - 1]!.continuesAfter = true;
      date = addDays(date, 1);
      from = 0;
    }
  } while (remaining > 0);

  return segments;
}

/**
 * 1 日分の区間に列を割り当てる。開始順に並べ、空いているいちばん左の列に入れる。
 * 重なりがつながっている区間のまとまりごとに、使った列の数を columns とする。
 */
export function assignColumns(
  segments: Array<Omit<TimedSegment, "column" | "columns" | "cluster">>
): TimedSegment[] {
  const sorted = [...segments].sort(
    (left, right) =>
      left.start - right.start ||
      right.end - left.end ||
      left.event.title.localeCompare(right.event.title, "ja")
  );
  const result: TimedSegment[] = [];
  let cluster: TimedSegment[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  let clusterIndex = 0;

  const flush = () => {
    if (cluster.length === 0) return;
    for (const segment of cluster) segment.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
    clusterEnd = -1;
    clusterIndex += 1;
  };

  for (const segment of sorted) {
    const visualEnd = Math.max(segment.end, segment.start + MIN_BLOCK_MINUTES);
    if (cluster.length > 0 && segment.start >= clusterEnd) flush();

    let column = columnEnds.findIndex((end) => end <= segment.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(visualEnd);
    } else {
      columnEnds[column] = visualEnd;
    }

    const placed: TimedSegment = { ...segment, column, columns: 1, cluster: clusterIndex };
    cluster.push(placed);
    result.push(placed);
    clusterEnd = Math.max(clusterEnd, visualEnd);
  }
  flush();

  return result;
}

/** 週の表示に出すイベント（絞り込み済み）から、帯と時間軸の配置を作る。 */
export function layoutWeek(events: Event[], dates: string[]): WeekLayout {
  const first = dates[0] ?? "";
  const last = dates.at(-1) ?? "";
  const allDayEvents: Event[] = [];
  const perDay = new Map<string, DaySegment[]>(dates.map((date) => [date, []]));

  for (const event of events) {
    if (!overlapsDates(event, first, last)) continue;
    if (isAllDayEvent(event)) {
      allDayEvents.push(event);
      continue;
    }
    for (const segment of splitByDay(event)) {
      perDay.get(segment.date)?.push(segment);
    }
  }

  const timed = new Map<string, TimedSegment[]>();
  for (const [date, segments] of perDay) timed.set(date, assignColumns(segments));

  const { bars, lanes } = layoutAllDay(allDayEvents, dates);
  return { dates, allDay: bars, allDayLanes: lanes, timed };
}

function layoutAllDay(events: Event[], dates: string[]): { bars: AllDayBar[]; lanes: number } {
  const first = dates[0] ?? "";
  const last = dates.at(-1) ?? "";
  const indexOf = (date: string) => dates.indexOf(date);
  const sorted = [...events].sort(
    (left, right) =>
      left.startedAt.localeCompare(right.startedAt) ||
      lastDate(right).localeCompare(lastDate(left)) ||
      left.title.localeCompare(right.title, "ja")
  );
  const laneEnds: number[] = [];
  const bars: AllDayBar[] = [];

  for (const event of sorted) {
    const end = lastDate(event);
    const startIndex = event.date < first ? 0 : indexOf(event.date);
    const endIndex = end > last ? dates.length - 1 : indexOf(end);
    let lane = laneEnds.findIndex((laneEnd) => laneEnd < startIndex);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endIndex);
    } else {
      laneEnds[lane] = endIndex;
    }
    bars.push({
      event,
      startIndex,
      endIndex,
      lane,
      continuesBefore: event.date < first,
      continuesAfter: end > last,
    });
  }

  return { bars, lanes: laneEnds.length };
}

/**
 * 横並びを max 列までに抑える。max 列を超えるまとまりは、左から max - 1 列のイベントを出し、
 * 残りを最後の枠の「+N件」にまとめる。返すイベントの columns は表示する列数に直す。
 */
export function limitColumns(
  segments: TimedSegment[],
  max = MAX_VISIBLE_COLUMNS
): { visible: TimedSegment[]; overflow: OverflowSlot[] } {
  const visible: TimedSegment[] = [];
  const hidden = new Map<number, TimedSegment[]>();

  for (const segment of segments) {
    if (segment.columns <= max) {
      visible.push(segment);
    } else if (segment.column < max - 1) {
      visible.push({ ...segment, columns: max });
    } else {
      hidden.set(segment.cluster, [...(hidden.get(segment.cluster) ?? []), segment]);
    }
  }

  const overflow = [...hidden.values()].map((group) => ({
    date: group[0]!.date,
    start: Math.min(...group.map((segment) => segment.start)),
    end: Math.max(
      ...group.map((segment) => Math.max(segment.end, segment.start + MIN_BLOCK_MINUTES))
    ),
    count: group.length,
    column: max - 1,
    columns: max,
  }));

  return { visible, overflow };
}

/** その日に出すイベントの数（終日・複数日の帯と時間軸の区間）。 */
export function countOnDate(layout: WeekLayout, date: string): number {
  const index = layout.dates.indexOf(date);
  const allDay = layout.allDay.filter(
    (bar) => index >= bar.startIndex && index <= bar.endIndex
  ).length;
  return allDay + (layout.timed.get(date)?.length ?? 0);
}

/** 最初に見せる時刻（時）。既定は 8 時で、それより早いイベントがあればその時刻にする。 */
export function initialScrollHour(layout: WeekLayout): number {
  let hour = DEFAULT_SCROLL_HOUR;
  for (const segments of layout.timed.values()) {
    for (const segment of segments) hour = Math.min(hour, Math.floor(segment.start / 60));
  }
  return hour;
}

/** 日本時間の今の、その日の 0 時からの分。 */
export function minutesOfDay(iso: string): number {
  return tokyoPosition(iso).minutes;
}
