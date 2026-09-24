import { parseDateKey } from "@/lib/dates";
import type { Filters, FormatFilter } from "@/lib/types";

export type SearchParamRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
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
  const areaValue = read("area")?.trim();
  const keyword = read("keyword")?.trim() ?? "";

  return {
    date,
    area: areaValue ? areaValue : null,
    format: parseFormat(read("format")),
    keyword,
  };
}

export function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  params.set("date", filters.date);

  if (filters.area) params.set("area", filters.area);
  if (filters.format !== "all") params.set("format", filters.format);

  const keyword = filters.keyword.trim();
  if (keyword) params.set("keyword", keyword);

  return params.toString();
}

export function filtersHref(filters: Filters): string {
  return `/?${buildQuery(filters)}`;
}
