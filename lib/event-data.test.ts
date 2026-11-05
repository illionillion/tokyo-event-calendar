import { describe, expect, it } from "vitest";
import { buildDailyEventData, dayDataPath, toEventSummary } from "@/lib/event-data";
import type { Event } from "@/lib/types";

function event(id: string, startedAt: string, extra: Partial<Event> = {}): Event {
  return {
    id,
    title: `イベント${id}`,
    catch: null,
    description: `説明${id}`,
    date: startedAt.slice(0, 10),
    start: startedAt.slice(11, 16),
    end: "21:00",
    startedAt,
    endedAt: startedAt,
    format: "offline",
    area: "渋谷区",
    venueName: "会場",
    address: "東京都渋谷区",
    tags: [],
    imageUrl: null,
    accepted: 0,
    limit: null,
    url: `https://connpass.com/event/${id}/`,
    cancelled: false,
    ...extra,
  };
}

describe("buildDailyEventData", () => {
  const events = [
    event("3", "2026-10-02T10:00:00+09:00"),
    event("1", "2026-10-01T19:00:00+09:00", { cancelled: true }),
    event("2", "2026-10-01T09:00:00+09:00"),
  ];

  it("開始日ごとに全項目のまま、開始時刻の順に分ける", () => {
    const { days } = buildDailyEventData(events, "2026-10-01T00:00:00.000Z");
    expect([...days.keys()]).toEqual(["2026-10-01", "2026-10-02"]);
    expect(days.get("2026-10-01")?.map((item) => item.id)).toEqual(["2", "1"]);
    expect(days.get("2026-10-01")?.[1]).toEqual(events[1]);
  });

  it("索引には日ごとの件数を、軽い一覧には説明文を除いた項目を入れる", () => {
    const { index, lite } = buildDailyEventData(events, "2026-10-01T00:00:00.000Z");
    expect(index).toEqual({
      generatedAt: "2026-10-01T00:00:00.000Z",
      dates: { "2026-10-01": 2, "2026-10-02": 1 },
    });
    expect(lite.map((item) => item.id)).toEqual(["2", "1", "3"]);
    expect(lite[1]).toEqual(toEventSummary(events[1]!));
    expect(lite[1]).not.toHaveProperty("description");
    expect(lite[1]).toMatchObject({ cancelled: true, area: "渋谷区", format: "offline" });
  });

  it("日ごとのファイルの URL", () => {
    expect(dayDataPath("2026-10-01")).toBe("/data/events/2026-10-01.json");
  });
});
