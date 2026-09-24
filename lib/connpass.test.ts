import { describe, expect, it } from "vitest";
import { areaFromAddress, formatFromConnpass, toCalendarEvent } from "@/lib/connpass";
import type { ConnpassEvent } from "@/lib/types";

function connpassEvent(overrides: Partial<ConnpassEvent> = {}): ConnpassEvent {
  return {
    id: 1,
    title: "勉強会",
    catch: null,
    description: null,
    url: "https://connpass.com/event/1/",
    image_url: null,
    hash_tag: "golang",
    started_at: "2026-09-24T19:00:00+09:00",
    ended_at: "2026-09-24T21:00:00+09:00",
    published_at: "2026-09-01T10:00:00+09:00",
    limit: 40,
    event_type: "participation",
    open_status: "open",
    group: null,
    address: "東京都渋谷区渋谷2-21-1",
    place: "渋谷ヒカリエ",
    lat: null,
    lon: null,
    owner_id: 8,
    owner_nickname: "haru",
    owner_display_name: "佐藤 治",
    accepted: 10,
    waiting: 0,
    updated_at: "2026-09-20T12:00:00+09:00",
    ...overrides,
  };
}

describe("connpass", () => {
  it("住所から区・市を取る", () => {
    expect(areaFromAddress("東京都北区赤羽1-1-1")).toBe("北区");
    expect(areaFromAddress("東京都豊島区西池袋1-1-1")).toBe("豊島区");
    expect(areaFromAddress("神奈川県横浜市西区みなとみらい2-3-5")).toBe("神奈川県");
    expect(areaFromAddress("神奈川県川崎市川崎区駅前本町26-2")).toBe("神奈川県");
    expect(areaFromAddress("埼玉県さいたま市北区宮原町1-1-1")).toBe("埼玉県");
    expect(areaFromAddress("千葉県千葉市中央区中央1-1-1")).toBe("千葉県");
    expect(areaFromAddress(null)).toBe("");
  });

  it("住所とキャッチから開催形態を決める", () => {
    expect(formatFromConnpass(connpassEvent({ address: null, place: "オンライン" }))).toBe(
      "online"
    );
    expect(formatFromConnpass(connpassEvent({ address: "オンライン", place: null }))).toBe(
      "online"
    );
    expect(formatFromConnpass(connpassEvent({ catch: "会場とオンラインの併用です" }))).toBe(
      "hybrid"
    );
    expect(formatFromConnpass(connpassEvent())).toBe("offline");
  });

  it("API のイベントを画面用に変換する", () => {
    const event = toCalendarEvent(connpassEvent(), 1);

    expect(event).toMatchObject({
      id: "1",
      date: "2026-09-25",
      start: "19:00",
      end: "21:00",
      area: "渋谷区",
      venueName: "渋谷ヒカリエ",
      tags: ["golang"],
      url: "https://connpass.com/event/1/",
    });
  });
});
