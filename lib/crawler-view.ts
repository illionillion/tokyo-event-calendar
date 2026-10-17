import { addDays, formatDayHeading } from "@/lib/dates";
import { matchesArea, matchesFormat, splitKeywordTerms } from "@/lib/filters";
import type { EventSummary, Filters } from "@/lib/types";
import { formatWeekRange, weekDates } from "@/lib/week";

export type CrawlerDay = { date: string; heading: string; events: EventSummary[] };

export type CrawlerView = {
  heading: string;
  days: CrawlerDay[];
  /** データの最初の日より前、最後の日より後には出さない。範囲内の空の日は通る。 */
  previous: string | null;
  next: string | null;
};

function normalize(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

/** 軽い一覧には説明文が無いので、タイトル・会場・エリアからキーワードを探す。 */
function matchesSummaryKeyword(event: EventSummary, keyword: string): boolean {
  const terms = splitKeywordTerms(normalize(keyword));
  if (terms.length === 0) return true;
  const haystack = normalize([event.title, event.venueName, event.area].join("\n"));
  return terms.every((term) => haystack.includes(term));
}

/** クローラー向けページに出す日とイベント。月表示は選んだ日、週表示はその週の 7 日。 */
export function buildCrawlerView(
  summaries: readonly EventSummary[],
  filters: Filters
): CrawlerView {
  const isWeek = filters.view === "week";
  const dates = isWeek ? weekDates(filters.date) : [filters.date];
  const days = dates.map((date) => ({
    date,
    heading: formatDayHeading(date),
    events: summaries
      .filter(
        (event) =>
          event.date === date &&
          matchesArea(event, filters.areas) &&
          matchesFormat(event, filters.format) &&
          matchesSummaryKeyword(event, filters.keyword)
      )
      .sort(
        (left, right) => left.start.localeCompare(right.start) || left.id.localeCompare(right.id)
      ),
  }));
  const step = isWeek ? 7 : 1;
  const bound = coverageBound(summaries);

  return {
    heading: isWeek ? formatWeekRange(dates) : formatDayHeading(filters.date),
    days,
    previous: linkWithin(addDays(filters.date, -step), bound),
    next: linkWithin(addDays(filters.date, step), bound),
  };
}

/** イベントがある最初の日から最後の日まで。その間の空の日も含む。 */
function coverageBound(summaries: readonly EventSummary[]): { first: string; last: string } | null {
  let first: string | undefined;
  let last: string | undefined;
  for (const event of summaries) {
    if (!first || event.date < first) first = event.date;
    if (!last || event.date > last) last = event.date;
  }
  return first && last ? { first, last } : null;
}

function linkWithin(date: string, bound: { first: string; last: string } | null): string | null {
  if (!bound || date < bound.first || date > bound.last) return null;
  return date;
}
