import { describe, expect, it } from "vitest";
import { buildQuery, parseFilters } from "@/lib/query";

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
