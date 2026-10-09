import { describe, expect, it } from "vitest";
import { groupAreas } from "@/lib/areas";
import type { Event } from "@/lib/types";

function event(area: string): Event {
  return {
    id: area,
    title: area,
    catch: null,
    description: null,
    date: "2026-10-10",
    start: "19:00",
    end: "21:00",
    startedAt: "2026-10-10T19:00:00+09:00",
    endedAt: "2026-10-10T21:00:00+09:00",
    format: "offline",
    area,
    venueName: "",
    address: "",
    tags: [],
    imageUrl: null,
    accepted: 0,
    limit: null,
    url: "https://connpass.com/event/1/",
  };
}

describe("groupAreas", () => {
  it("神奈川県・埼玉県・千葉県はイベントがなくても県として選べる", () => {
    const groups = groupAreas([event("渋谷区"), event("八王子市")], null);

    expect(groups.wards).toEqual(["渋谷区"]);
    expect(groups.cities).toEqual(["八王子市"]);
    expect(groups.prefectures).toEqual(["神奈川県", "埼玉県", "千葉県"]);
    expect(groups.other).toEqual([]);
  });

  it("東京都の市はどの市も「市」に並べ、その他には入れない", () => {
    const groups = groupAreas([event("東大和市"), event("小金井市"), event("八王子市")], null);

    expect(groups.cities).toEqual(["八王子市", "小金井市", "東大和市"]);
    expect(groups.other).toEqual([]);
  });

  it("県名は市町村に分けず、その他にも入れない", () => {
    const groups = groupAreas([event("千葉県"), event("神奈川県")], "埼玉県");

    expect(groups.prefectures).toEqual(["神奈川県", "埼玉県", "千葉県"]);
    expect(groups.other).toEqual([]);
  });
});
