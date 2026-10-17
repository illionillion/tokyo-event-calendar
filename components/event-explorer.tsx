"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CollapsibleCalendar } from "@/components/collapsible-calendar";
import { DateNavigation } from "@/components/date-navigation";
import { EventList } from "@/components/event-list";
import { FiltersPanel } from "@/components/filters-panel";
import { ViewToggle, WeekNavigation, WeekView } from "@/components/week-view";
import { groupAreas } from "@/lib/areas";
import { monthGrid, monthValue, parseDateKey, todayKey } from "@/lib/dates";
import {
  compareEvents,
  countByArea,
  filterEvents,
  matchesConditions,
  matchingDates,
  matchingSummaryDates,
} from "@/lib/filters";
import { parseFilters, syncFilterUrl } from "@/lib/query";
import type { Event, EventSummary, Filters } from "@/lib/types";
import { useEventData } from "@/lib/use-event-data";
import { formatWeekRange, weekDates } from "@/lib/week";

const NO_SUMMARIES: EventSummary[] = [];

type EventExplorerProps = {
  /**
   * 渡したときはこのイベントだけを使い、データを取りにいかない（テスト用）。
   * 省略すると、表示に要る日のイベントを静的ファイル（public/data/events/）から読む。
   */
  events?: Event[];
  today: string;
  now: string;
};

