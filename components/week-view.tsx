"use client";

import { useEffect, useMemo, useRef } from "react";
import { ActiveFilterChips } from "@/components/event-list";
import { cn } from "@/lib/cn";
import { addDays, dayNumber, formatDayHeading, hasEnded, weekdayLabel } from "@/lib/dates";
import { formatPlace } from "@/lib/filters";
import { dayKind, dayKindTextClass, holidayName } from "@/lib/holidays";
import type { Event, Filters, ViewMode } from "@/lib/types";
import {
  countOnDate,
  formatWeekRange,
  initialScrollHour,
  limitColumns,
  MIN_BLOCK_MINUTES,
  type OverflowSlot,
  lastDate,
  layoutWeek,
  minutesOfDay,
  type AllDayBar,
  type TimedSegment,
} from "@/lib/week";

/** 時間軸の 1 時間の高さ（px）。 */
const HOUR_PX = 56;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

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

/** 月（月のカレンダー + 1 日分の一覧）と週（時間割）の切り替え。 */
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
  /** 週に重なり、条件に当たるイベント */
  events: Event[];
  today: string;
  now: string;
  /** 日付の見出しを押したとき（その日の一覧を開く） */
  onOpenDay: (date: string) => void;
  onChangeFilters: (partial: Partial<Filters>) => void;
};

function eventLabel(event: Event): string {
  return `${event.title} ${formatDayHeading(event.date)} ${event.start}〜${event.end} ${formatPlace(event)}`;
}

/** 日付の見出しの文字色。今日・選択中の日はその強調を優先し、土日祝の色を付けない。 */
function dayHeaderClass(date: string, today: string, selectedDate: string): string {
  if (date === selectedDate) return "bg-primary text-white";
  if (date === today) return "text-primary ring-1 ring-primary ring-inset";
  return dayKindTextClass(dayKind(date)) || "text-foreground";
}

export function WeekView({
  filters,
  dates,
  events,
  today,
  now,
  onOpenDay,
  onChangeFilters,
}: WeekViewProps) {
  const layout = useMemo(() => layoutWeek(events, dates), [events, dates]);
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
      <div className="hidden lg:block">
        <WeekGrid layout={layout} filters={filters} today={today} now={now} onOpenDay={onOpenDay} />
      </div>
      <div className="lg:hidden">
        <WeekAgenda
          layout={layout}
          filters={filters}
          today={today}
          now={now}
          onOpenDay={onOpenDay}
        />
      </div>
    </section>
  );
}

type LayoutProps = {
  layout: ReturnType<typeof layoutWeek>;
  filters: Filters;
  today: string;
  now: string;
  onOpenDay: (date: string) => void;
};

