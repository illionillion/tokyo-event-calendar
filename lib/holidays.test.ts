import { describe, expect, it } from "vitest";
import { dayKind, dayKindTextClass, holidayName } from "@/lib/holidays";

function holidaysIn(year: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= 31; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const name = holidayName(date);
      if (name) result[date] = name;
    }
  }
  return result;
}

describe("holidays", () => {
  it("2026 年の祝日を内閣府の一覧どおりに返す", () => {
    expect(holidaysIn(2026)).toEqual({
      "2026-01-01": "元日",
      "2026-01-12": "成人の日",
      "2026-02-11": "建国記念の日",
      "2026-02-23": "天皇誕生日",
      "2026-03-20": "春分の日",
      "2026-04-29": "昭和の日",
      "2026-05-03": "憲法記念日",
      "2026-05-04": "みどりの日",
      "2026-05-05": "こどもの日",
      "2026-05-06": "振替休日",
      "2026-07-20": "海の日",
      "2026-08-11": "山の日",
      "2026-09-21": "敬老の日",
      "2026-09-22": "国民の休日",
      "2026-09-23": "秋分の日",
      "2026-10-12": "スポーツの日",
      "2026-11-03": "文化の日",
      "2026-11-23": "勤労感謝の日",
    });
  });

  it("日曜の祝日の翌日（祝日なら更にその先）を振替休日にする", () => {
    // 2025-02-23（日）天皇誕生日 → 24 日
    expect(holidayName("2025-02-24")).toBe("振替休日");
    // 2024-11-03（日）文化の日 → 4 日
    expect(holidayName("2024-11-04")).toBe("振替休日");
    // 2025-05-04（日）みどりの日 → 5 日はこどもの日なので 6 日
    expect(holidayName("2025-05-05")).toBe("こどもの日");
    expect(holidayName("2025-05-06")).toBe("振替休日");
    // 2027-03-21（日）春分の日 → 22 日
    expect(holidayName("2027-03-22")).toBe("振替休日");
    // 土曜の祝日には振替休日がない（2023-02-11 は土曜）
    expect(holidayName("2023-02-11")).toBe("建国記念の日");
    expect(holidayName("2023-02-13")).toBeNull();
  });

  it("祝日に挟まれた日を国民の休日にする", () => {
    expect(holidayName("2026-09-22")).toBe("国民の休日");
    expect(holidayName("2032-09-21")).toBe("国民の休日");
    expect(holidayName("2025-09-22")).toBeNull();
  });

  it("2020・2021 年の移動した祝日と、春分・秋分の日を返す", () => {
    expect(holidayName("2020-07-24")).toBe("スポーツの日");
    expect(holidayName("2020-10-12")).toBeNull();
    expect(holidayName("2021-08-08")).toBe("山の日");
    expect(holidayName("2021-08-09")).toBe("振替休日");
    expect(holidayName("2024-03-20")).toBe("春分の日");
    expect(holidayName("2024-09-22")).toBe("秋分の日");
    expect(holidayName("2024-09-23")).toBe("振替休日");
  });

  it("対象外の年と不正な日付は祝日なしにする", () => {
    expect(holidayName("2019-05-01")).toBeNull();
    expect(holidayName("2100-01-01")).toBeNull();
    expect(holidayName("2026-02-31")).toBeNull();
  });

  it("色分けは祝日を曜日より優先する", () => {
    expect(dayKind("2026-10-10")).toBe("saturday");
    expect(dayKind("2026-10-11")).toBe("sunday");
    expect(dayKind("2026-10-12")).toBe("holiday");
    expect(dayKind("2026-10-13")).toBe("weekday");
    // 土曜の祝日は青ではなく赤
    expect(dayKind("2025-05-03")).toBe("holiday");
    expect(dayKindTextClass("saturday")).toBe("text-saturday");
    expect(dayKindTextClass("sunday")).toBe("text-holiday");
    expect(dayKindTextClass("holiday")).toBe("text-holiday");
    expect(dayKindTextClass("weekday")).toBe("");
  });
});
