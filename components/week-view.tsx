"use client";

import { useEffect, useRef } from "react";
import { EventThumbnail } from "@/components/event-card";
import { ActiveFilterChips } from "@/components/event-list";
import { cn } from "@/lib/cn";
import { addDays, dayNumber, formatDayHeading, hasEnded, weekdayLabel } from "@/lib/dates";
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

/**
 * 週表示の「前の週」「今日」「次の週」。PC では月表示の DateNavigation と同じ大きさ（649 × 74px）にして、
 * 月 ⇔ 週の切り替えで上の帯の高さや位置が動かないようにする。
 */
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
      className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-card p-2 lg:h-[74px] lg:w-[649px] lg:p-2.5"
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

/** 7 列の並び。見出しの行と本体の行で同じものを使い、列の位置を揃える。 */
const COLUMNS =
  "grid auto-cols-[48%] grid-flow-col gap-1.5 lg:grid-flow-row lg:grid-cols-[repeat(7,minmax(0,1fr))] lg:gap-1";

/**
 * 週表示。日曜〜土曜の 7 列に、その日のイベントを小さなカードで縦に積む（時間軸は持たない）。
 * - PC（lg = 1024px 以上）: 7 列を等幅（minmax(0, 1fr)）で並べ、横スクロールせず必ず収める
 * - lg 未満: 1 列を 48%（1 画面に約 2 列）にして、週の部分だけ横スクロールする（列ごとにスナップ）。
 *   最初は今日の列（今日を含む週のとき）を左端に合わせる
 * - 日付の見出しの行は本体と分け、ページに対して sticky にする（top はページ上部の固定帯の下端
 *   = --page-bar-bottom）。横スクロールする枠の中に置くと sticky がページ基準にならないため、
 *   見出しの行は overflow-x: hidden にして、本体の横スクロールに scrollLeft を合わせる。
 *   z-index はページの固定帯（z-10）より下なので、帯の上に見出しが重ならない
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
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const weekKey = dates[0];
  const todayIndex = dates.indexOf(today);

  useEffect(() => {
    // 週を開いたとき・週を移動したときは、今日の列（なければ先頭）を左端に合わせる
    // （枠は position: relative なので、列の offsetLeft は枠の左端からの距離）
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const column =
      todayIndex > 0
        ? (scroller.firstElementChild?.children[todayIndex] as HTMLElement | undefined)
        : undefined;
    scroller.scrollLeft = column ? column.offsetLeft : 0;
    if (headerRef.current) headerRef.current.scrollLeft = scroller.scrollLeft;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 週が変わったときだけ合わせる
  }, [weekKey]);

  const byDate = new Map(
    dates.map((date) => [date, events.filter((event) => event.date === date)])
  );

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
        ref={headerRef}
        data-testid="week-header-row"
        className="sticky top-[var(--page-bar-bottom,0px)] z-[5] mt-3 min-w-0 overflow-x-hidden bg-background pb-1.5"
      >
        <div className={COLUMNS}>
          {dates.map((date) => (
            <DayHeader
              key={date}
              date={date}
              count={byDate.get(date)?.length ?? 0}
              today={today}
              onOpenDay={onOpenDay}
            />
          ))}
        </div>
      </div>
      {/* lg 未満は週の部分だけ横スクロールする（ページ自体は横にはみ出さない） */}
      <div
        ref={scrollerRef}
        data-testid="week-scroller"
        onScroll={(event) => {
          if (headerRef.current) headerRef.current.scrollLeft = event.currentTarget.scrollLeft;
        }}
        className="relative min-w-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-1 lg:snap-none lg:overflow-visible lg:pb-0"
      >
        <div data-testid="week-columns" className={COLUMNS}>
          {dates.map((date) => (
            <DayColumn key={date} date={date} events={byDate.get(date) ?? []} now={now} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayHeader({
  date,
  count,
  today,
  onOpenDay,
}: {
  date: string;
  count: number;
  today: string;
  onOpenDay: (date: string) => void;
}) {
  const holiday = holidayName(date);
  const isToday = date === today;

  return (
    <h3 className="min-w-0">
      {/*
        見出しは「日付」「祝日名」「今日のバッジ・件数」の 3 段を常に確保して高さを揃える。
        祝日名は 1 行で切り詰め、全文はツールチップに出す。
      */}
      <button
        type="button"
        onClick={() => onOpenDay(date)}
        aria-label={`${formatDayHeading(date)}${holiday ? ` ${holiday}` : ""}${isToday ? " 今日" : ""} ${count}件の一覧を開く`}
        title={holiday ?? undefined}
        data-testid={`day-header-${date}`}
        className={cn(
          "grid w-full min-w-0 grid-rows-[1rem_0.875rem_1rem] justify-items-center gap-0.5 rounded-md border border-border bg-card px-0.5 py-1.5 text-center hover:bg-surface",
          isToday && "border-primary"
        )}
      >
        {/* 今日は「今日」の赤を優先し、土日祝の色を付けない（日の一覧と同じ） */}
        <span
          className={cn(
            "max-w-full truncate text-xs leading-4 font-semibold",
            isToday ? "text-primary" : dayKindTextClass(dayKind(date))
          )}
        >
          {/* 細い列でも切れないよう月は省く（月は週の範囲の見出しにある。読み上げ名は月から） */}
          {dayNumber(date)}日（{weekdayLabel(date)}）
        </span>
        <span
          className={cn(
            "block max-w-full truncate text-[10px] leading-[0.875rem] font-medium",
            isToday ? "text-secondary" : "text-holiday"
          )}
        >
          {holiday}
        </span>
        <span className="flex items-center gap-1 leading-4">
          {isToday ? (
            <span className="rounded-sm bg-primary px-1 text-[10px] leading-4 font-medium text-white">
              今日
            </span>
          ) : null}
          <span
            className="text-[11px] text-secondary tabular-nums"
            data-testid={`day-count-${date}`}
          >
            {count}件
          </span>
        </span>
      </button>
    </h3>
  );
}

function DayColumn({ date, events, now }: { date: string; events: Event[]; now: string }) {
  return (
    <section aria-label={formatDayHeading(date)} className="min-w-0 snap-start">
      {events.length === 0 ? (
        <p className="px-1 pt-1 text-center text-[11px] text-muted">イベントはありません</p>
      ) : (
        <ul className="min-w-0 space-y-1.5 lg:space-y-1">
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
 * サムネイルは余白なしでカードの上・左右の端まで広げ、connpass の画像に多い 16:9 で切り抜きを減らす、文字はその下に余白付きで置く。
 */
export function CompactEventCard({ event, now }: { event: Event; now: string }) {
  const ended = hasEnded(event.endedAt, now);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card hover:border-primary hover:bg-primary-soft"
    >
      {/* 画像はカードの上・左右の端まで広げる（角はカードの overflow-hidden で丸める） */}
      <span
        data-testid="compact-thumbnail"
        className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface"
      >
        <EventThumbnail event={event} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 px-1.5 py-1 lg:px-1">
        <span
          className={cn(
            "text-[10px] font-semibold tabular-nums",
            ended ? "text-secondary" : "text-foreground"
          )}
        >
          {event.start}–{event.end}
          {ended ? <span className="ml-1 font-normal text-muted">終了</span> : null}
        </span>
        <span
          className={cn(
            "text-xs leading-tight font-medium [overflow-wrap:anywhere]",
            ended ? "text-secondary" : "text-foreground"
          )}
        >
          {event.title}
          <span className="sr-only">（connpassで開く）</span>
        </span>
        <span
          className={cn(
            "truncate text-[10px]",
            event.format === "online" ? "text-primary" : "text-secondary"
          )}
        >
          {formatPlace(event)}
        </span>
      </span>
    </a>
  );
}
