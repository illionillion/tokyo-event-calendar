import type { Event, Filters, FormatFilter } from "@/lib/types";

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

export function splitKeywordTerms(keyword: string): string[] {
  return keyword
    .trim()
    .split(/[\s,、]+/)
    .filter(Boolean);
}

export function matchesArea(event: Event, area: string | null): boolean {
  if (!area) return true;
  return event.area === area;
}

export function matchesFormat(event: Event, format: FormatFilter): boolean {
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
  return Boolean(filters.area || filters.format !== "all" || filters.keyword.trim());
}

function compareEvents(left: Event, right: Event): number {
  const byTime = left.startedAt.localeCompare(right.startedAt);
  if (byTime !== 0) return byTime;
  return left.title.localeCompare(right.title, "ja");
}

export function filterEvents(events: Event[], filters: Filters): Event[] {
  return events
    .filter((event) => event.date === filters.date)
    .filter((event) => matchesArea(event, filters.area))
    .filter((event) => matchesFormat(event, filters.format))
    .filter((event) => matchesKeyword(event, filters.keyword))
    .sort(compareEvents);
}

export function countByArea(events: Event[], filters: Filters): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (event.date !== filters.date || !event.area) continue;
    if (!matchesFormat(event, filters.format) || !matchesKeyword(event, filters.keyword)) continue;
    counts.set(event.area, (counts.get(event.area) ?? 0) + 1);
  }

  return counts;
}

export function matchingDates(events: Event[], filters: Filters): Set<string> {
  const dates = new Set<string>();

  for (const event of events) {
    if (!matchesArea(event, filters.area)) continue;
    if (!matchesFormat(event, filters.format)) continue;
    if (!matchesKeyword(event, filters.keyword)) continue;
    dates.add(event.date);
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
