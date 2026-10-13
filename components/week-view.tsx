"use client";

import { EventCard } from "@/components/event-card";
import { ActiveFilterChips } from "@/components/event-list";
import { cn } from "@/lib/cn";
import { addDays, formatDayHeading } from "@/lib/dates";
import { dayKind, dayKindTextClass, holidayName } from "@/lib/holidays";
import type { Event, Filters, ViewMode } from "@/lib/types";
import { formatWeekRange } from "@/lib/week";

function Chevron({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", direction === "previous" && "-scale-x-100")}
      aria-hidden="true"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 月（月のカレンダー + 1 日分の一覧）と週（7 日分の一覧）の切り替え。 */
export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  const options: Array<{ value: ViewMode; label: string }> = [
    { value: "month", label: "月" },
    { value: "week", label: "週" },
  ];

  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">表示</legend>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-card p-1">
        {options.map((option) => {
          const checked = view === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex h-8 min-w-12 cursor-pointer items-center justify-center rounded-md px-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                checked ? "bg-primary text-white" : "text-foreground hover:bg-surface"
              )}
            >
              <input
                type="radio"
                name="view"
                className="sr-only"
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 週表示の「前の週」「今日」「次の週」。 */
export function WeekNavigation({
  dates,
  today,
  selectedDate,
  onSelectDate,
}: {
  dates: string[];
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const includesToday = dates.includes(today);

  return (
    <nav
      aria-label="週"
      className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-card p-2 lg:w-fit lg:p-2.5"
    >
      <button
        type="button"
        className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-surface disabled:text-muted"
        onClick={() => onSelectDate(today)}
        disabled={includesToday && selectedDate === today}
      >
        今日
      </button>
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-surface"
        aria-label="前の週"
        onClick={() => onSelectDate(addDays(selectedDate, -7))}
      >
        <Chevron direction="previous" />
      </button>
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-surface"
        aria-label="次の週"
        onClick={() => onSelectDate(addDays(selectedDate, 7))}
      >
        <Chevron direction="next" />
      </button>
      <p className="min-w-0 truncate px-1 text-sm font-medium tabular-nums lg:text-base">
        {formatWeekRange(dates)}
      </p>
    </nav>
  );
}

type WeekViewProps = {
  filters: Filters;
  dates: string[];
  /** 週のうちに始まり、条件に当たるイベント */
  events: Event[];
  today: string;
  now: string;
  /** 日付の見出しを押したとき（その日の一覧を開く） */
  onOpenDay: (date: string) => void;
  onChangeFilters: (partial: Partial<Filters>) => void;
};

/**
 * 週表示。日曜〜土曜の日ごとに、日の一覧と同じイベントカードを並べる。
 * 複数日のイベントは日の一覧と同じく開始日にだけ出す（件数も日の一覧と揃える）。
 */
export function WeekView({
  filters,
  dates,
  events,
  today,
  now,
  onOpenDay,
  onChangeFilters,
}: WeekViewProps) {
  const range = formatWeekRange(dates);

  return (
    <section aria-labelledby="week-heading" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="week-heading" className="text-lg font-semibold text-balance lg:text-base">
          {range}
          <span className="sr-only">の週</span>
        </h2>
        <p className="text-sm text-secondary tabular-nums" aria-live="polite">
          {events.length}件
        </p>
      </div>
      <ActiveFilterChips filters={filters} onChangeFilters={onChangeFilters} />
      <div className="mt-3 min-w-0 space-y-6">
        {dates.map((date) => (
          <DaySection
            key={date}
            date={date}
            events={events.filter((event) => event.date === date)}
            today={today}
            now={now}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    </section>
  );
}

function DaySection({
  date,
  events,
  today,
  now,
  onOpenDay,
}: {
  date: string;
  events: Event[];
  today: string;
  now: string;
  onOpenDay: (date: string) => void;
}) {
  const holiday = holidayName(date);
  const isToday = date === today;
  const headingId = `week-day-${date}`;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h3 id={headingId} className="min-w-0">
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          aria-label={`${formatDayHeading(date)}${holiday ? ` ${holiday}` : ""}${isToday ? " 今日" : ""} ${events.length}件の一覧を開く`}
          className="flex w-full min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border-b border-border px-1 py-1.5 text-left hover:bg-surface"
        >
          {/* 今日は「今日」の赤を優先し、土日祝の色を付けない（日の一覧と同じ） */}
          <span
            className={cn(
              "text-base font-semibold",
              isToday ? "text-primary" : dayKindTextClass(dayKind(date))
            )}
          >
            {formatDayHeading(date)}
          </span>
          {holiday ? (
            <span
              className={cn("text-sm font-medium", isToday ? "text-secondary" : "text-holiday")}
            >
              {holiday}
            </span>
          ) : null}
          {isToday ? <span className="text-sm font-medium text-primary">今日</span> : null}
          <span
            className="ml-auto text-sm text-secondary tabular-nums"
            data-testid={`day-count-${date}`}
          >
            {events.length}件
          </span>
        </button>
      </h3>
      {events.length === 0 ? (
        <p className="mt-2 px-1 text-sm text-muted">この日のイベントはありません</p>
      ) : (
        <ul className="mt-2 min-w-0 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <EventCard event={event} now={now} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
