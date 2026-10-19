import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { crawlerPageMeta, describeFilters } from "@/lib/crawler-copy";
import { loadSummaries } from "@/lib/crawler-data";
import { buildCrawlerView } from "@/lib/crawler-view";
import { todayKey } from "@/lib/dates";
import { filtersHref, parseFilters, type SearchParamRecord } from "@/lib/query";
import { requestMetadata, siteDescription } from "@/lib/site-metadata";
import type { EventFormat, Filters } from "@/lib/types";

/**
 * クローラー向けのページ。middleware.ts がクローラーの `/` をここへ書き換える（URL は `/` のまま）。
 * 全イベントの軽い一覧（静的ファイル）だけを読み、タイトル・日時・場所・リンクを HTML で返す。
 */
type PageProps = { searchParams: Promise<SearchParamRecord> };

const FORMAT_TEXT: Record<EventFormat, string> = {
  online: "オンライン",
  offline: "オフライン",
  hybrid: "オンライン併用",
};

async function readFilters(searchParams: Promise<SearchParamRecord>): Promise<Filters> {
  return parseFilters(await searchParams, todayKey());
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = await readFilters(searchParams);
  const view = buildCrawlerView([], filters);
  return requestMetadata(await headers(), crawlerPageMeta(view.heading, filters));
}

export default async function CrawlerPage({ searchParams }: PageProps) {
  const filters = await readFilters(searchParams);
  const view = buildCrawlerView(await loadSummaries(), filters);
  const total = view.days.reduce((sum, day) => sum + day.events.length, 0);

  return (
    <main id="events" className="mx-auto w-full max-w-[1080px] px-4 py-6">
      <h1 className="text-xl font-semibold">
        {view.heading}の{describeFilters(filters)}イベント（{total}件）
      </h1>
      <p className="mt-2 text-sm text-secondary">{siteDescription}</p>
      {view.previous || view.next ? (
        <nav aria-label="日付の移動" className="mt-4 flex gap-4 text-sm">
          {view.previous ? (
            <Link href={filtersHref({ ...filters, date: view.previous })}>
              {filters.view === "week" ? "前の週" : "前の日"}
            </Link>
          ) : null}
          {view.next ? (
            <Link href={filtersHref({ ...filters, date: view.next })}>
              {filters.view === "week" ? "次の週" : "次の日"}
            </Link>
          ) : null}
        </nav>
      ) : null}
      {view.days.map((day) => (
        <section key={day.date} aria-labelledby={`day-${day.date}`} className="mt-6">
          <h2 id={`day-${day.date}`} className="text-lg font-semibold">
            <Link href={filtersHref({ ...filters, date: day.date, view: "month" })}>
              {day.heading}
            </Link>
            <span className="ml-2 text-sm font-normal text-secondary">{day.events.length}件</span>
          </h2>
          {day.events.length === 0 ? (
            <p className="mt-2 text-sm text-secondary">この日のイベントはありません</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {day.events.map((event) => (
                <li key={event.id} className="rounded-lg border border-border bg-card p-3">
                  <a href={event.url} className="font-medium text-foreground underline">
                    {event.title}
                  </a>
                  <p className="mt-1 text-sm text-secondary">
                    <time dateTime={`${event.date}T${event.start}:00+09:00`}>
                      {event.date} {event.start}〜{event.end}
                    </time>
                    {" ・ "}
                    {event.area || "会場未定"}（{FORMAT_TEXT[event.format]}）
                    {event.venueName ? ` ・ ${event.venueName}` : ""}
                    {event.cancelled ? " ・ 中止" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
