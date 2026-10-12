"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CollapsibleCalendar } from "@/components/collapsible-calendar";
import { DateNavigation } from "@/components/date-navigation";
import { EventList } from "@/components/event-list";
import { FiltersPanel } from "@/components/filters-panel";
import { ViewToggle, WeekNavigation, WeekView } from "@/components/week-view";
import { groupAreas } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { parseDateKey, todayKey } from "@/lib/dates";
import { countByArea, filterEvents, matchesConditions, matchingDates } from "@/lib/filters";
import { parseFilters, syncFilterUrl } from "@/lib/query";
import type { Event, Filters } from "@/lib/types";
import { formatWeekRange, overlapsDates, weekDates } from "@/lib/week";

type EventExplorerProps = {
  events: Event[];
  today: string;
  now: string;
};

export function EventExplorer({ events, today: serverToday, now: serverNow }: EventExplorerProps) {
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
  const weekMode = searchParams.get("view") === "week";
  useEffect(() => {
    // 週表示は今の時刻の線・今日の列・終了済みの表示を、開いたままでも 1 分ごとに更新する
    if (!weekMode) return;
    const timer = setInterval(() => setClientNow(new Date().toISOString()), 60_000);
    return () => clearInterval(timer);
  }, [weekMode]);
  const filters = useMemo(() => parseFilters(searchParams, today), [searchParams, today]);
  const isWeek = filters.view === "week";
  const week = useMemo(() => weekDates(filters.date), [filters.date]);
  const weekFirst = week[0] ?? filters.date;
  const weekLast = week.at(-1) ?? filters.date;
  const visible = useMemo(() => filterEvents(events, filters), [events, filters]);
  const weekEvents = useMemo(() => {
    return events.filter(
      (event) => overlapsDates(event, weekFirst, weekLast) && matchesConditions(event, filters)
    );
  }, [events, filters, weekFirst, weekLast]);
  // 週表示ではエリアの件数も週に重なるイベントで数える
  const counts = useMemo(() => {
    if (!isWeek) return countByArea(events, filters);
    return countByArea(events, filters, (event) => overlapsDates(event, weekFirst, weekLast));
  }, [events, filters, isWeek, weekFirst, weekLast]);
  const markedDates = useMemo(() => matchingDates(events, filters), [events, filters]);
  const groups = useMemo(() => groupAreas(events, filters.areas), [events, filters.areas]);

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

  const selected = parseDateKey(filters.date);
  const selectedLabel = selected ? `${selected.month}月${selected.day}日` : filters.date;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 py-4",
        // 週表示は 7 列を読める幅にするため広げる
        isWeek ? "max-w-[1600px]" : "max-w-[1080px]"
      )}
    >
      {/* top-12 = サイトヘッダー h-12 */}
      <div className="sticky top-12 z-10 -mx-4 min-w-0 bg-background px-4 py-2">
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
          <div className="hidden shrink-0 text-right lg:block" aria-hidden="true">
            <p className="text-lg leading-none font-semibold tabular-nums">
              {isWeek ? formatWeekRange(week) : selectedLabel}
            </p>
            {!isWeek && filters.date === today ? (
              <p className="mt-1 text-sm leading-none font-medium text-primary">今日</p>
            ) : null}
            <p className="mt-1 text-sm leading-none text-secondary tabular-nums">
              {isWeek ? weekEvents.length : visible.length}件
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
        {isWeek ? (
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
