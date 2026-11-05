import { addDays, formatDayHeading } from "@/lib/dates";
import { matchesArea, matchesFormat, splitKeywordTerms } from "@/lib/filters";
import type { EventSummary, Filters } from "@/lib/types";
import { formatWeekRange, weekDates } from "@/lib/week";

export type CrawlerDay = { date: string; heading: string; events: EventSummary[] };

export type CrawlerView = {
  heading: string;
  days: CrawlerDay[];
  /**
   * 月はデータの最初の日より前、最後の日より後には出さない。範囲内の空の日は通る。
   * 週は隣の週がデータの範囲と重なるときだけ出し、リンク先はその重なりに収める。
   */
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
  const bound = coverageBound(summaries);

  return {
    heading: isWeek ? formatWeekRange(dates) : formatDayHeading(filters.date),
    days,
    previous: stepLink(filters.date, isWeek ? -7 : -1, bound, isWeek),
    next: stepLink(filters.date, isWeek ? 7 : 1, bound, isWeek),
  };
}

/**
 * 範囲の外にいるときは、近づく方向だけ一番近い端へリンクする。遠ざかる方向は出さない。
 * 週は隣の週が範囲と重なればそこへ寄せる。いまの週がすでに重なっているときは、
 * 隣が重ならなくても端へは飛ばない（同じ週へのリンクになるため）。
 */
function stepLink(
  anchor: string,
  step: number,
  bound: { first: string; last: string } | null,
  isWeek: boolean
): string | null {
  if (!bound) return null;
  const towardFuture = step > 0;
  const target = addDays(anchor, step);

  if (!isWeek) {
    if (towardFuture) {
      if (anchor >= bound.last) return null;
      if (target < bound.first) return bound.first;
      if (target > bound.last) return bound.last;
      return target;
    }
    if (anchor <= bound.first) return null;
    if (target > bound.last) return bound.last;
    if (target < bound.first) return bound.first;
    return target;
  }

  const adjacent = clampToWeekOverlap(target, bound);
  if (adjacent) return adjacent;
  if (clampToWeekOverlap(anchor, bound)) return null;
  if (towardFuture) {
    if (anchor >= bound.first) return null;
    return clampToWeekOverlap(bound.first, bound);
  }
  if (anchor <= bound.last) return null;
  return clampToWeekOverlap(bound.last, bound);
}

/** その日の週とデータの範囲が重なるなら、リンク先を重なりの中に収める。 */
function clampToWeekOverlap(date: string, bound: { first: string; last: string }): string | null {
  const week = weekDates(date);
  const weekFirst = week[0] ?? date;
  const weekLast = week.at(-1) ?? date;
  const overlapStart = weekFirst > bound.first ? weekFirst : bound.first;
  const overlapEnd = weekLast < bound.last ? weekLast : bound.last;
  if (overlapStart > overlapEnd) return null;
  if (date < overlapStart) return overlapStart;
  if (date > overlapEnd) return overlapEnd;
  return date;
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
