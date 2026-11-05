import { addDays, parseDateKey, weekdayIndex } from "@/lib/dates";
import { compareEvents, formatPlace, matchesKeyword } from "@/lib/filters";
import type { Event } from "@/lib/types";
import { weekDates } from "@/lib/week";

/**
 * 1 本の動画に載せる上限。10 件 × 2 秒 + オープニング + エンディングで 30 秒以内。
 * 8〜12 の範囲で、尺の上限に収まる値。
 */
export const PROMO_EVENT_CAP = 10;

export const PROMO_FPS = 30;
export const PROMO_OPENING_FRAMES = 54;
export const PROMO_CARD_FRAMES = 60;
export const PROMO_EMPTY_FRAMES = 70;
export const PROMO_ENDING_FRAMES = 90;

export const PROMO_VARIANTS = [
  {
    id: "lt",
    keyword: "LT",
    headline: "LT",
    outputs: [
      { orientation: "vertical", compositionId: "WeeklyLt", fileName: "week-lt.mp4" },
      {
        orientation: "landscape",
        compositionId: "WeeklyLtLandscape",
        fileName: "week-lt-landscape.mp4",
      },
    ],
  },
  {
    id: "mokumoku",
    keyword: "もくもく",
    headline: "もくもく",
    outputs: [
      {
        orientation: "vertical",
        compositionId: "WeeklyMokumoku",
        fileName: "week-mokumoku.mp4",
      },
      {
        orientation: "landscape",
        compositionId: "WeeklyMokumokuLandscape",
        fileName: "week-mokumoku-landscape.mp4",
      },
    ],
  },
] as const;

export type PromoVariant = (typeof PROMO_VARIANTS)[number];
export type PromoVariantId = PromoVariant["id"];

export function promoVariant(id: string): PromoVariant | undefined {
  return PROMO_VARIANTS.find((variant) => variant.id === id);
}

/**
 * 土曜の週次投稿が「来週」と呼ぶ週。サイトのミニカレンダーと同じ日曜〜土曜。
 * 基準日が土曜なら翌日の日曜から、それ以外はその次の土曜の翌日の日曜から。
 * 2026-10-24（土）→ 2026-10-25〜10-31。
 */
export function saturdayPostWeek(today: string): string[] {
  if (!parseDateKey(today)) {
    throw new Error(`不正な日付です: ${today}`);
  }

  const daysUntilSaturday = (6 - weekdayIndex(today) + 7) % 7;
  return weekDates(addDays(today, daysUntilSaturday + 1));
}

export function promoDurationInFrames(cardCount: number): number {
  const middle = cardCount === 0 ? PROMO_EMPTY_FRAMES : cardCount * PROMO_CARD_FRAMES;
  return PROMO_OPENING_FRAMES + middle + PROMO_ENDING_FRAMES;
}

/** 秒。フレーム数を fps で割った値で、上限チェックに使う。 */
export function promoDurationSeconds(cardCount: number): number {
  return promoDurationInFrames(cardCount) / PROMO_FPS;
}

/**
 * サイトの週表示（`keyword=`）と同じ `matchesKeyword` で週内のイベントを選ぶ。
 * 中止も含む。日付、同じ日の中では開始時刻、その次はタイトル順。
 */
export function selectPromoEvents(
  events: readonly Event[],
  week: readonly string[],
  keyword: string
): Event[] {
  const days = new Set(week);
  return events
    .filter((event) => days.has(event.date) && matchesKeyword(event, keyword))
    .sort(compareEvents);
}

export function takePromoEvents(
  events: readonly Event[],
  week: readonly string[],
  keyword: string
): { matched: Event[]; shown: Event[] } {
  const matched = selectPromoEvents(events, week, keyword);
  return { matched, shown: matched.slice(0, PROMO_EVENT_CAP) };
}

/** カードの場所。オンライン以外は区・県のうしろに会場名を足す。 */
export function promoPlaceLabel(event: Event): string {
  const base = formatPlace(event);
  const venue = event.venueName.trim();
  if (!venue || event.format === "online") return base;
  return `${base} · ${venue}`;
}

export function promoTimeLabel(event: Event): string {
  if (event.end && event.end !== event.start) return `${event.start}–${event.end}`;
  return event.start;
}
