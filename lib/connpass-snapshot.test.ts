import { describe, expect, it, vi } from "vitest";
import {
  buildSnapshot,
  eventsSearchUrl,
  fetchConnpassEvents,
  isSnapshotSourceEvent,
  isEventListResponse,
  PAGE_SIZE,
  REQUEST_INTERVAL_MS,
  TARGET_PREFECTURES,
  targetMonths,
  toSnapshotEvent,
} from "@/lib/connpass-snapshot";
import committedSnapshot from "@/data/events.json";
import { connpassEvent, eventListResponse } from "@/lib/connpass.fixtures";
import type { ConnpassEvent } from "@/lib/types";

const TEST_KEY = "test-key";

function page(startId: number, size: number): ConnpassEvent[] {
  return Array.from({ length: size }, (_, index) => connpassEvent({ id: startId + index }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("connpass-snapshot", () => {
  it("日本時間の今月から 3 か月分を yyyymm で返す", () => {
    expect(targetMonths(new Date("2026-10-09T10:00:00+09:00"))).toEqual([
      "202610",
      "202611",
      "202612",
    ]);
    // UTC ではまだ 10 月 31 日だが、日本時間では 11 月
    expect(targetMonths(new Date("2026-10-31T16:00:00Z"))).toEqual(["202611", "202612", "202701"]);
  });

  it("イベント一覧 API の URL を組み立てる", () => {
    const url = eventsSearchUrl({
      months: ["202610", "202611"],
      prefectures: ["tokyo"],
      start: 101,
    });

    expect(url.origin + url.pathname).toBe("https://connpass.com/api/v2/events/");
    expect(url.searchParams.getAll("ym")).toEqual(["202610", "202611"]);
    expect(url.searchParams.getAll("prefecture")).toEqual(["tokyo"]);
    expect(url.searchParams.get("order")).toBe("2");
    expect(url.searchParams.get("start")).toBe("101");
    expect(url.searchParams.get("count")).toBe(String(PAGE_SIZE));
  });

  it("取得対象は東京都・神奈川県・埼玉県・千葉県", () => {
    expect([...TARGET_PREFECTURES]).toEqual(["tokyo", "kanagawa", "saitama", "chiba"]);
  });

  it("ユーザー項目を落とし、画像 URL は残す", () => {
    const event = toSnapshotEvent(connpassEvent());

    expect(event).not.toHaveProperty("owner_id");
    expect(event).not.toHaveProperty("owner_nickname");
    expect(event).not.toHaveProperty("owner_display_name");
    expect(event.image_url).toBe("https://media.connpass.com/thumbs/00/00/example.png");
    expect(toSnapshotEvent(connpassEvent({ image_url: null })).image_url).toBeNull();
    expect(event).toMatchObject({
      id: 1,
      title: "勉強会",
      url: "https://connpass.com/event/1/",
      group: {
        id: 1,
        subdomain: "bpstudy",
        title: "BPStudy",
        url: "https://bpstudy.connpass.com/",
      },
      accepted: 10,
    });
  });

  it("全ページ分をイベント一覧レスポンスの形にまとめ、重複を除く", () => {
    const snapshot = buildSnapshot([
      connpassEvent({ id: 1 }),
      connpassEvent({ id: 2 }),
      connpassEvent({ id: 1, title: "ずれて再取得" }),
    ]);

    expect(snapshot).toMatchObject({ results_returned: 2, results_available: 2, results_start: 1 });
    expect(snapshot.events.map((event) => [event.id, event.title])).toEqual([
      [1, "勉強会"],
      [2, "勉強会"],
    ]);
  });

  it("レスポンスの形を確かめる", () => {
    expect(isEventListResponse(eventListResponse([connpassEvent()]))).toBe(true);
    expect(isEventListResponse({ events: [] })).toBe(false);
    expect(isEventListResponse(eventListResponse([{ id: "1" } as unknown as ConnpassEvent]))).toBe(
      false
    );
  });

  it("スナップショットに書く項目が欠けたり型が違ったりするレスポンスは受け付けない", () => {
    const missing = (field: keyof ConnpassEvent) => {
      const event: Record<string, unknown> = { ...connpassEvent() };
      delete event[field];
      return eventListResponse([event as unknown as ConnpassEvent]);
    };
    for (const field of ["event_type", "accepted", "image_url", "group", "updated_at"] as const) {
      expect(isEventListResponse(missing(field))).toBe(false);
    }

    const broken = (overrides: Record<string, unknown>) =>
      eventListResponse([connpassEvent(overrides as Partial<ConnpassEvent>)]);
    expect(isEventListResponse(broken({ event_type: "unknown" }))).toBe(false);
    expect(isEventListResponse(broken({ limit: "40" }))).toBe(false);
    expect(isEventListResponse(broken({ group: { id: 1, title: "BPStudy" } }))).toBe(false);
    expect(isEventListResponse(broken({ group: null, limit: null, image_url: null }))).toBe(true);
  });

  it("件数の項目と events の長さが食い違うレスポンスは受け付けない", () => {
    expect(isEventListResponse(eventListResponse([connpassEvent()], { results_returned: 2 }))).toBe(
      false
    );
  });

  it("コミット済みのスナップショットのイベントは、どれも検証を通る形", () => {
    expect(committedSnapshot.events.every((event) => isSnapshotSourceEvent(event))).toBe(true);
  });

  it("ページを順に取り、2 回目以降は 5 秒あけてから呼ぶ", async () => {
    const pages = [page(1, PAGE_SIZE), page(101, PAGE_SIZE), page(201, 3)];
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(pages.shift() ?? [], { results_available: PAGE_SIZE * 2 + 3 }))
    );
    const sleep = vi.fn(async () => {});

    const events = await fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202610"],
      fetch: fetchMock as unknown as typeof fetch,
      sleep,
    });

    expect(events).toHaveLength(PAGE_SIZE * 2 + 3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, REQUEST_INTERVAL_MS);
    expect(sleep).toHaveBeenNthCalledWith(2, REQUEST_INTERVAL_MS);

    const calls = fetchMock.mock.calls as unknown as [URL, RequestInit][];
    expect(calls.map(([url]) => url.searchParams.get("start"))).toEqual(["1", "101", "201"]);
    expect(
      calls.every(
        ([url]) =>
          url.searchParams.getAll("prefecture").join(",") === "tokyo,kanagawa,saitama,chiba"
      )
    ).toBe(true);
    expect(calls[0]?.[1].headers).toMatchObject({ "X-API-Key": TEST_KEY });
    expect(calls.some(([url]) => url.toString().includes(TEST_KEY))).toBe(false);
  });

  it("results_available まで取り切ったら、ちょうど 100 件で割り切れても次のページを呼ばない", async () => {
    const pages = [page(1, PAGE_SIZE), page(101, PAGE_SIZE)];
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(pages.shift() ?? [], { results_available: PAGE_SIZE * 2 }))
    );

    const events = await fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202610"],
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      maxRequests: 2,
    });

    expect(events).toHaveLength(PAGE_SIZE * 2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("リクエスト同士の間隔は 5 秒より短くできない", async () => {
    const fetchMock = vi.fn();

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
        intervalMs: 1_000,
      })
    ).rejects.toThrow("5000ms 以上");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("エラーのステータスでは途中のデータを返さずに失敗し、API キーをメッセージに含めない", async () => {
    const responses = [
      jsonResponse(eventListResponse(page(1, PAGE_SIZE), { results_available: 1_000 })),
      jsonResponse({}, 429),
    ];
    const fetchMock = vi.fn(async () => responses.shift() as Response);

    const result = fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202610"],
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    await expect(result).rejects.toThrow("connpass API が 429 を返しました");
    await expect(result).rejects.not.toThrow(TEST_KEY);
  });

  it("リクエスト数の上限を超えたら止める", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(page(1, PAGE_SIZE), { results_available: 10_000 }))
    );

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
        sleep: async () => {},
        maxRequests: 2,
      })
    ).rejects.toThrow("上限（2 回）");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("API キーが無ければ呼ばない", async () => {
    const fetchMock = vi.fn();

    await expect(
      fetchConnpassEvents({
        apiKey: "",
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
      })
    ).rejects.toThrow("API キーがありません");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
