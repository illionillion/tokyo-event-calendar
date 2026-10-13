"use client";

import { EventThumbnail } from "@/components/event-card";
import { ActiveFilterChips } from "@/components/event-list";
import { cn } from "@/lib/cn";
import { addDays, formatDayHeading, hasEnded } from "@/lib/dates";
import { formatPlace } from "@/lib/filters";
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
 * 週表示。PC（lg 以上）は日曜〜土曜の 7 列を等幅で並べ、各列にその日のイベントを小さなカードで縦に積む
 * （時間軸は持たない。列は minmax(0, 1fr) なので横スクロールせず必ず 7 列が収まる）。
 * lg 未満は 7 列が読める幅にならないため、日ごとの見出しと小さなカードを縦に並べる。
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
      <div
        data-testid="week-columns"
        className="mt-3 min-w-0 space-y-5 lg:grid lg:grid-cols-[repeat(7,minmax(0,1fr))] lg:gap-1.5 lg:space-y-0"
      >
        {dates.map((date) => (
          <DayColumn
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

function DayColumn({
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
        {/*
          PC の見出しは「日付」「祝日名」「件数・今日」の 3 段を常に確保して高さを揃える。
          祝日名は 1 行で切り詰め、全文はツールチップに出す。
        */}
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          aria-label={`${formatDayHeading(date)}${holiday ? ` ${holiday}` : ""}${isToday ? " 今日" : ""} ${events.length}件の一覧を開く`}
          title={holiday ?? undefined}
          data-testid={`day-header-${date}`}
          className={cn(
            "flex w-full min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md border-b border-border px-1 py-1.5 text-left hover:bg-surface",
            "lg:grid lg:grid-rows-[1rem_0.875rem_1rem] lg:justify-items-center lg:gap-0.5 lg:border lg:bg-card lg:px-0.5 lg:text-center",
            isToday && "lg:border-primary"
          )}
        >
          {/* 今日は「今日」の赤を優先し、土日祝の色を付けない（日の一覧と同じ） */}
          <span
            className={cn(
              "text-base font-semibold lg:max-w-full lg:truncate lg:text-xs lg:leading-4",
              isToday ? "text-primary" : dayKindTextClass(dayKind(date))
            )}
          >
            {formatDayHeading(date)}
          </span>
          <span
            className={cn(
              "text-sm font-medium lg:block lg:max-w-full lg:truncate lg:text-[10px] lg:leading-[0.875rem]",
              isToday ? "text-secondary" : "text-holiday",
              !holiday && "hidden"
            )}
          >
            {holiday}
          </span>
          <span className="ml-auto flex items-center gap-1 lg:ml-0 lg:leading-4">
            {isToday ? (
              <span className="rounded-sm bg-primary px-1 text-[11px] leading-4 font-medium text-white lg:text-[10px]">
                今日
              </span>
            ) : null}
            <span
              className="text-sm text-secondary tabular-nums lg:text-[11px]"
              data-testid={`day-count-${date}`}
            >
              {events.length}件
            </span>
          </span>
        </button>
      </h3>
      {events.length === 0 ? (
        <p className="mt-2 px-1 text-sm text-muted lg:text-center lg:text-[11px]">
          イベントはありません
        </p>
      ) : (
        <ul className="mt-2 min-w-0 space-y-2 lg:mt-1.5 lg:space-y-1.5">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <CompactEventCard event={event} now={now} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * 週表示用の小さなイベントカード。サムネイル・時刻・タイトル・場所（またはオンライン）だけを出す。
 * PC の細い列ではサムネイルを列幅いっぱいの低い画像にして上に、SP では左に置く。
 */
export function CompactEventCard({ event, now }: { event: Event; now: string }) {
  const ended = hasEnded(event.endedAt, now);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 gap-2 overflow-hidden rounded-md border border-border bg-card p-2 hover:border-primary hover:bg-primary-soft lg:flex-col lg:gap-1 lg:p-1"
    >
      <span className="relative block aspect-[16/9] w-24 shrink-0 overflow-hidden rounded-sm lg:aspect-[2/1] lg:w-full">
        <EventThumbnail event={event} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-xs font-semibold tabular-nums lg:text-[10px]",
            ended ? "text-secondary" : "text-foreground"
          )}
        >
          {event.start}–{event.end}
          {ended ? <span className="ml-1 font-normal text-muted">終了</span> : null}
        </span>
        <span
          className={cn(
            "text-sm leading-snug font-medium [overflow-wrap:anywhere] lg:text-xs lg:leading-tight",
            ended ? "text-secondary" : "text-foreground"
          )}
        >
          {event.title}
        </span>
        <span
          className={cn(
            "truncate text-xs lg:text-[10px]",
            event.format === "online" ? "text-primary" : "text-secondary"
          )}
        >
          {formatPlace(event)}
        </span>
      </span>
    </a>
  );
}
