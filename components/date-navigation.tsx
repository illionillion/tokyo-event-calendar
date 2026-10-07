import { cn } from "@/lib/cn";
import {
  addDays,
  dateInMonth,
  dateWindow,
  dayNumber,
  formatDayHeading,
  monthOptions,
  monthValue,
  weekdayLabel,
} from "@/lib/dates";

function DayChevron({ direction }: { direction: "previous" | "next" }) {
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

type DateNavigationProps = {
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
};

export function DateNavigation({ selectedDate, today, onSelectDate }: DateNavigationProps) {
  const days = dateWindow(selectedDate);
  const options = monthOptions(today, selectedDate);

  return (
    <nav
      aria-label="日付"
      className="w-full min-w-0 rounded-lg border border-border bg-card p-2 lg:w-fit lg:p-2.5"
    >
      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex items-center gap-2">
          <label className="min-w-0">
            <span className="sr-only">月を選択</span>
            <select
              aria-label="月を選択"
              className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground"
              value={monthValue(selectedDate)}
              onChange={(event) => onSelectDate(dateInMonth(selectedDate, event.target.value))}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-surface disabled:text-muted"
            onClick={() => onSelectDate(today)}
            disabled={selectedDate === today}
          >
            今日
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-surface"
            aria-label="前の日"
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
          >
            <DayChevron direction="previous" />
          </button>
          <div className="grid min-w-0 flex-1 grid-cols-[repeat(7,minmax(0,1fr))] gap-1 lg:flex-none">
            {days.map((date) => {
              const selected = date === selectedDate;
              const isToday = date === today;
              const isPast = date < today;

              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={selected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${formatDayHeading(date)}${isToday ? " 今日" : ""}`}
                  onClick={() => onSelectDate(date)}
                  className={cn(
                    "mx-auto flex h-[52px] w-full min-w-0 flex-col items-center justify-center rounded-md px-0.5 text-foreground lg:w-12",
                    selected && "bg-primary text-white",
                    !selected && isToday && "text-primary",
                    !selected && !isToday && isPast && "text-muted",
                    !selected && "hover:bg-surface"
                  )}
                >
                  <span className="text-[10px] leading-none">{weekdayLabel(date)}</span>
                  <span className="mt-1 text-sm leading-none font-semibold tabular-nums">
                    {dayNumber(date)}
                  </span>
                  <span className="mt-1 h-3 text-[10px] leading-none">{isToday ? "今日" : ""}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-surface"
            aria-label="次の日"
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
          >
            <DayChevron direction="next" />
          </button>
        </div>
      </div>
    </nav>
  );
}
