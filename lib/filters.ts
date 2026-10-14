import type { Event, Filters, FormatFilter } from "@/lib/types";

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

export function splitKeywordTerms(keyword: string): string[] {
  return keyword
    .split(/[,、]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

/** プレースホルダとチップ解除後のテキストで共通の区切り。 */
export const keywordTermSeparator = ", ";

export function joinKeywordTerms(terms: string[]): string {
  return terms.join(keywordTermSeparator);
}

export const keywordPlaceholder = joinKeywordTerms(["React", "LT", "渋谷"]);

/** エリアを 1 つも選んでいなければすべて、選んでいればいずれかに当たるか（OR）。 */
export function matchesArea(event: Pick<Event, "area">, areas: readonly string[]): boolean {
  if (areas.length === 0) return true;
  return areas.includes(event.area);
}

/** 選択中なら外し、未選択なら末尾に足す。 */
export function toggleArea(areas: readonly string[], area: string): string[] {
  if (areas.includes(area)) return areas.filter((name) => name !== area);
  return [...areas, area];
}

export function matchesFormat(event: Pick<Event, "format">, format: FormatFilter): boolean {
  if (format === "all") return true;
  if (format === "online") return event.format === "online" || event.format === "hybrid";
  return event.format === "offline" || event.format === "hybrid";
}

export function matchesKeyword(event: Event, keyword: string): boolean {
  const terms = splitKeywordTerms(normalize(keyword));
  if (terms.length === 0) return true;

  const haystack = normalize(
    [
      event.title,
      event.catch,
      event.description,
      event.address,
      event.venueName,
      event.area,
      ...event.tags,
    ]
      .filter((value) => value)
      .join("\n")
  );

  return terms.every((term) => haystack.includes(term));
}

export function hasActiveFilters(filters: Filters): boolean {
  return Boolean(filters.areas.length > 0 || filters.format !== "all" || filters.keyword.trim());
}

export function compareEvents(left: Event, right: Event): number {
  const byTime = left.startedAt.localeCompare(right.startedAt);
  if (byTime !== 0) return byTime;
  return left.title.localeCompare(right.title, "ja");
}

export function filterEvents(events: Event[], filters: Filters): Event[] {
  return events
    .filter((event) => event.date === filters.date)
    .filter((event) => matchesArea(event, filters.areas))
    .filter((event) => matchesFormat(event, filters.format))
    .filter((event) => matchesKeyword(event, filters.keyword))
    .sort(compareEvents);
}

/** 日付以外の条件（エリア・開催形態・キーワード）に当たるか。 */
export function matchesConditions(event: Event, filters: Filters): boolean {
  return (
    matchesArea(event, filters.areas) &&
    matchesFormat(event, filters.format) &&
    matchesKeyword(event, filters.keyword)
  );
}

/**
 * エリアごとの件数。エリア以外の条件で数える。
 * inScope で数える日付の範囲を変えられる（既定は選択中の日に始まるイベント、週表示では週のうちに始まるイベント）。
 */
export function countByArea(
  events: Event[],
  filters: Filters,
  inScope: (event: Event) => boolean = (event) => event.date === filters.date
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!inScope(event) || !event.area) continue;
    if (!matchesFormat(event, filters.format) || !matchesKeyword(event, filters.keyword)) continue;
    counts.set(event.area, (counts.get(event.area) ?? 0) + 1);
  }

  return counts;
}

export function matchingDates(events: Event[], filters: Filters): Set<string> {
  const dates = new Set<string>();

  for (const event of events) {
    if (!matchesArea(event, filters.areas)) continue;
    if (!matchesFormat(event, filters.format)) continue;
    if (!matchesKeyword(event, filters.keyword)) continue;
    dates.add(event.date);
  }

  return dates;
}

/**
 * キーワードが無いときの、イベントのある日。軽い一覧（エリアと開催形態）だけで決まるので、
 * まだ取っていない日のぶんも印を付けられる。
 */
export function matchingSummaryDates(
  summaries: readonly Pick<Event, "date" | "area" | "format">[],
  filters: Filters
): Set<string> {
  const dates = new Set<string>();
  for (const summary of summaries) {
    if (matchesArea(summary, filters.areas) && matchesFormat(summary, filters.format)) {
      dates.add(summary.date);
    }
  }
  return dates;
}

export function formatPlace(event: Event): string {
  if (event.format === "online") return "オンライン";
  if (event.format === "hybrid") {
    return event.area ? `${event.area}（オンライン併用）` : "オンライン併用";
  }
  return event.area || "会場未定";
}

export function formatCapacity(accepted: number, limit: number | null): string {
  if (limit === null) return `${accepted}人`;
  return `${accepted} / ${limit}人`;
}

export function formatLabel(format: FormatFilter): string {
  if (format === "online") return "オンライン";
  if (format === "offline") return "オフライン";
  return "すべて";
}
