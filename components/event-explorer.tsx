"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateNavigation } from "@/components/date-navigation";
import { EventList } from "@/components/event-list";
import { FiltersPanel } from "@/components/filters-panel";
import { MiniCalendar } from "@/components/mini-calendar";
import { groupAreas } from "@/lib/areas";
import { parseDateKey, todayKey } from "@/lib/dates";
import { countByArea, filterEvents, matchingDates } from "@/lib/filters";
import { parseFilters, syncFilterUrl } from "@/lib/query";
import type { Event, Filters } from "@/lib/types";

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
  const filters = useMemo(() => parseFilters(searchParams, today), [searchParams, today]);
  const visible = useMemo(() => filterEvents(events, filters), [events, filters]);
  const counts = useMemo(() => countByArea(events, filters), [events, filters]);
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
    <div className="mx-auto w-full min-w-0 max-w-[1080px] px-4 py-4">
      {/* top-12 = サイトヘッダー h-12 */}
      <div className="sticky top-12 z-10 -mx-4 min-w-0 bg-background px-4 py-2">
        <div className="flex items-center justify-between gap-6">
          <DateNavigation
            selectedDate={filters.date}
            today={today}
            onSelectDate={(date) => {
              if (date !== filters.date) update({ date });
            }}
          />
          <div className="hidden shrink-0 text-right lg:block" aria-hidden="true">
            <p className="text-lg leading-none font-semibold tabular-nums">{selectedLabel}</p>
            {filters.date === today ? (
              <p className="mt-1 text-sm leading-none font-medium text-primary">今日</p>
            ) : null}
            <p className="mt-1 text-sm leading-none text-secondary tabular-nums">
              {visible.length}件
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <aside className="min-h-0 min-w-0 space-y-4">
          <div className="hidden lg:block">
            <MiniCalendar
              selectedDate={filters.date}
              today={today}
              markedDates={markedDates}
              onSelectDate={(date) => {
                if (date !== filters.date) update({ date });
              }}
            />
          </div>
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
      </div>
    </div>
  );
}
