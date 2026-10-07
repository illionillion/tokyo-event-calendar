import { describe, expect, it } from "vitest";
import { materializeEvents } from "@/lib/events";
import type { ConnpassEvent } from "@/lib/types";

function anchoredEvent(overrides: Partial<ConnpassEvent> = {}): ConnpassEvent {
  return {
    id: 1,
    title: "基準日の確認",
    catch: null,
    description: null,
    url: "https://connpass.com/event/1/",
    image_url: null,
    hash_tag: null,
    started_at: "2026-09-24T19:00:00+09:00",
    ended_at: "2026-09-24T21:00:00+09:00",
    published_at: null,
    limit: 10,
    event_type: "participation",
    open_status: "open",
    group: null,
    address: "東京都渋谷区渋谷2-21-1",
    place: "渋谷ヒカリエ",
    lat: null,
    lon: null,
    owner_id: null,
    owner_nickname: "haru",
    owner_display_name: "佐藤 治",
    accepted: 1,
    waiting: 0,
    updated_at: "2026-09-24T12:00:00+09:00",
    ...overrides,
  };
}

describe("events", () => {
  it("公開カレンダーの開催日をそのまま読み込む", () => {
    const events = materializeEvents("2026-10-07");
    const sample = events.find((event) => event.id === "405236");

    expect(events.length).toBeGreaterThan(100);
    expect(events.some((event) => event.date < "2026-10-07")).toBe(true);
    expect(events.some((event) => event.date > "2026-10-07")).toBe(true);
    expect(events.some((event) => event.area === "渋谷区")).toBe(true);
    expect(events.some((event) => event.area === "神奈川県")).toBe(true);
    expect(events.some((event) => event.area === "埼玉県")).toBe(true);
    expect(events.some((event) => event.area === "千葉県")).toBe(true);
    expect(sample).toMatchObject({
      title: "やっぱり人間が頑張（や）らナイト！AI時代を生き抜くヤバイ人間力LT会",
      date: "2026-10-01",
      start: "18:00",
      area: "港区",
      url: "https://livesense.connpass.com/event/405236/",
    });
  });

  it("基準日を渡したときだけ開催日をずらす", () => {
    const events = materializeEvents("2026-09-25", [anchoredEvent()], "2026-09-24");

    expect(events[0]).toMatchObject({ date: "2026-09-25", start: "19:00" });
  });

  it("基準を渡さないときは渡した開催日をそのまま使う", () => {
    const events = materializeEvents("2026-10-01", [anchoredEvent()], null);

    expect(events[0]?.date).toBe("2026-09-24");
  });

  it("同じスナップショットの変換結果を再利用する", () => {
    const records = [anchoredEvent({ description: "<p>本文です</p>" })];
    const first = materializeEvents("2026-10-07", records, null);
    const second = materializeEvents("2026-10-08", records, null);

    expect(second).toBe(first);
    expect(first[0]?.description).toBe("本文です");

    const shifted = materializeEvents("2026-09-25", records, "2026-09-24");
    expect(shifted).not.toBe(first);
    expect(shifted[0]).toMatchObject({ date: "2026-09-25", description: "本文です" });
  });

  it("公開スナップショットは日付が違っても変換し直さない", () => {
    const first = materializeEvents("2026-10-07");
    const second = materializeEvents("2026-10-08");
    const sample = first.find((event) => event.id === "405236");

    expect(second).toBe(first);
    expect(sample?.description).toContain("ヤバい武器");
    expect(sample?.description).not.toContain("<p>");
    expect(sample?.description).not.toContain("<h1>");
    expect(sample?.description).not.toContain("<a ");
  });
});
