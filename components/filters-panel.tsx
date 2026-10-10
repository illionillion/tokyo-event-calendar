"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AreaGroups } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { formatLabel, hasActiveFilters, keywordPlaceholder, toggleArea } from "@/lib/filters";
import type { Filters, FormatFilter } from "@/lib/types";

const FORMAT_OPTIONS: FormatFilter[] = ["all", "online", "offline"];

type FiltersPanelProps = {
  keywordResetKey: number;
  filters: Filters;
  groups: AreaGroups;
  counts: Map<string, number>;
  onFormat: (format: FormatFilter) => void;
  /** 選んだエリアの一覧を渡す。空配列は「すべて」。 */
  onAreas: (areas: string[]) => void;
  onKeyword: (keyword: string) => void;
  onClear: () => void;
};

export function FiltersPanel({
  keywordResetKey,
  filters,
  groups,
  counts,
  onFormat,
  onAreas,
  onKeyword,
  onClear,
}: FiltersPanelProps) {
  const active = hasActiveFilters(filters);

  return (
    <section aria-label="絞り込み" className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">絞り込み</h2>
        {active ? (
          <button type="button" className="text-sm text-primary hover:underline" onClick={onClear}>
            条件をクリア
          </button>
        ) : null}
      </div>

      <fieldset className="mt-3">
        <legend className="text-[13px] text-secondary">開催形態</legend>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {FORMAT_OPTIONS.map((option) => {
            const checked = filters.format === option;
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-md border px-1 py-1.5 text-center text-[13px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                  checked
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-foreground hover:bg-surface"
                )}
              >
                <input
                  type="radio"
                  name="format"
                  className="sr-only"
                  value={option}
                  checked={checked}
                  onChange={() => onFormat(option)}
                />
                {formatLabel(option)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <KeywordField key={keywordResetKey} keyword={filters.keyword} onKeyword={onKeyword} />

      <AreaFilter areas={filters.areas} groups={groups} counts={counts} onAreas={onAreas} />
    </section>
  );
}

function KeywordField({
  keyword,
  onKeyword,
}: {
  keyword: string;
  onKeyword: (keyword: string) => void;
}) {
  const [draft, setDraft] = useState(keyword);
  const [seenKeyword, setSeenKeyword] = useState(keyword);
  const [lastSent, setLastSent] = useState(keyword);
  const [epoch, setEpoch] = useState(0);
  const epochRef = useRef(epoch);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    epochRef.current = epoch;
  }, [epoch]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (keyword !== seenKeyword) {
    setSeenKeyword(keyword);
    if (keyword !== lastSent) {
      setEpoch((current) => current + 1);
      setLastSent(keyword);
      setDraft(keyword);
    }
  }

  function publish(value: string, delay: number) {
    if (timer.current) clearTimeout(timer.current);
    const scheduledEpoch = epochRef.current;
    timer.current = setTimeout(() => {
      if (epochRef.current !== scheduledEpoch) return;
      setLastSent(value);
      onKeyword(value);
    }, delay);
  }

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        setLastSent(draft);
        onKeyword(draft);
      }}
    >
      <label htmlFor="keyword" className="text-[13px] text-secondary">
        キーワード
      </label>
      <input
        id="keyword"
        type="search"
        value={draft}
        placeholder={keywordPlaceholder}
        onChange={(event) => {
          const value = event.target.value;
          setDraft(value);
          publish(value, 200);
        }}
        className="mt-2 h-9 w-full rounded-md border border-border bg-card px-2 text-sm text-foreground placeholder:text-muted"
      />
    </form>
  );
}

function areaSummary(areas: readonly string[]): string {
  if (areas.length === 0) return "すべて";
  if (areas.length <= 2) return areas.join("、");
  return `${areas[0]} ほか${areas.length - 1}件`;
}

