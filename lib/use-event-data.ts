"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventIndex } from "@/lib/event-data";
import { loadDayEvents, loadEventIndex, loadEventSummaries } from "@/lib/event-data-client";
import type { Event, EventSummary } from "@/lib/types";

export type EventDataState = {
  /** 取り終えた日のイベント（全項目）。 */
  events: Event[];
  /** 全イベントの軽い一覧。取り終えるまでは null。 */
  summaries: EventSummary[] | null;
  /** required の日をすべて取り終えたか。 */
  ready: boolean;
  error: string | null;
  retry: () => void;
};

/**
 * 表示に要る日（required）と、あれば先に取っておく日（optional）のイベントを静的ファイルから読む。
 * enabled が false のときは何も取りにいかない（イベントを props で渡すテスト用）。
 */
export function useEventData(
  enabled: boolean,
  required: readonly string[],
  optional: readonly string[] = []
): EventDataState {
  const [index, setIndex] = useState<EventIndex | null>(null);
  const [summaries, setSummaries] = useState<EventSummary[] | null>(null);
  const [days, setDays] = useState<ReadonlyMap<string, Event[]>>(() => new Map());
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    Promise.all([loadEventIndex(), loadEventSummaries()]).then(
      ([nextIndex, nextSummaries]) => {
        if (!active) return;
        setIndex(nextIndex);
        setSummaries(nextSummaries);
      },
      (reason: unknown) => {
        if (active) setError(errorMessage(reason));
      }
    );
    return () => {
      active = false;
    };
  }, [enabled, attempt]);

  const requiredKey = required.join(",");
  const optionalKey = optional.join(",");

  useEffect(() => {
    if (!enabled || !index) return;
    let active = true;
    const load = (dates: string[], reportError: boolean) => {
      for (const date of dates) {
        loadDayEvents(date, index).then(
          (list) => {
            if (!active) return;
            setDays((current) => {
              if (current.get(date) === list) return current;
              const next = new Map(current);
              next.set(date, list);
              return next;
            });
          },
          (reason: unknown) => {
            if (active && reportError) setError(errorMessage(reason));
          }
        );
      }
    };
    load(requiredKey ? requiredKey.split(",") : [], true);
    load(optionalKey ? optionalKey.split(",") : [], false);
    return () => {
      active = false;
    };
  }, [enabled, index, requiredKey, optionalKey, attempt]);

  const events = useMemo(() => [...days.values()].flat(), [days]);
  const ready = required.every((date) => days.has(date));
  const retry = useCallback(() => {
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { events, summaries, ready, error: ready ? null : error, retry };
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : "イベントデータを読み込めませんでした";
}
