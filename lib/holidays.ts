import { addDays, formatDateParts, parseDateKey, weekdayIndex } from "@/lib/dates";

/**
 * 日本の祝日（「国民の祝日に関する法律」）を外部 API なしで求める。
 * 振替休日と国民の休日も含める。Workers / ブラウザのどちらでも動くよう、日付は文字列（YYYY-MM-DD）だけで扱う。
 *
 * 対象は現行の祝日がそろった 2020 年から、春分・秋分の近似式が使える 2099 年まで。範囲外の年は祝日なしとして扱う。
 * 春分・秋分は国立天文台の暦要項で前年に確定するため、近似式の結果と異なる年が出たら更新する。
 */
export const HOLIDAY_YEAR_RANGE = { from: 2020, to: 2099 } as const;

export type DayKind = "holiday" | "sunday" | "saturday" | "weekday";

/** 月の第 n 月曜日。 */
function nthMonday(year: number, month: number, nth: number): number {
  const first = weekdayIndex(formatDateParts(year, month, 1));
  const firstMonday = 1 + ((8 - first) % 7);
  return firstMonday + (nth - 1) * 7;
}

function equinoxDay(year: number, base: number): number {
  return Math.floor(base + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

/** 法律で日付が決まる「国民の祝日」（振替休日・国民の休日は含まない）。 */
function nationalHolidays(year: number): Map<string, string> {
  const days = new Map<string, string>();
  const add = (month: number, day: number, name: string) =>
    days.set(formatDateParts(year, month, day), name);

  add(1, 1, "元日");
  add(1, nthMonday(year, 1, 2), "成人の日");
  add(2, 11, "建国記念の日");
  add(2, 23, "天皇誕生日");
  add(3, equinoxDay(year, 20.8431), "春分の日");
  add(4, 29, "昭和の日");
  add(5, 3, "憲法記念日");
  add(5, 4, "みどりの日");
  add(5, 5, "こどもの日");
  add(9, nthMonday(year, 9, 3), "敬老の日");
  add(9, equinoxDay(year, 23.2488), "秋分の日");
  add(11, 3, "文化の日");
  add(11, 23, "勤労感謝の日");

  // 東京オリンピック・パラリンピック特措法で 2020・2021 年だけ移動した祝日。
  if (year === 2020) {
    add(7, 23, "海の日");
    add(7, 24, "スポーツの日");
    add(8, 10, "山の日");
  } else if (year === 2021) {
    add(7, 22, "海の日");
    add(7, 23, "スポーツの日");
    add(8, 8, "山の日");
  } else {
    add(7, nthMonday(year, 7, 3), "海の日");
    add(8, 11, "山の日");
    add(10, nthMonday(year, 10, 2), "スポーツの日");
  }

  return days;
}

function buildYear(year: number): Map<string, string> {
  const national = nationalHolidays(year);
  const holidays = new Map(national);

  // 振替休日: 祝日が日曜なら、その後のいちばん近い祝日でない日を休日にする。
  for (const date of [...national.keys()].sort()) {
    if (weekdayIndex(date) !== 0) continue;
    let next = addDays(date, 1);
    while (holidays.has(next)) next = addDays(next, 1);
    holidays.set(next, "振替休日");
  }

  // 国民の休日: 前日と翌日が国民の祝日で、その日自体は祝日でない日。
  for (const date of national.keys()) {
    const between = addDays(date, 1);
    if (!holidays.has(between) && national.has(addDays(date, 2))) {
      holidays.set(between, "国民の休日");
    }
  }

  return holidays;
}

const cache = new Map<number, Map<string, string>>();

function holidaysOf(year: number): Map<string, string> {
  let holidays = cache.get(year);
  if (!holidays) {
    const inRange = year >= HOLIDAY_YEAR_RANGE.from && year <= HOLIDAY_YEAR_RANGE.to;
    holidays = inRange ? buildYear(year) : new Map();
    cache.set(year, holidays);
  }
  return holidays;
}

/** 祝日（振替休日・国民の休日を含む）なら名前を、そうでなければ null を返す。 */
export function holidayName(dateKey: string): string | null {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  return holidaysOf(parts.year).get(dateKey) ?? null;
}

/** 色分け用の日の種類。祝日は曜日より優先する（土曜の祝日は holiday）。 */
export function dayKind(dateKey: string): DayKind {
  if (holidayName(dateKey)) return "holiday";
  const weekday = weekdayIndex(dateKey);
  if (weekday === 0) return "sunday";
  if (weekday === 6) return "saturday";
  return "weekday";
}

/** 日の種類に対応する文字色のクラス。平日は空文字。 */
export function dayKindTextClass(kind: DayKind): string {
  if (kind === "saturday") return "text-saturday";
  if (kind === "weekday") return "";
  return "text-holiday";
}