function AreaFilter({
  areas,
  groups,
  counts,
  onAreas,
}: {
  areas: string[];
  groups: AreaGroups;
  counts: Map<string, number>;
  onAreas: (areas: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const sections = [
    { label: "23区", names: groups.wards },
    { label: "市", names: groups.cities },
    { label: "県", names: groups.prefectures },
    { label: "その他", names: groups.other },
  ].filter((section) => section.names.length > 0);
  const allSelected = areas.length === 0;

  function clearAreas() {
    if (!allSelected) onAreas([]);
  }

  return (
    <fieldset className="mt-4">
      <legend className="text-[13px] text-secondary">エリア</legend>
      <div className="mt-2 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-2 text-left text-sm"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="min-w-0 truncate">
            <span className="sr-only">エリアを選択：</span>
            {areaSummary(areas)}
          </span>
          <svg
            viewBox="0 0 16 16"
            className={cn("size-4 shrink-0 text-secondary", open && "-scale-y-100")}
            aria-hidden="true"
          >
            <path
              d="M3.5 6 8 10.5 12.5 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          id={listId}
          hidden={!open}
          className="mt-2 max-h-72 overflow-y-auto rounded-md border border-border p-2 contain-paint"
        >
          <AreaChip name="すべて" count={null} pressed={allSelected} onToggle={clearAreas} />
          {sections.map((section) => (
            <AreaChipGroup
              key={section.label}
              label={section.label}
              names={section.names}
              areas={areas}
              counts={counts}
              onToggle={(name) => onAreas(toggleArea(areas, name))}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 hidden h-80 overflow-y-auto contain-paint lg:block">
        <AreaOption name="すべて" count={null} checked={allSelected} onToggle={clearAreas} />
        {sections.map((section) => (
          <div key={section.label} className="mt-2">
            <p className="px-2 py-1 text-[12px] text-muted">{section.label}</p>
            {section.names.map((name) => (
              <AreaOption
                key={name}
                name={name}
                count={counts.get(name) ?? 0}
                checked={areas.includes(name)}
                onToggle={() => onAreas(toggleArea(areas, name))}
              />
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function AreaChipGroup({
  label,
  names,
  areas,
  counts,
  onToggle,
}: {
  label: string;
  names: string[];
  areas: string[];
  counts: Map<string, number>;
  onToggle: (name: string) => void;
}) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="mt-2">
      <p id={labelId} className="py-1 text-[12px] text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {names.map((name) => (
          <AreaChip
            key={name}
            name={name}
            count={counts.get(name) ?? 0}
            pressed={areas.includes(name)}
            onToggle={() => onToggle(name)}
          />
        ))}
      </div>
    </div>
  );
}

function AreaChip({
  name,
  count,
  pressed,
  onToggle,
}: {
  name: string;
  count: number | null;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "rounded-md border px-2 py-1 text-[13px]",
        pressed && "border-primary bg-primary text-white",
        !pressed && count === 0 && "border-border bg-card text-muted hover:bg-surface",
        !pressed && count !== 0 && "border-border bg-card text-foreground hover:bg-surface"
      )}
      onClick={onToggle}
    >
      {name}
      {count !== null ? <span className="tabular-nums">（{count}）</span> : null}
    </button>
  );
}

function AreaOption({
  name,
  count,
  checked,
  onToggle,
}: {
  name: string;
  count: number | null;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
        checked && "bg-primary-soft font-medium text-primary",
        !checked && count === 0 && "text-muted hover:bg-surface",
        !checked && count !== 0 && "text-foreground hover:bg-surface"
      )}
    >
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          name="area"
          className="sr-only"
          value={name}
          checked={checked}
          onChange={onToggle}
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
            checked ? "border-primary bg-primary text-white" : "border-border bg-card"
          )}
        >
          {checked ? (
            <svg viewBox="0 0 16 16" className="size-3">
              <path
                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        {name}
      </span>
      {count !== null ? <span className="text-[12px] text-muted tabular-nums">{count}</span> : null}
    </label>
  );
}
