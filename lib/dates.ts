const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_KEY = /^(\d{2}):(\d{2})$/;

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseDateKey(value: string): DateParts | null {
  const match = DATE_KEY.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatDateParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string): number {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  if (!start || !end) {
    throw new Error(`不正な日付です: ${from}`);
  }

  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

export function addDays(dateKey: string, amount: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) {
    throw new Error(`不正な日付です: ${dateKey}`);
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return formatDateParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function dateInMonth(dateKey: string, month: string): string {
  const parts = parseDateKey(dateKey);
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!parts || !year || monthNumber < 1 || monthNumber > 12) {
    throw new Error(`不正な日付です: ${dateKey}`);
  }

  const day = Math.min(parts.day, daysInMonth(year, monthNumber));
  return formatDateParts(year, monthNumber, day);
}

export function shiftMonth(dateKey: string, amount: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) {
    throw new Error(`不正な日付です: ${dateKey}`);
  }

  const shifted = new Date(Date.UTC(parts.year, parts.month - 1 + amount, 1));
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));
  return formatDateParts(year, month, day);
}

export function weekdayIndex(dateKey: string): number {
  const parts = parseDateKey(dateKey);
  if (!parts) {
    throw new Error(`不正な日付です: ${dateKey}`);
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function weekdayLabel(dateKey: string): string {
  return WEEKDAYS[weekdayIndex(dateKey)] ?? "";
}

export function dayNumber(dateKey: string): number {
  return parseDateKey(dateKey)?.day ?? 1;
}

export function monthValue(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function formatMonthLabel(dateKey: string): string {
  const parts = parseDateKey(dateKey);
  if (!parts) return dateKey;
  return `${parts.year}年${parts.month}月`;
}

export function formatDayHeading(dateKey: string): string {
  const parts = parseDateKey(dateKey);
  if (!parts) return dateKey;
  return `${parts.month}月${parts.day}日（${weekdayLabel(dateKey)}）`;
}

export function dateWindow(center: string, radius = 3): string[] {
  return Array.from({ length: radius * 2 + 1 }, (_, index) => addDays(center, index - radius));
}

export function monthOptions(
  today: string,
  selected: string,
  span = 6
): Array<{
  value: string;
  label: string;
}> {
  const todayParts = parseDateKey(today);
  const anchor = todayParts ? formatDateParts(todayParts.year, todayParts.month, 1) : today;
  const options = new Map<string, string>();

  for (let offset = -span; offset <= span; offset += 1) {
    const date = shiftMonth(anchor, offset);
    options.set(monthValue(date), formatMonthLabel(date));
  }

  if (parseDateKey(selected) && !options.has(monthValue(selected))) {
    options.set(monthValue(selected), formatMonthLabel(selected));
  }

  return [...options.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, label]) => ({ value, label }));
}

export type CalendarCell = {
  date: string;
  inMonth: boolean;
};

export function monthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const start = new Date(Date.UTC(year, month - 1, 1 - firstWeekday));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const cellYear = date.getUTCFullYear();
    const cellMonth = date.getUTCMonth() + 1;
    const cellDay = date.getUTCDate();

    return {
      date: formatDateParts(cellYear, cellMonth, cellDay),
      inMonth: cellMonth === month,
    };
  });
}

export function isValidTime(value: string): boolean {
  const match = TIME_KEY.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function toTokyoIso(dateKey: string, time: string): string {
  return `${dateKey}T${time}:00+09:00`;
}

export function hasEnded(endedAt: string, nowIso: string): boolean {
  return Date.parse(endedAt) <= Date.parse(nowIso);
}
