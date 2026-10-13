import { describe, expect, it } from "vitest";
import { formatWeekRange, weekDates } from "@/lib/week";

const week = weekDates("2026-10-14");

describe("week", () => {
  it("週は日曜始まりで、範囲の表記は月・年をまたぐと補う", () => {
    expect(week).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
    expect(weekDates("2026-10-11")[0]).toBe("2026-10-11");
    expect(weekDates("2026-10-17")[0]).toBe("2026-10-11");
    expect(formatWeekRange(week)).toBe("2026年10月11日〜17日");
    expect(formatWeekRange(weekDates("2026-11-01"))).toBe("2026年11月1日〜7日");
    expect(formatWeekRange(weekDates("2026-09-30"))).toBe("2026年9月27日〜10月3日");
    expect(formatWeekRange(weekDates("2026-12-31"))).toBe("2026年12月27日〜2027年1月2日");
  });
});
