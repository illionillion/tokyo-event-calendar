import { describe, expect, it } from "vitest";
import { materializeEvents } from "@/lib/events";
import raw from "@/data/events.json";
import { snapshotEvent } from "@/lib/connpass.fixtures";
import type { ConnpassEvent, EventSnapshot, SnapshotEvent } from "@/lib/types";

function anchoredEvent(overrides: Partial<ConnpassEvent> = {}): SnapshotEvent {
  return snapshotEvent({ title: "基準日の確認", description: null, ...overrides });
}

describe("events", () => {
  it("スナップショットはイベント一覧レスポンスの形で、ユーザー情報を持たず画像 URL は残す", () => {
    const snapshot = raw as EventSnapshot;

    expect(Number.isInteger(snapshot.results_returned)).toBe(true);
    expect(Number.isInteger(snapshot.results_available)).toBe(true);
    expect(snapshot.results_start).toBe(1);
    expect(snapshot.events.length).toBe(snapshot.results_returned);
    expect(
      snapshot.events.every(
        (event) => event.image_url === null || typeof event.image_url === "string"
      )
    ).toBe(true);
    expect(snapshot.events.some((event) => typeof event.image_url === "string")).toBe(true);
    expect(snapshot.events.some((event) => "owner_nickname" in event)).toBe(false);
    expect(snapshot.events.some((event) => "owner_display_name" in event)).toBe(false);
    expect(snapshot.events.some((event) => "owner_id" in event)).toBe(false);
  });

  it("スナップショットのイベントを開催日のまま読み込む", () => {
    const records = [
      anchoredEvent({ id: 1, started_at: "2026-10-01T18:00:00+09:00" }),
      anchoredEvent({
        id: 2,
        address: "東京都港区六本木6-10-1",
        started_at: "2026-10-12T19:00:00+09:00",
        ended_at: "2026-10-12T21:00:00+09:00",
      }),
    ];
    const events = materializeEvents("2026-10-07", records, null);

    expect(events.map((event) => event.date)).toEqual(["2026-10-01", "2026-10-12"]);
    expect(events[1]).toMatchObject({
      id: "2",
      start: "19:00",
      area: "港区",
      imageUrl: "https://media.connpass.com/thumbs/00/00/example.png",
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

    expect(second).toBe(first);
    const withStart = (raw as EventSnapshot).events.filter((event) => event.started_at);
    expect(first.map((event) => event.imageUrl)).toEqual(withStart.map((event) => event.image_url));
    expect(first.some((event) => event.imageUrl?.startsWith("https://"))).toBe(true);
    expect(first.some((event) => event.description?.includes("<p>"))).toBe(false);
  });
});
