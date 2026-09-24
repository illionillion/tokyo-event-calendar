import { describe, expect, it } from "vitest";
import {
  countByArea,
  filterEvents,
  formatPlace,
  matchesFormat,
  matchesKeyword,
} from "@/lib/filters";
import type { Event, Filters } from "@/lib/types";

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: "1",
    title: "React LT Night",
    catch: null,
    description: null,
    date: "2026-09-24",
    start: "19:00",
    end: "21:00",
    startedAt: "2026-09-24T19:00:00+09:00",
    endedAt: "2026-09-24T21:00:00+09:00",
    format: "offline",
    area: "渋谷区",
    venueName: "渋谷ヒカリエ",
    address: "東京都渋谷区渋谷2-21-1",
    tags: ["React", "LT"],
    accepted: 10,
    limit: 20,
    url: "https://connpass.com/event/1/",
    ...overrides,
  };
}

const baseFilters: Filters = {
  date: "2026-09-24",
  area: null,
  format: "all",
  keyword: "",
};

describe("filters", () => {
  it("日付・エリア・開催形態・キーワードを同時に適用する", () => {
    const events = [
      event(),
      event({
        id: "2",
        title: "生成AI勉強会",
        format: "hybrid",
        area: "千代田区",
        tags: ["AI"],
        startedAt: "2026-09-24T18:00:00+09:00",
      }),
      event({
        id: "3",
        title: "Go night",
        format: "online",
        area: "",
        tags: ["Go"],
        startedAt: "2026-09-24T20:00:00+09:00",
      }),
      event({ id: "4", title: "別の日", date: "2026-09-25" }),
    ];

    expect(
      filterEvents(events, {
        ...baseFilters,
        area: "渋谷区",
        format: "offline",
        keyword: "react lt",
      }).map((item) => item.id)
    ).toEqual(["1"]);
  });

  it("ハイブリッドはオンラインとオフラインの両方に含める", () => {
    const hybrid = event({ format: "hybrid" });
    expect(matchesFormat(hybrid, "online")).toBe(true);
    expect(matchesFormat(hybrid, "offline")).toBe(true);
    expect(matchesFormat(event({ format: "online" }), "offline")).toBe(false);
  });

  it("全角英数とタグを検索できる", () => {
    expect(matchesKeyword(event(), "Ｒｅａｃｔ")).toBe(true);
    expect(matchesKeyword(event(), "赤羽")).toBe(false);
    expect(matchesKeyword(event({ address: "東京都北区赤羽1-1-1", area: "北区" }), "赤羽")).toBe(
      true
    );
  });

  it("エリア件数は選択中のエリア以外の条件で数える", () => {
    const events = [
      event(),
      event({ id: "2", area: "北区", title: "Python", tags: ["Python"] }),
      event({ id: "3", area: "渋谷区", format: "online", title: "Online React", tags: ["React"] }),
    ];
    const counts = countByArea(events, { ...baseFilters, keyword: "React" });
    expect(counts.get("渋谷区")).toBe(2);
    expect(counts.get("北区")).toBeUndefined();
  });

  it("開催場所の表示は住所の区を優先する", () => {
    expect(formatPlace(event())).toBe("渋谷区");
    expect(formatPlace(event({ format: "online", area: "" }))).toBe("オンライン");
    expect(formatPlace(event({ format: "hybrid" }))).toBe("渋谷区（オンライン併用）");
  });
});
