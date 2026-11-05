import { describe, expect, it, vi } from "vitest";
import { buildQuery, parseFilters, syncFilterUrl } from "@/lib/query";

describe("query", () => {
  it("検索条件をURLと往復できる", () => {
    const filters = {
      date: "2026-09-26",
      areas: ["渋谷区"],
      format: "online" as const,
      keyword: "React",
      view: "month" as const,
    };

    expect(parseFilters(new URLSearchParams(buildQuery(filters)), "2026-09-24")).toEqual(filters);
  });

  it("日付は履歴を積み、キーワードは現在の履歴を置き換える", () => {
    window.history.replaceState(null, "", "/");
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const filters = {
      date: "2026-10-08",
      areas: [],
      format: "all" as const,
      keyword: "",
      view: "month" as const,
    };

    syncFilterUrl(filters, "push");
    syncFilterUrl({ ...filters, keyword: "React" }, "replace");

    expect(pushState).toHaveBeenCalledWith(null, "", "/?date=2026-10-08");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?date=2026-10-08&keyword=React");
    expect(window.location.pathname + window.location.search).toBe(
      "/?date=2026-10-08&keyword=React"
    );
    pushState.mockRestore();
    replaceState.mockRestore();
  });

  it("不正な日付と開催形態は初期値に戻す", () => {
    expect(
      parseFilters({ date: "2026-02-31", format: "hybrid", keyword: "  Go  " }, "2026-09-24")
    ).toEqual({
      date: "2026-09-24",
      areas: [],
      format: "all",
      keyword: "Go",
      view: "month" as const,
    });
  });

  it("複数のエリアは area を繰り返して URL に書き、選んだ順に読み戻す", () => {
    const filters = {
      date: "2026-09-26",
      areas: ["北区", "港区", "神奈川県"],
      format: "all" as const,
      keyword: "",
      view: "month" as const,
    };
    const query = buildQuery(filters);

    expect(query).toBe(
      new URLSearchParams([
        ["date", "2026-09-26"],
        ["area", "北区"],
        ["area", "港区"],
        ["area", "神奈川県"],
      ]).toString()
    );
    expect(parseFilters(new URLSearchParams(query), "2026-09-24")).toEqual(filters);
    expect(
      parseFilters({ date: "2026-09-26", area: ["北区", "港区", "神奈川県"] }, "2026-09-24")
    ).toEqual(filters);
  });

  it("以前の 1 エリアだけの URL もそのまま読める", () => {
    const legacy = `date=2026-09-26&area=${encodeURIComponent("渋谷区")}`;

    expect(parseFilters(new URLSearchParams(legacy), "2026-09-24")).toEqual({
      date: "2026-09-26",
      areas: ["渋谷区"],
      format: "all",
      keyword: "",
      view: "month" as const,
    });
    expect(parseFilters({ date: "2026-09-26", area: "渋谷区" }, "2026-09-24").areas).toEqual([
      "渋谷区",
    ]);
    expect(
      buildQuery({
        date: "2026-09-26",
        areas: ["渋谷区"],
        format: "all",
        keyword: "",
        view: "month",
      })
    ).toBe(legacy);
  });

  it("空のエリアと重複したエリアは捨てる", () => {
    expect(
      parseFilters(new URLSearchParams("area=&area=%20北区%20&area=北区&area=港区"), "2026-09-24")
        .areas
    ).toEqual(["北区", "港区"]);
  });

  it("週表示は view=week で表し、無い・不明な値は月表示（従来の URL）にする", () => {
    const week = {
      date: "2026-10-14",
      areas: ["北区", "港区"],
      format: "all" as const,
      keyword: "",
      view: "week" as const,
    };
    const query = buildQuery(week);

    expect(new URLSearchParams(query).get("view")).toBe("week");
    expect(parseFilters(new URLSearchParams(query), "2026-10-12")).toEqual(week);
    expect(buildQuery({ ...week, view: "month" })).not.toContain("view=");
    expect(parseFilters(new URLSearchParams("date=2026-10-14"), "2026-10-12").view).toBe("month");
    expect(parseFilters(new URLSearchParams("view=day"), "2026-10-12").view).toBe("month");
    expect(parseFilters({ view: ["week", "month"] }, "2026-10-12").view).toBe("week");
  });
});
