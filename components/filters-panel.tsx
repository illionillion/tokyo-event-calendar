"use client";

import { useEffect, useRef, useState } from "react";
import type { AreaGroups } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { formatLabel, hasActiveFilters } from "@/lib/filters";
import type { Filters, FormatFilter } from "@/lib/types";

const FORMAT_OPTIONS: FormatFilter[] = ["all", "online", "offline"];

type FiltersPanelProps = {
  keywordResetKey: number;
  filters: Filters;
  groups: AreaGroups;
  counts: Map<string, number>;
  onFormat: (format: FormatFilter) => void;
  onArea: (area: string | null) => void;
  onKeyword: (keyword: string) => void;
  onClear: () => void;
};

export function FiltersPanel({
  keywordResetKey,
  filters,
  groups,
  counts,
  onFormat,
  onArea,
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

      <AreaFilter filters={filters} groups={groups} counts={counts} onArea={onArea} />
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
        placeholder="React, LT, 渋谷"
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

function AreaFilter({
  filters,
  groups,
  counts,
  onArea,
}: {
  filters: Filters;
  groups: AreaGroups;
  counts: Map<string, number>;
  onArea: (area: string | null) => void;
}) {
  const sections = [
    { label: "23区", names: groups.wards },
    { label: "市", names: groups.cities },
    { label: "県", names: groups.prefectures },
    { label: "その他", names: groups.other },
  ].filter((section) => section.names.length > 0);

  return (
    <fieldset className="mt-4">
      <legend className="text-[13px] text-secondary">エリア</legend>
      <label className="mt-2 block lg:hidden">
        <span className="sr-only">エリアを選択</span>
        <select
          aria-label="エリアを選択"
          className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm"
          value={filters.area ?? ""}
          onChange={(event) => onArea(event.target.value || null)}
        >
          <option value="">すべて</option>
          {sections.map((section) => (
            <optgroup key={section.label} label={section.label}>
              {section.names.map((name) => (
                <option key={name} value={name}>
                  {name}（{counts.get(name) ?? 0}）
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="mt-2 hidden max-h-80 overflow-y-auto lg:block">
        <AreaOption
          name="すべて"
          count={null}
          checked={filters.area === null}
          onSelect={() => onArea(null)}
        />
        {sections.map((section) => (
          <div key={section.label} className="mt-2">
            <p className="px-2 py-1 text-[12px] text-muted">{section.label}</p>
            {section.names.map((name) => (
              <AreaOption
                key={name}
                name={name}
                count={counts.get(name) ?? 0}
                checked={filters.area === name}
                onSelect={() => onArea(name)}
              />
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function AreaOption({
  name,
  count,
  checked,
  onSelect,
}: {
  name: string;
  count: number | null;
  checked: boolean;
  onSelect: () => void;
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
          type="radio"
          name="area"
          className="sr-only"
          value={name}
          checked={checked}
          onChange={onSelect}
        />
        {name}
      </span>
      {count !== null ? <span className="text-[12px] text-muted tabular-nums">{count}</span> : null}
    </label>
  );
}
