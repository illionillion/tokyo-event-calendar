import { describe, expect, it } from "vitest";
import { buildDailyEventData } from "@/lib/event-data";
import {
  ENDED_EVENT_RETENTION_DAYS,
  ENDED_EVENT_RETENTION_MS,
  eventEndMs,
  isPastEndedRetention,
  omitEventsEndedBeyondRetention,
} from "@/lib/event-retention";
import { materializeEvents } from "@/lib/events";
import { snapshotEvent } from "@/lib/connpass.fixtures";

const NOW = new Date("2026-11-11T12:00:00+09:00");

function atRetentionBoundary(offsetMs: number): string {
  return new Date(NOW.getTime() - ENDED_EVENT_RETENTION_MS + offsetMs).toISOString();
}

describe("終了から 7 日を超えたイベントの除去", () => {
  it("保持は 7 日で、ちょうど 7 日は残し、1 ミリ秒超えたら除く", () => {
    expect(ENDED_EVENT_RETENTION_DAYS).toBe(7);
    const exact = snapshotEvent({
      id: 1,
      started_at: "2026-11-04T10:00:00+09:00",
      ended_at: atRetentionBoundary(0),
    });
    const justOver = snapshotEvent({
      id: 2,
      started_at: "2026-11-04T10:00:00+09:00",
      ended_at: atRetentionBoundary(-1),
    });
    const within = snapshotEvent({
      id: 3,
      started_at: "2026-11-10T19:00:00+09:00",
      ended_at: "2026-11-10T21:00:00+09:00",
    });
    const upcoming = snapshotEvent({
      id: 4,
      started_at: "2026-11-20T19:00:00+09:00",
      ended_at: "2026-11-20T21:00:00+09:00",
    });

    expect(isPastEndedRetention(exact, NOW)).toBe(false);
    expect(isPastEndedRetention(justOver, NOW)).toBe(true);
    expect(
      omitEventsEndedBeyondRetention([exact, justOver, within, upcoming], NOW).map(
        (event) => event.id
      )
    ).toEqual([1, 3, 4]);
  });

  it("終了時刻が無いときは開始時刻を終了として除く", () => {
    const endedByStart = snapshotEvent({
      id: 1,
      started_at: "2026-11-01T19:00:00+09:00",
      ended_at: null,
    });
    const stillRecent = snapshotEvent({
      id: 2,
      started_at: "2026-11-10T19:00:00+09:00",
      ended_at: null,
    });

    expect(eventEndMs(endedByStart)).toBe(Date.parse("2026-11-01T19:00:00+09:00"));
    expect(isPastEndedRetention(endedByStart, NOW)).toBe(true);
    expect(isPastEndedRetention(stillRecent, NOW)).toBe(false);
  });

  it("終了時刻も開始時刻も読めないイベントは除かない", () => {
    const blank = snapshotEvent({ id: 1, started_at: null, ended_at: null });
    const broken = snapshotEvent({ id: 2, started_at: "not-a-date", ended_at: null });

    expect(eventEndMs(blank)).toBeNull();
    expect(omitEventsEndedBeyondRetention([blank, broken], NOW).map((event) => event.id)).toEqual([
      1, 2,
    ]);
  });

  it("除いたあとのイベントだけが日別 JSON と軽い一覧に入る", () => {
    const records = [
      snapshotEvent({
        id: 1,
        title: "除去される",
        started_at: "2026-11-01T19:00:00+09:00",
        ended_at: "2026-11-01T21:00:00+09:00",
      }),
      snapshotEvent({
        id: 2,
        title: "7日以内に終了",
        started_at: "2026-11-10T19:00:00+09:00",
        ended_at: "2026-11-10T21:00:00+09:00",
      }),
      snapshotEvent({
        id: 3,
        title: "これから",
        started_at: "2026-11-20T19:00:00+09:00",
        ended_at: "2026-11-20T21:00:00+09:00",
      }),
    ];
    const retained = omitEventsEndedBeyondRetention(records, NOW);
    const events = materializeEvents("2026-11-11", retained, null);
    const { days, lite, index } = buildDailyEventData(events, NOW.toISOString());

    expect(events.map((event) => event.id)).toEqual(["2", "3"]);
    expect([...days.keys()]).toEqual(["2026-11-10", "2026-11-20"]);
    expect(index.dates).toEqual({ "2026-11-10": 1, "2026-11-20": 1 });
    expect(lite.map((event) => event.id)).toEqual(["2", "3"]);
    expect(lite.some((event) => event.title === "除去される")).toBe(false);
  });
});
