"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  dayNumber,
  formatMonthLabel,
  monthGrid,
  monthValue,
  parseDateKey,
  shiftMonth,
  weekdayLabel,
} from "@/lib/dates";
import { dayKind, dayKindTextClass, holidayName } from "@/lib/holidays";

const WEEKDAY_HEADERS = ["日", "月", "火", "水", "木", "金", "土"];

type MiniCalendarProps = {
  selectedDate: string;
  today: string;
  markedDates: Set<string>;
  onSelectDate: (date: string) => void;
};

export function MiniCalendar({
  selectedDate,
  today,
  markedDates,
  onSelectDate,
}: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(monthValue(selectedDate));
  const [trackedDate, setTrackedDate] = useState(selectedDate);

  if (selectedDate !== trackedDate) {
    setTrackedDate(selectedDate);
    setViewMonth(monthValue(selectedDate));
  }

  const [yearText, monthText] = viewMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const cells = monthGrid(year, month);
  const viewAnchor = `${viewMonth}-01`;

  return (
    <section aria-label="ミニカレンダー" className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-border text-lg leading-none text-foreground hover:bg-surface"
          aria-label="前の月"
          onClick={() => setViewMonth(monthValue(shiftMonth(viewAnchor, -1)))}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <p className="text-sm font-medium">{formatMonthLabel(viewAnchor)}</p>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-border text-lg leading-none text-foreground hover:bg-surface"
          aria-label="次の月"
          onClick={() => setViewMonth(monthValue(shiftMonth(viewAnchor, 1)))}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {WEEKDAY_HEADERS.map((label, index) => (
          <span
            key={label}
            className={cn(index === 0 && "text-holiday", index === 6 && "text-saturday")}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const selected = cell.date === selectedDate;
          const isToday = cell.date === today;
          const hasEvent = markedDates.has(cell.date);
          const parts = parseDateKey(cell.date);
          const holiday = holidayName(cell.date);
          const kindClass = dayKindTextClass(dayKind(cell.date));

          return (
            <button
              key={cell.date}
              type="button"
              aria-pressed={selected}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${cell.date} ${weekdayLabel(cell.date)}曜日${holiday ? ` ${holiday}` : ""}${hasEvent ? " イベントあり" : ""}`}
              title={holiday ?? undefined}
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                "flex h-8 flex-col items-center justify-center rounded-md text-[13px] tabular-nums",
                selected && "bg-primary font-semibold text-white",
                !selected && isToday && "font-semibold text-primary ring-1 ring-primary ring-inset",
                !selected && "hover:bg-surface",
                // 選択中・今日・前後の月の日は、それぞれの見た目を優先して土日祝の色を付けない。
                !selected && !isToday && !cell.inMonth && "text-muted",
                !selected && !isToday && cell.inMonth && (kindClass || "text-foreground")
              )}
            >
              <span className="leading-none">{parts ? dayNumber(cell.date) : ""}</span>
              <span
                className={cn(
                  "mt-0.5 size-1 rounded-full",
                  hasEvent && selected && "bg-white",
                  hasEvent && !selected && "bg-primary",
                  !hasEvent && "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