/** PC: 7 日の列と時間軸（Google カレンダーの週表示に近い形）。 */
function WeekGrid({ layout, filters, today, now, onOpenDay }: LayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollHour = initialScrollHour(layout);
  const weekKey = layout.dates[0];
  // now / today は EventExplorer が週表示の間 1 分ごとに取り直す
  const nowMinutes = minutesOfDay(now);
  const columns = "grid-cols-[3rem_repeat(7,minmax(0,1fr))]";

  useEffect(() => {
    // 週を移動したときは、その週の最初に見せる時刻までスクロールし直す
    if (scrollRef.current) scrollRef.current.scrollTop = scrollHour * HOUR_PX;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 週が変わったときだけ合わせる
  }, [weekKey]);

  return (
    <div
      role="group"
      aria-label="週の時間割"
      className="mt-3 overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className={cn("grid border-b border-border", columns)}>
        <span aria-hidden="true" />
        {layout.dates.map((date) => {
          const holiday = holidayName(date);
          const count = countOnDate(layout, date);
          return (
            <div key={date} className="px-1 py-2 text-center">
              <button
                type="button"
                onClick={() => onOpenDay(date)}
                aria-label={`${formatDayHeading(date)}${holiday ? ` ${holiday}` : ""}${date === today ? " 今日" : ""} ${count}件の一覧を開く`}
                title={holiday ?? undefined}
                className={cn(
                  "mx-auto flex w-12 flex-col items-center rounded-md py-1 hover:bg-surface",
                  dayHeaderClass(date, today, filters.date),
                  date === filters.date && "hover:bg-primary-hover"
                )}
              >
                <span className="text-[11px] leading-none">{weekdayLabel(date)}</span>
                <span className="mt-1 text-lg leading-none font-semibold tabular-nums">
                  {dayNumber(date)}
                </span>
              </button>
              <span
                aria-hidden="true"
                data-testid={`day-count-${date}`}
                className="mt-1 block text-[11px] text-secondary tabular-nums"
              >
                {count}件
              </span>
              {holiday ? (
                <span
                  className={cn(
                    "mt-1 block truncate text-[11px]",
                    date === today || date === filters.date ? "text-secondary" : "text-holiday"
                  )}
                >
                  {holiday}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {layout.allDayLanes > 0 ? (
        <div
          className={cn("grid gap-y-1 border-b border-border py-1", columns)}
          style={{ gridTemplateRows: `repeat(${layout.allDayLanes}, minmax(0, auto))` }}
        >
          <span className="row-span-full self-center px-1 text-center text-[10px] leading-tight text-muted">
            終日
            <br />
            複数日
          </span>
          {layout.allDay.map((bar) => (
            <AllDayBlock key={bar.event.id} bar={bar} now={now} />
          ))}
        </div>
      ) : null}

      <div ref={scrollRef} className="relative h-[600px] overflow-y-auto">
        <div className={cn("relative grid", columns)} style={{ height: 24 * HOUR_PX }}>
          <div className="relative" aria-hidden="true">
            {HOURS.map((hour) => (
              <span
                key={hour}
                aria-hidden="true"
                className="absolute right-1 -translate-y-1/2 text-[10px] text-muted tabular-nums"
                style={{ top: hour * HOUR_PX }}
              >
                {hour === 0 ? "" : `${hour}:00`}
              </span>
            ))}
          </div>
          {layout.dates.map((date) => (
            <div
              key={date}
              role="group"
              aria-label={formatDayHeading(date)}
              className="relative border-l border-border"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_PX}px)`,
              }}
            >
              <DayColumn
                segments={layout.timed.get(date) ?? []}
                now={now}
                onOverflow={() => onOpenDay(date)}
              />
              {date === today ? (
                <span
                  aria-hidden="true"
                  data-testid="now-line"
                  className="pointer-events-none absolute right-0 left-0 z-10 h-0.5 bg-primary"
                  style={{ top: (nowMinutes / 60) * HOUR_PX }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  segments,
  now,
  onOverflow,
}: {
  segments: TimedSegment[];
  now: string;
  onOverflow: () => void;
}) {
  const { visible, overflow } = limitColumns(segments);

  return (
    <>
      {visible.map((segment) => (
        <TimedBlock key={`${segment.event.id}-${segment.date}`} segment={segment} now={now} />
      ))}
      {overflow.map((slot) => (
        <OverflowBlock key={`${slot.date}-${slot.start}`} slot={slot} onClick={onOverflow} />
      ))}
    </>
  );
}

/** ブロックの位置（top / height / left / width）。最低の高さは MIN_BLOCK_MINUTES 分。 */
function blockStyle(start: number, end: number, column: number, columns: number) {
  const top = (start / 60) * HOUR_PX;
  const height = Math.min(
    (Math.max(end - start, MIN_BLOCK_MINUTES) / 60) * HOUR_PX,
    24 * HOUR_PX - top
  );
  const width = 100 / columns;
  return {
    top,
    height,
    left: `calc(${column * width}% + 1px)`,
    width: `calc(${width}% - 2px)`,
  };
}

function OverflowBlock({ slot, onClick }: { slot: OverflowSlot; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`ほか${slot.count}件（その日の一覧を開く）`}
      className="absolute flex items-start justify-center rounded-md border border-dashed border-primary bg-card px-1 py-1 text-[12px] font-semibold text-primary hover:bg-primary-soft"
      style={blockStyle(slot.start, slot.end, slot.column, slot.columns)}
    >
      +{slot.count}件
    </button>
  );
}

function TimedBlock({ segment, now }: { segment: TimedSegment; now: string }) {
  const { event } = segment;
  const ended = hasEnded(event.endedAt, now);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={eventLabel(event)}
      title={`${event.start}–${event.end} ${formatPlace(event)}\n${event.title}`}
      data-column={segment.column}
      data-columns={segment.columns}
      className={cn(
        "absolute overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-[11px] leading-tight hover:z-20 hover:shadow-sm",
        ended
          ? "border-border bg-surface text-secondary"
          : "border-primary bg-primary-soft text-foreground hover:bg-card"
      )}
      style={blockStyle(segment.start, segment.end, segment.column, segment.columns)}
    >
      <span className="block font-semibold tabular-nums">
        {segment.continuesBefore ? "↑ " : ""}
        {event.start}–{event.end}
        {segment.continuesAfter ? " ↓" : ""}
      </span>
      <span
        className={cn(
          "block truncate text-[10px]",
          ended ? "text-secondary" : "text-primary-hover"
        )}
      >
        {formatPlace(event)}
      </span>
      <span className="block font-medium break-words">{event.title}</span>
    </a>
  );
}

function AllDayBlock({ bar, now }: { bar: AllDayBar; now: string }) {
  const { event } = bar;
  const ended = hasEnded(event.endedAt, now);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${eventLabel(event)}（${formatDayHeading(lastDate(event))}まで）`}
      title={event.title}
      className={cn(
        "mx-0.5 truncate rounded-md px-1.5 py-0.5 text-[11px] leading-tight hover:shadow-sm",
        ended ? "bg-surface text-secondary" : "bg-primary text-white hover:bg-primary-hover",
        bar.continuesBefore && "rounded-l-none",
        bar.continuesAfter && "rounded-r-none"
      )}
      style={{
        gridColumn: `${bar.startIndex + 2} / ${bar.endIndex + 3}`,
        gridRow: bar.lane + 1,
      }}
    >
      {bar.continuesBefore ? "← " : ""}
      {event.start} {event.title}
      {bar.continuesAfter ? " →" : ""}
    </a>
  );
}

/** SP: 週の 7 日を縦に並べた日ごとの一覧（時間軸は狭い画面では読みにくいため）。 */
function WeekAgenda({ layout, filters, today, now, onOpenDay }: LayoutProps) {
  return (
    <ol className="mt-3 space-y-2" aria-label="週の日ごとの一覧">
      {layout.dates.map((date) => {
        const allDay = layout.allDay.filter(
          (bar) =>
            layout.dates.indexOf(date) >= bar.startIndex &&
            layout.dates.indexOf(date) <= bar.endIndex
        );
        const timed = [...(layout.timed.get(date) ?? [])].sort(
          (left, right) => left.start - right.start || left.end - right.end
        );
        const holiday = holidayName(date);
        const isToday = date === today;
        const emphasized = isToday || date === filters.date;
        const count = allDay.length + timed.length;

        return (
          <li key={date} className="rounded-lg border border-border bg-card">
            <h3>
              <button
                type="button"
                onClick={() => onOpenDay(date)}
                aria-label={`${formatDayHeading(date)}${holiday ? ` ${holiday}` : ""}${isToday ? " 今日" : ""}の一覧を開く`}
                className="flex w-full items-center justify-between gap-2 rounded-t-lg px-3 py-2 text-left hover:bg-surface"
              >
                <span className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isToday
                        ? "text-primary"
                        : emphasized
                          ? "text-foreground"
                          : dayKindTextClass(dayKind(date)) || "text-foreground"
                    )}
                  >
                    {formatDayHeading(date)}
                  </span>
                  {holiday ? (
                    <span
                      className={cn("text-[12px]", emphasized ? "text-secondary" : "text-holiday")}
                    >
                      {holiday}
                    </span>
                  ) : null}
                  {isToday ? (
                    <span className="text-[12px] font-medium text-primary">今日</span>
                  ) : null}
                </span>
                <span className="text-[12px] text-secondary tabular-nums">{count}件</span>
              </button>
            </h3>
            {count === 0 ? (
              <p className="border-t border-border px-3 py-2 text-[13px] text-muted">
                イベントはありません
              </p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {allDay.map((bar) => (
                  <AgendaRow
                    key={`all-${bar.event.id}`}
                    event={bar.event}
                    time="終日・複数日"
                    now={now}
                  />
                ))}
                {timed.map((segment) => (
                  <AgendaRow
                    key={`${segment.event.id}-${segment.date}`}
                    event={segment.event}
                    time={`${segment.continuesBefore ? "（前日から）" : ""}${segment.event.start}–${segment.event.end}`}
                    now={now}
                  />
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AgendaRow({ event, time, now }: { event: Event; time: string; now: string }) {
  const ended = hasEnded(event.endedAt, now);

  return (
    <li>
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={eventLabel(event)}
        className="flex gap-3 px-3 py-2 hover:bg-primary-soft"
      >
        <span
          className={cn(
            "w-24 shrink-0 text-[12px] font-semibold tabular-nums",
            ended ? "text-secondary" : "text-foreground"
          )}
        >
          {time}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block text-[13px] font-medium",
              ended ? "text-secondary" : "text-foreground"
            )}
          >
            {event.title}
          </span>
          <span className="block truncate text-[12px] text-secondary">{formatPlace(event)}</span>
        </span>
      </a>
    </li>
  );
}
