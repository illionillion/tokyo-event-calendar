import { describe, expect, it } from "vitest";
import { buildDailyEventData } from "@/lib/event-data";
import {
  ENDED_EVENT_RETENTION_MONTHS,
  endedEventRetentionDeadlineMs,
  eventEndMs,
  eventOverlapsTargetMonths,
  eventYearMonth,
  isPastEndedRetention,
  mergeRetainedSnapshotEvents,
  omitEventsEndedBeyondRetention,
} from "@/lib/event-retention";
import { materializeEvents } from "@/lib/events";
import { snapshotEvent } from "@/lib/connpass.fixtures";

const NOW = new Date("2026-11-11T12:00:00+09:00");
const TARGET_MONTHS = ["202611", "202612", "202701"];

describe("終了から 3 か月を超えたイベントの除去", () => {
  it("保持は日本時間の暦で 3 か月で、ちょうど 3 か月は残し、1 ミリ秒超えたら除く", () => {
    expect(ENDED_EVENT_RETENTION_MONTHS).toBe(3);
    const exactEnd = "2026-08-11T12:00:00+09:00";
    expect(endedEventRetentionDeadlineMs(Date.parse(exactEnd))).toBe(NOW.getTime());

    const exact = snapshotEvent({
      id: 1,
      started_at: "2026-08-11T10:00:00+09:00",
      ended_at: exactEnd,
    });
    const justOver = snapshotEvent({
      id: 2,
      started_at: "2026-08-11T10:00:00+09:00",
      ended_at: new Date(Date.parse(exactEnd) - 1).toISOString(),
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

  it("末日が無い月は、日本時間の末日に合わせる", () => {
    const end = Date.parse("2026-11-30T21:00:00+09:00");
    expect(endedEventRetentionDeadlineMs(end)).toBe(Date.parse("2027-02-28T21:00:00+09:00"));
    expect(
      isPastEndedRetention(
        snapshotEvent({
          id: 1,
          started_at: "2026-11-30T19:00:00+09:00",
          ended_at: "2026-11-30T21:00:00+09:00",
        }),
        new Date("2027-02-28T21:00:00+09:00")
      )
    ).toBe(false);
    expect(
      isPastEndedRetention(
        snapshotEvent({
          id: 1,
          started_at: "2026-11-30T19:00:00+09:00",
          ended_at: "2026-11-30T21:00:00+09:00",
        }),
        new Date("2027-02-28T21:00:00.001+09:00")
      )
    ).toBe(true);
  });

  it("終了時刻が無いときは開始時刻を終了として除く", () => {
    const endedByStart = snapshotEvent({
      id: 1,
      started_at: "2026-08-01T19:00:00+09:00",
      ended_at: null,
    });
    const stillRecent = snapshotEvent({
      id: 2,
      started_at: "2026-11-10T19:00:00+09:00",
      ended_at: null,
    });

    expect(eventEndMs(endedByStart)).toBe(Date.parse("2026-08-01T19:00:00+09:00"));
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
        started_at: "2026-08-01T19:00:00+09:00",
        ended_at: "2026-08-01T21:00:00+09:00",
      }),
      snapshotEvent({
        id: 2,
        title: "3か月以内に終了",
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

describe("既存スナップショットからの引き継ぎ", () => {
  it("開始と終了の日本時間の年月を yyyymm で返す", () => {
    expect(eventYearMonth("2026-10-31T23:30:00+09:00")).toBe("202610");
    expect(eventYearMonth("2026-10-31T15:30:00Z")).toBe("202611");
    expect(eventYearMonth(null)).toBeNull();
    expect(eventYearMonth("not-a-date")).toBeNull();
  });

  it("取得対象月に入るイベントは引き継がず、窓の外で 3 か月以内なら残す", () => {
    const fetched = snapshotEvent({
      id: 1,
      title: "今回の取得",
      started_at: "2026-11-20T19:00:00+09:00",
      ended_at: "2026-11-20T21:00:00+09:00",
    });
    const updated = snapshotEvent({
      id: 2,
      title: "更新後",
      started_at: "2026-11-05T19:00:00+09:00",
      ended_at: "2026-11-05T21:00:00+09:00",
    });
    const previousInWindow = snapshotEvent({
      id: 2,
      title: "更新前",
      started_at: "2026-11-05T19:00:00+09:00",
      ended_at: "2026-11-05T21:00:00+09:00",
    });
    const missingInWindow = snapshotEvent({
      id: 3,
      title: "窓の中だが取得されなかった",
      started_at: "2026-11-02T19:00:00+09:00",
      ended_at: "2026-11-02T21:00:00+09:00",
    });
    const carried = snapshotEvent({
      id: 4,
      title: "窓の外で残す",
      started_at: "2026-10-20T19:00:00+09:00",
      ended_at: "2026-10-20T21:00:00+09:00",
    });
    const expired = snapshotEvent({
      id: 5,
      title: "3か月を超えた",
      started_at: "2026-08-01T19:00:00+09:00",
      ended_at: "2026-08-01T21:00:00+09:00",
    });
    const fetchedExpired = snapshotEvent({
      id: 6,
      title: "取得分だが期限切れ",
      started_at: "2026-08-10T19:00:00+09:00",
      ended_at: "2026-08-10T21:00:00+09:00",
    });

    expect(eventOverlapsTargetMonths(previousInWindow, TARGET_MONTHS)).toBe(true);
    expect(eventOverlapsTargetMonths(carried, TARGET_MONTHS)).toBe(false);

    const merged = mergeRetainedSnapshotEvents(
      [fetched, updated, fetchedExpired],
      [previousInWindow, missingInWindow, carried, expired],
      NOW,
      TARGET_MONTHS
    );

    expect(merged.map((event) => event.id)).toEqual([1, 2, 4]);
    expect(merged.find((event) => event.id === 2)?.title).toBe("更新後");
  });
});
