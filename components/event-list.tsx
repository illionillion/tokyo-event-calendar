import { EventCard } from "@/components/event-card";
import { addDays, formatDayHeading, hasEnded } from "@/lib/dates";
import { formatLabel, hasActiveFilters, joinKeywordTerms, splitKeywordTerms } from "@/lib/filters";
import type { Event, Filters } from "@/lib/types";

type EventListProps = {
  filters: Filters;
  events: Event[];
  today: string;
  now: string;
  onSelectDate: (date: string) => void;
  onChangeFilters: (partial: Partial<Filters>) => void;
  onClearFilters: () => void;
};

export function EventList({
  filters,
  events,
  today,
  now,
  onSelectDate,
  onChangeFilters,
  onClearFilters,
}: EventListProps) {
  const active = hasActiveFilters(filters);
  const allEnded = events.length > 0 && events.every((event) => hasEnded(event.endedAt, now));
  const isToday = filters.date === today;

  return (
    <section id="events" aria-labelledby="event-list-heading">
      <div className="flex flex-wrap items-end justify-between gap-2 lg:sr-only">
        <h2 id="event-list-heading" className="text-lg font-semibold text-balance">
          {formatDayHeading(filters.date)}
          {isToday ? <span className="ml-2 text-sm font-medium text-primary">今日</span> : null}
        </h2>
        <p className="text-sm text-secondary tabular-nums" aria-live="polite">
          {events.length}件
        </p>
      </div>

      {active ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {filters.area ? (
            <li>
              <FilterChip
                label={filters.area}
                onClear={() => onChangeFilters({ area: null })}
                clearLabel={`${filters.area}の条件を解除`}
              />
            </li>
          ) : null}
          {filters.format !== "all" ? (
            <li>
              <FilterChip
                label={formatLabel(filters.format)}
                onClear={() => onChangeFilters({ format: "all" })}
                clearLabel="開催形態の条件を解除"
              />
            </li>
          ) : null}
          {splitKeywordTerms(filters.keyword).map((term, index, terms) => (
            <li key={`${term}-${index}`}>
              <FilterChip
                label={term}
                onClear={() =>
                  onChangeFilters({
                    keyword: joinKeywordTerms(terms.filter((_, i) => i !== index)),
                  })
                }
                clearLabel={`${term}の条件を解除`}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {events.length === 0 ? (
        <EmptyState
          active={active}
          isToday={isToday}
          onPrevious={() => onSelectDate(addDays(filters.date, -1))}
          onNext={() => onSelectDate(addDays(filters.date, 1))}
          onToday={() => onSelectDate(today)}
          onClear={onClearFilters}
        />
      ) : (
        <>
          {allEnded ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
              <p className="text-pretty text-sm text-secondary">
                この日のイベントはすべて終了しています
              </p>
              <button
                type="button"
                className="h-9 rounded-md bg-primary px-3 text-sm text-white hover:bg-primary-hover"
                onClick={() => onSelectDate(addDays(filters.date, 1))}
              >
                翌日を見る
              </button>
            </div>
          ) : null}
          <ul className="mt-3 space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} now={now} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function FilterChip({
  label,
  clearLabel,
  onClear,
}: {
  label: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={clearLabel}
      onClick={onClear}
      className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-[13px] text-primary"
    >
      {label}
      <span aria-hidden="true">×</span>
    </button>
  );
}

function EmptyState({
  active,
  isToday,
  onPrevious,
  onNext,
  onToday,
  onClear,
}: {
  active: boolean;
  isToday: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card px-4 py-10 text-center">
      <p className="text-pretty font-medium">この日のイベントはありません</p>
      <p className="mt-2 text-pretty text-sm text-secondary">
        {active ? "条件を変えると見つかることがあります。" : "近くの日に移動できます。"}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {active ? (
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-3 text-sm text-white hover:bg-primary-hover"
            onClick={onClear}
          >
            条件をクリア
          </button>
        ) : (
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-3 text-sm text-white hover:bg-primary-hover"
            onClick={onNext}
          >
            翌日を見る
          </button>
        )}
        <button
          type="button"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm hover:bg-surface"
          onClick={onPrevious}
        >
          前日を見る
        </button>
        {active ? (
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm hover:bg-surface"
            onClick={onNext}
          >
            翌日を見る
          </button>
        ) : null}
        {!isToday ? (
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm hover:bg-surface"
            onClick={onToday}
          >
            今日に戻る
          </button>
        ) : null}
      </div>
    </div>
  );
}
