import { addDays, parseDateKey, weekdayIndex } from "@/lib/dates";

/** `date` を含む週の日曜〜土曜（ミニカレンダーと同じ日曜始まり）。 */
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
