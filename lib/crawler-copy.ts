import { formatLabel } from "@/lib/filters";
import { filtersHref } from "@/lib/query";
import { siteDescription, siteTitle } from "@/lib/site-metadata";
import type { Filters } from "@/lib/types";

/** 見出しの直後に置く絞り込み。空なら空文字、あれば「港区・「LT」の」のように末尾は「の」。 */
export function describeFilters(filters: Filters): string {
  const parts = [
    filters.areas.length > 0 ? filters.areas.join("・") : null,
    filters.format !== "all" ? formatLabel(filters.format) : null,
    filters.keyword ? `「${filters.keyword}」` : null,
  ].filter(Boolean);
  return parts.length > 0 ? `${parts.join("・")}の` : "";
}

/** 「10月19日（月）のイベント」「2026年10月18日〜24日の港区・「LT」のイベント」。 */
export function crawlerSubject(heading: string, filters: Filters): string {
  return `${heading}の${describeFilters(filters)}イベント`;
}

/**
 * クローラー向けページの title / description / canonical。
 * 画面の見出しと同じ主題に、日付・週・エリア・キーワードを含める。
 */
export function crawlerPageMeta(
  heading: string,
  filters: Filters
): { title: string; description: string; url: string } {
  const subject = crawlerSubject(heading, filters);
  return {
    title: `${subject} | ${siteTitle}`,
    description: `${subject}。${siteDescription}`,
    url: filtersHref(filters),
  };
}
