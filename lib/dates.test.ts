import { describe, expect, it, vi } from "vitest";
import {
  addDays,
  dateInMonth,
  dateWindow,
  formatDayHeading,
  monthGrid,
  monthOptions,
  parseDateKey,
  shiftMonth,
  todayKey,
  weekdayLabel,
} from "@/lib/dates";

describe("dates", () => {
  it("東京の日付を返す", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-24T15:00:00Z"));
    expect(todayKey()).toBe("2026-09-25");
    vi.useRealTimers();
  });

  it("存在しない日付を拒否する", () => {
    expect(parseDateKey("2026-02-31")).toBeNull();
    expect(parseDateKey("09-24")).toBeNull();
  });

  it("日をまたいで加算する", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("月末をはみ出す月移動は日を切り詰める", () => {
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-28");
    expect(dateInMonth("2026-01-31", "2026-02")).toBe("2026-02-28");
  });

  it("選択日を中心に7日返す", () => {
    expect(dateWindow("2026-09-24")).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
    expect(weekdayLabel("2026-09-24")).toBe("木");
    expect(formatDayHeading("2026-09-24")).toBe("9月24日（木）");
  });

  it("日曜始まりの月グリッドを返す", () => {
    const cells = monthGrid(2026, 9);
    expect(cells).toHaveLength(42);
    expect(cells[0]?.date).toBe("2026-08-30");
    expect(cells[2]?.inMonth).toBe(true);
  });

  it("選択月が範囲外でも選択肢に含める", () => {
    const options = monthOptions("2026-09-24", "2028-01-15");
    expect(options.some((option) => option.value === "2028-01")).toBe(true);
  });
});
