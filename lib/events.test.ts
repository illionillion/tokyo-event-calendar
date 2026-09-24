import { describe, expect, it } from "vitest";
import { materializeEvents } from "@/lib/events";

describe("events", () => {
  it("今日を基準にモックイベントの日付を決める", () => {
    const events = materializeEvents("2026-09-24");
    const reactNight = events.find((event) => event.title === "React LT Night Tokyo");
    const python = events.find((event) => event.title === "初心者歓迎 Python 入門");

    expect(events.length).toBeGreaterThan(40);
    expect(reactNight).toMatchObject({
      date: "2026-09-24",
      area: "渋谷区",
      url: "https://connpass.com/event/390004/",
    });
    expect(python).toMatchObject({
      date: "2026-09-25",
      area: "北区",
      address: "東京都北区赤羽1-1-1",
    });
  });

  it("基準日が今日と違うときは開催日をずらす", () => {
    const events = materializeEvents("2026-09-25");
    const reactNight = events.find((event) => event.title === "React LT Night Tokyo");

    expect(reactNight?.date).toBe("2026-09-25");
    expect(reactNight?.start).toBe("19:00");
  });

  it("基準を渡さないときは JSON の開催日をそのまま使う", () => {
    const events = materializeEvents("2026-10-01", undefined, null);
    const reactNight = events.find((event) => event.title === "React LT Night Tokyo");

    expect(reactNight?.date).toBe("2026-09-24");
  });
});
