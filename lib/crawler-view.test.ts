import { describe, expect, it } from "vitest";
import { buildCrawlerView } from "@/lib/crawler-view";
import type { EventSummary, Filters } from "@/lib/types";

function summary(id: string, date: string, extra: Partial<EventSummary> = {}): EventSummary {
  return {
    id,
    title: `イベント${id}`,
    date,
    start: "19:00",
    end: "21:00",
    format: "offline",
    area: "渋谷区",
    venueName: "会場",
    url: `https://connpass.com/event/${id}/`,
    cancelled: false,
    ...extra,
  };
}

const filters = (partial: Partial<Filters> = {}): Filters => ({
  date: "2026-09-24",
  areas: [],
  format: "all",
  keyword: "",
  view: "month",
  ...partial,
});

describe("buildCrawlerView", () => {
  const events = [
    summary("1", "2026-09-24"),
    summary("2", "2026-09-25", { area: "港区", cancelled: true }),
    summary("3", "2026-09-24", { format: "online", title: "React LT" }),
  ];

  it("月表示は選んだ日のイベントだけを出す", () => {
    const view = buildCrawlerView(events, filters());
    expect(view.days).toHaveLength(1);
    expect(view.days[0]?.events.map((event) => event.id)).toEqual(["1", "3"]);
    expect(view.previous).toBeNull();
    expect(view.next).toBe("2026-09-25");
  });

  it("範囲の中の空の日は通り、外の日へはリンクしない", () => {
    const spanned = [summary("1", "2026-09-20"), summary("2", "2026-09-26", { area: "港区" })];
    const view = buildCrawlerView(spanned, filters());
    expect(view.days[0]?.events).toEqual([]);
    expect(view.previous).toBe("2026-09-23");
    expect(view.next).toBe("2026-09-25");
    expect(buildCrawlerView(spanned, filters({ date: "2026-09-20" })).previous).toBeNull();
    expect(buildCrawlerView(spanned, filters({ date: "2026-09-26" })).next).toBeNull();
  });

  it("週表示は 7 日分を出し、中止も残す", () => {
    const view = buildCrawlerView(events, filters({ view: "week" }));
    expect(view.days).toHaveLength(7);
    expect(view.days.map((day) => day.date)).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
    ]);
    expect(view.days[5]?.events[0]).toMatchObject({ id: "2", cancelled: true });
    expect(view.previous).toBeNull();
    expect(view.next).toBeNull();
  });

  it("週の端でも、イベントがある隣の週へはリンクする", () => {
    const boundary = [summary("1", "2026-09-24"), summary("2", "2026-09-28")];
    const first = buildCrawlerView(boundary, filters({ view: "week" }));
    expect(first.previous).toBeNull();
    expect(first.next).toBe("2026-09-28");

    const second = buildCrawlerView(boundary, filters({ date: "2026-09-28", view: "week" }));
    expect(second.days.map((day) => day.date)).toContain("2026-09-28");
    expect(second.days.find((day) => day.date === "2026-09-28")?.events).toHaveLength(1);
    expect(second.previous).toBe("2026-09-24");
    expect(second.next).toBeNull();

    const back = buildCrawlerView(boundary, filters({ date: "2026-09-24", view: "week" }));
    expect(
      back.days.find((day) => day.date === "2026-09-24")?.events.map((event) => event.id)
    ).toEqual(["1"]);
  });

  it("範囲の外からは、近づく端へだけリンクする", () => {
    const coverage = [summary("1", "2026-10-20"), summary("2", "2026-10-22")];
    const before = buildCrawlerView(coverage, filters({ date: "2026-10-17" }));
    expect(before.previous).toBeNull();
    expect(before.next).toBe("2026-10-20");
    const after = buildCrawlerView(coverage, filters({ date: "2026-10-25" }));
    expect(after.previous).toBe("2026-10-22");
    expect(after.next).toBeNull();

    const weekBefore = buildCrawlerView(coverage, filters({ date: "2026-10-03", view: "week" }));
    expect(weekBefore.previous).toBeNull();
    expect(weekBefore.next).toBe("2026-10-20");
    const weekAfter = buildCrawlerView(coverage, filters({ date: "2026-11-07", view: "week" }));
    expect(weekAfter.previous).toBe("2026-10-22");
    expect(weekAfter.next).toBeNull();
  });

  it("エリア・開催形態・キーワードで絞る", () => {
    expect(buildCrawlerView(events, filters({ areas: ["港区"] })).days[0]?.events).toEqual([]);
    expect(
      buildCrawlerView(events, filters({ format: "online" })).days[0]?.events.map((e) => e.id)
    ).toEqual(["3"]);
    expect(
      buildCrawlerView(events, filters({ keyword: "React" })).days[0]?.events.map((e) => e.id)
    ).toEqual(["3"]);
  });
});
