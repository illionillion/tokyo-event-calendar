import { describe, expect, it, vi } from "vitest";
import { buildQuery, parseFilters, syncFilterUrl } from "@/lib/query";

describe("query", () => {
  it("検索条件をURLと往復できる", () => {
    const filters = {
      date: "2026-09-26",
      area: "渋谷区",
      format: "online" as const,
      keyword: "React",
    };

    expect(parseFilters(new URLSearchParams(buildQuery(filters)), "2026-09-24")).toEqual(filters);
  });

  it("日付は履歴を積み、キーワードは現在の履歴を置き換える", () => {
    window.history.replaceState(null, "", "/");
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const filters = {
      date: "2026-10-08",
      area: null,
      format: "all" as const,
      keyword: "",
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
      area: null,
      format: "all",
      keyword: "Go",
    });
  });
});