export function EventExplorer({
  events: givenEvents,
  today: serverToday,
  now: serverNow,
}: EventExplorerProps) {
  const searchParams = useSearchParams();
  const [keywordResetKey, setKeywordResetKey] = useState(0);
  // History API の遷移ではサーバーの now / today が更新されないため、操作や戻る・進むのたびに手元で取り直す。
  const [clientNow, setClientNow] = useState<string | null>(null);
  const now = clientNow !== null && clientNow > serverNow ? clientNow : serverNow;
  const clientToday = clientNow === null ? null : todayKey(new Date(now));
  const today = clientToday !== null && clientToday > serverToday ? clientToday : serverToday;

  useEffect(() => {
    const refreshNow = () => setClientNow(new Date().toISOString());
    window.addEventListener("popstate", refreshNow);
    return () => window.removeEventListener("popstate", refreshNow);
  }, []);
  const filters = useMemo(() => parseFilters(searchParams, today), [searchParams, today]);
  const isWeek = filters.view === "week";
  const week = useMemo(() => weekDates(filters.date), [filters.date]);
  const weekFirst = week[0] ?? filters.date;
  const weekLast = week.at(-1) ?? filters.date;
  // ミニカレンダーに出ている月。キーワードで絞るときは、その月の印を付けるために全項目のデータを読む。
  const [calendarMonth, setCalendarMonth] = useState(() => monthValue(filters.date));
  const keywordActive = filters.keyword.trim() !== "";
  const requiredDates = useMemo(
    () => (isWeek ? week : [filters.date]),
    [isWeek, week, filters.date]
  );
  const calendarDates = useMemo(() => {
    if (!keywordActive) return [];
    const [year, month] = calendarMonth.split("-").map(Number);
    return monthGrid(year ?? 0, month ?? 0).map((cell) => cell.date);
  }, [keywordActive, calendarMonth]);
  const data = useEventData(givenEvents === undefined, requiredDates, calendarDates);
  const events = givenEvents ?? data.events;
  const summaries = givenEvents ?? data.summaries ?? NO_SUMMARIES;
  const ready = givenEvents !== undefined || data.ready;
  const visible = useMemo(() => filterEvents(events, filters), [events, filters]);
  // 週表示は日の一覧と同じく開始日で数える（複数日のイベントは開始日にだけ出す）
  const inWeek = useCallback(
    (event: Event) => event.date >= weekFirst && event.date <= weekLast,
    [weekFirst, weekLast]
  );
  const weekEvents = useMemo(
    () =>
      // 日の一覧と同じ並び（開始時刻 → タイトル）
      events
        .filter((event) => inWeek(event) && matchesConditions(event, filters))
        .sort(compareEvents),
    [events, filters, inWeek]
  );
  // 週表示ではエリアの件数も週のイベントで数える
  const counts = useMemo(() => {
    if (!isWeek) return countByArea(events, filters);
    return countByArea(events, filters, inWeek);
  }, [events, filters, isWeek, inWeek]);
  // キーワードが無ければ軽い一覧で全期間の印を付ける。キーワードがあれば読み込んだ日の全項目で探す。
  const markedDates = useMemo(
    () =>
      keywordActive ? matchingDates(events, filters) : matchingSummaryDates(summaries, filters),
    [keywordActive, events, summaries, filters]
  );
  const groups = useMemo(() => groupAreas(summaries, filters.areas), [summaries, filters.areas]);

  function navigate(next: Filters, mode: "push" | "replace") {
    setClientNow(new Date().toISOString());
    syncFilterUrl(next, mode);
  }

  function update(partial: Partial<Filters>, mode: "push" | "replace" = "push") {
    navigate({ ...filters, ...partial }, mode);
  }

  function clearFilters() {
    setKeywordResetKey((key) => key + 1);
    update({ areas: [], format: "all", keyword: "" });
  }

  // 上に固定される帯（サイトヘッダー + 日付バー）の下端を CSS 変数にし、週表示の枠の高さに使う
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const bar = barRef.current;
    if (!root || !bar || typeof ResizeObserver === "undefined") return;
    const sync = () => root.style.setProperty("--page-bar-bottom", `${48 + bar.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const selected = parseDateKey(filters.date);
  const selectedLabel = selected ? `${selected.month}月${selected.day}日` : filters.date;

  return (
    <div ref={rootRef} className="mx-auto w-full min-w-0 max-w-[1080px] px-4 py-4">
      {/* top-12 = サイトヘッダー h-12 */}
      <div ref={barRef} className="sticky top-12 z-10 -mx-4 min-w-0 bg-background px-4 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <ViewToggle
              view={filters.view}
              onChange={(view) => {
                if (view !== filters.view) update({ view });
              }}
            />
            {isWeek ? (
              <WeekNavigation
                dates={week}
                today={today}
                selectedDate={filters.date}
                onSelectDate={(date) => {
                  if (date !== filters.date) update({ date });
                }}
              />
            ) : (
              <DateNavigation
                selectedDate={filters.date}
                today={today}
                onSelectDate={(date) => {
                  if (date !== filters.date) update({ date });
                }}
              />
            )}
          </div>
          {/* 月・週で高さが変わらないよう、3 行分（日付・今日・件数）の高さを確保する */}
          <div className="hidden h-[54px] shrink-0 text-right lg:block" aria-hidden="true">
            <p className="text-lg leading-none font-semibold tabular-nums">
              {isWeek ? formatWeekRange(week) : selectedLabel}
            </p>
            {!isWeek && filters.date === today ? (
              <p className="mt-1 text-sm leading-none font-medium text-primary">今日</p>
            ) : null}
            <p className="mt-1 text-sm leading-none text-secondary tabular-nums">
              {ready ? `${isWeek ? weekEvents.length : visible.length}件` : "読み込み中"}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <aside className="min-h-0 min-w-0 space-y-4">
          <CollapsibleCalendar
            selectedDate={filters.date}
            today={today}
            markedDates={markedDates}
            onViewMonthChange={setCalendarMonth}
            onSelectDate={(date) => {
              if (date !== filters.date) update({ date });
            }}
          />
          <FiltersPanel
            keywordResetKey={keywordResetKey}
            filters={filters}
            groups={groups}
            counts={counts}
            onFormat={(format) => {
              if (format !== filters.format) update({ format });
            }}
            onAreas={(areas) => update({ areas })}
            onKeyword={(keyword) => {
              if (keyword !== filters.keyword) update({ keyword }, "replace");
            }}
            onClear={clearFilters}
          />
        </aside>
        {!ready ? (
          <EventDataStatus error={data.error} onRetry={data.retry} />
        ) : isWeek ? (
          <WeekView
            filters={filters}
            dates={week}
            events={weekEvents}
            today={today}
            now={now}
            onOpenDay={(date) => update({ date, view: "month" })}
            onChangeFilters={(partial) => update(partial)}
          />
        ) : (
          <EventList
            filters={filters}
            events={visible}
            today={today}
            now={now}
            onSelectDate={(date) => {
              if (date !== filters.date) update({ date });
            }}
            onChangeFilters={(partial) => update(partial)}
            onClearFilters={clearFilters}
          />
        )}
      </div>
    </div>
  );
}

function EventDataStatus({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (error) {
    return (
      <section role="alert" className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-foreground">{error}</p>
        <button
          type="button"
          className="mt-3 inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-surface"
          onClick={onRetry}
        >
          もう一度読み込む
        </button>
      </section>
    );
  }

  return (
    <section role="status" aria-live="polite" className="min-w-0 space-y-2">
      <span className="sr-only">イベントを読み込み中です</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-56 animate-pulse rounded-lg border border-border bg-card lg:h-40"
        />
      ))}
    </section>
  );
}
