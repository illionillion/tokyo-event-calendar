import { parseDateKey } from "@/lib/dates";
import type { Filters, FormatFilter } from "@/lib/types";

export type SearchParamRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function allValues(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/**
 * エリアは `area` を選んだ数だけ繰り返す（`?area=北区&area=港区`）。
 * 1 つだけの `?area=渋谷区`（以前の形式）もそのまま読める。空の値と重複は捨てる。
 */
function parseAreas(values: string[]): string[] {
  const areas: string[] = [];
  for (const value of values) {
    const area = value.trim();
    if (area && !areas.includes(area)) areas.push(area);
  }
  return areas;
}

function parseFormat(value: string | undefined): FormatFilter {
  if (value === "online" || value === "offline") return value;
  return "all";
}

export function parseFilters(params: URLSearchParams | SearchParamRecord, today: string): Filters {
  const read = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    return firstValue(params[key]);
  };

  const dateValue = read("date");
  const date = dateValue && parseDateKey(dateValue) ? dateValue : today;
  const areaValues =
    params instanceof URLSearchParams ? params.getAll("area") : allValues(params.area);
  const keyword = read("keyword")?.trim() ?? "";

  return {
    date,
    areas: parseAreas(areaValues),
    format: parseFormat(read("format")),
    keyword,
  };
}

export function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  params.set("date", filters.date);

  for (const area of filters.areas) params.append("area", area);
  if (filters.format !== "all") params.set("format", filters.format);

  const keyword = filters.keyword.trim();
  if (keyword) params.set("keyword", keyword);

  return params.toString();
}

export function filtersHref(filters: Filters): string {
  return `/?${buildQuery(filters)}`;
}

/**
 * 絞り込みの URL を History API で更新する。
 * Next.js は pushState / replaceState を useSearchParams に同期し、RSC は取り直さない。
 */
export function syncFilterUrl(filters: Filters, mode: "push" | "replace"): void {
  const url = filtersHref(filters);
  if (mode === "replace") {
    window.history.replaceState(null, "", url);
    return;
  }
  window.history.pushState(null, "", url);
}
