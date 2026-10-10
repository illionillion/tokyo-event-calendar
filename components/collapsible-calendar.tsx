"use client";

import { type ComponentProps, useId, useRef, useState } from "react";
import { MiniCalendar } from "@/components/mini-calendar";
import { cn } from "@/lib/cn";

type CollapsibleCalendarProps = ComponentProps<typeof MiniCalendar>;

/**
 * ミニカレンダーを PC では常に、SP では開閉ボタンで開いたときだけ表示する。
 * SP で日付を選ぶか Escape を押すと閉じ、フォーカスを開閉ボタンに戻す。カレンダーは 1 つだけ描画する。
 */
export function CollapsibleCalendar({ onSelectDate, ...props }: CollapsibleCalendarProps) {
  const [open, setOpen] = useState(false);
  const calendarId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  function selectDate(date: string) {
    onSelectDate(date);
    if (!open) return;
    setOpen(false);
    toggleRef.current?.focus();
  }

  return (
    // 開閉ボタンとカレンダーのどちらにフォーカスがあっても Escape で閉じる
    <div
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        toggleRef.current?.focus();
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={calendarId}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-left text-sm text-foreground hover:bg-surface lg:hidden"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-4 text-secondary" aria-hidden="true">
            <rect
              x="2.5"
              y="3.5"
              width="11"
              height="10"
              rx="1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M2.5 6.5h11M5.5 2v3M10.5 2v3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          カレンダーから日付を選ぶ
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
      <div id={calendarId} className={cn("mt-2 lg:mt-0 lg:block", open ? "block" : "hidden")}>
        <MiniCalendar {...props} onSelectDate={selectDate} />
      </div>
    </div>
  );
}
