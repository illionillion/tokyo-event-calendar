import { describe, expect, it, vi } from "vitest";
import {
  buildSnapshot,
  eventsSearchUrl,
  fetchConnpassEvents,
  isSnapshotSourceEvent,
  isEventListResponse,
  PAGE_SIZE,
  parseConnpassSupplements,
  REQUEST_INTERVAL_MS,
  TARGET_PREFECTURES,
  targetMonths,
  toSnapshotEvent,
} from "@/lib/connpass-snapshot";
import committedSnapshot from "@/data/events.json";
import committedSupplements from "@/data/connpass-supplements.json";
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

  it("補完の URL は都道府県を付けず、subdomain または event_id を同じ名前で並べる", () => {
    const bySubdomain = eventsSearchUrl({
      months: ["202611", "202612"],
      subdomains: ["dmm", "example-group"],
      start: 1,
    });
    expect(bySubdomain.searchParams.getAll("ym")).toEqual(["202611", "202612"]);
    expect(bySubdomain.searchParams.getAll("subdomain")).toEqual(["dmm", "example-group"]);
    expect(bySubdomain.searchParams.has("prefecture")).toBe(false);
    expect(bySubdomain.searchParams.has("event_id")).toBe(false);

    const byEventId = eventsSearchUrl({
      months: ["202611"],
      eventIds: [402090, 402091],
      start: 1,
    });
    expect(byEventId.searchParams.getAll("event_id")).toEqual(["402090", "402091"]);
    expect(byEventId.searchParams.has("prefecture")).toBe(false);
    expect(byEventId.searchParams.has("subdomain")).toBe(false);
  });

  it("コミット済みの補完設定は subdomain dmm と akabane-yurumoku で、event_id は空", () => {
    expect(parseConnpassSupplements(committedSupplements)).toEqual({
      subdomains: ["dmm", "akabane-yurumoku"],
      eventIds: [],
    });
  });

  it("補完設定の余計な項目、URL、重複、不正な event_id は受け付けない", () => {
    expect(() =>
      parseConnpassSupplements({ subdomains: ["dmm"], event_ids: [], note: "メモ" })
    ).toThrow("subdomains と event_ids だけ");
    expect(() =>
      parseConnpassSupplements({ subdomains: ["https://dmm.connpass.com/"], event_ids: [] })
    ).toThrow("英小文字");
    expect(() => parseConnpassSupplements({ subdomains: ["dmm", "dmm"], event_ids: [] })).toThrow(
      "重複しています: dmm"
    );
    expect(() => parseConnpassSupplements({ subdomains: [], event_ids: ["402090"] })).toThrow(
      "正の整数"
    );
    expect(() => parseConnpassSupplements({ subdomains: [], event_ids: [402090, 402090] })).toThrow(
      "重複しています: 402090"
    );
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
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse(pages.shift() ?? [], {
          results_available: PAGE_SIZE * 2 + 3,
          results_start: Number(url.searchParams.get("start")),
        })
      )
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
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse(pages.shift() ?? [], {
          results_available: PAGE_SIZE * 2,
          results_start: Number(url.searchParams.get("start")),
        })
      )
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

  it("頼んだページと違うページ（同じページの繰り返しなど）が返ってきたら失敗する", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(page(1, PAGE_SIZE), { results_available: 1_000 }))
    );

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
        sleep: async () => {},
      })
    ).rejects.toThrow("start=101 と違うページ");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("まだ残りがあるのに短いページが返ってきたら、途中までで書き出さずに失敗する", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(page(1, 3), { results_available: 250 }))
    );

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
        sleep: async () => {},
      })
    ).rejects.toThrow("途中で途切れました");
  });

  it("results_available を超える件数が返ってきたら失敗する", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(eventListResponse(page(1, 3), { results_available: 2 }))
    );

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202610"],
        fetch: fetchMock as unknown as typeof fetch,
        sleep: async () => {},
      })
    ).rejects.toThrow("results_available を超えました");
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
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse(page(1, PAGE_SIZE), {
          results_available: 10_000,
          results_start: Number(url.searchParams.get("start")),
        })
      )
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

  it("allowlist の subdomain と event_id を都道府県の結果へ足し、同じ id は先のものを残す", async () => {
    const pages = [
      [connpassEvent({ id: 1, title: "都内" }), connpassEvent({ id: 2, title: "都内の重複" })],
      [connpassEvent({ id: 2, title: "補完側" }), connpassEvent({ id: 3, title: "グループ補完" })],
      [connpassEvent({ id: 3, title: "id側" }), connpassEvent({ id: 402090, title: "指定ID" })],
    ];
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse(pages.shift() ?? [], {
          results_start: Number(url.searchParams.get("start")),
        })
      )
    );
    const sleep = vi.fn(async () => {});

    const events = await fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202611", "202612"],
      supplements: { subdomains: ["dmm", "example-group"], eventIds: [402090, 402091] },
      fetch: fetchMock as unknown as typeof fetch,
      sleep,
    });

    expect(events.map((event) => [event.id, event.title])).toEqual([
      [1, "都内"],
      [2, "都内の重複"],
      [3, "グループ補完"],
      [402090, "指定ID"],
    ]);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, REQUEST_INTERVAL_MS);
    expect(sleep).toHaveBeenNthCalledWith(2, REQUEST_INTERVAL_MS);

    const calls = fetchMock.mock.calls as unknown as [URL, RequestInit][];
    expect(calls).toHaveLength(3);
    expect(calls[0]?.[0].searchParams.getAll("prefecture")).toEqual([
      "tokyo",
      "kanagawa",
      "saitama",
      "chiba",
    ]);
    expect(calls[0]?.[0].searchParams.has("subdomain")).toBe(false);
    expect(calls[0]?.[0].searchParams.has("event_id")).toBe(false);
    expect(calls[1]?.[0].searchParams.getAll("ym")).toEqual(["202611", "202612"]);
    expect(calls[1]?.[0].searchParams.getAll("subdomain")).toEqual(["dmm", "example-group"]);
    expect(calls[1]?.[0].searchParams.has("prefecture")).toBe(false);
    expect(calls[1]?.[0].searchParams.has("event_id")).toBe(false);
    expect(calls[2]?.[0].searchParams.getAll("event_id")).toEqual(["402090", "402091"]);
    expect(calls[2]?.[0].searchParams.has("prefecture")).toBe(false);
    expect(calls[2]?.[0].searchParams.has("subdomain")).toBe(false);
    expect(calls.every(([url]) => !url.toString().includes(TEST_KEY))).toBe(true);
  });

  it("補完の subdomain もページを送り、都道府県のリクエストと合わせて間隔をあける", async () => {
    const bodies = [
      eventListResponse([connpassEvent({ id: 1 })], { results_available: 1 }),
      eventListResponse(page(10, PAGE_SIZE), { results_available: PAGE_SIZE + 1 }),
      eventListResponse([connpassEvent({ id: 10 + PAGE_SIZE })], {
        results_available: PAGE_SIZE + 1,
      }),
    ];
    const fetchMock = vi.fn(async (url: URL) => {
      const body = bodies.shift() ?? eventListResponse([]);
      return jsonResponse({ ...body, results_start: Number(url.searchParams.get("start")) });
    });
    const sleep = vi.fn(async () => {});

    const events = await fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202611"],
      supplements: { subdomains: ["dmm"], eventIds: [] },
      fetch: fetchMock as unknown as typeof fetch,
      sleep,
    });

    expect(events).toHaveLength(PAGE_SIZE + 2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    const calls = fetchMock.mock.calls as unknown as [URL, RequestInit][];
    expect(calls.map(([url]) => url.searchParams.get("start"))).toEqual(["1", "1", "101"]);
    expect(calls[1]?.[0].searchParams.getAll("subdomain")).toEqual(["dmm"]);
    expect(calls[1]?.[0].searchParams.has("prefecture")).toBe(false);
    expect(calls[2]?.[0].searchParams.get("start")).toBe("101");
  });

  it("補完が 0 件でも、都道府県の結果は返す", async () => {
    const pages = [[connpassEvent({ id: 7 })], [], []];
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse(pages.shift() ?? [], {
          results_start: Number(url.searchParams.get("start")),
        })
      )
    );

    const events = await fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202611"],
      supplements: { subdomains: ["dmm"], eventIds: [402090] },
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    expect(events.map((event) => event.id)).toEqual([7]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("補完の取得が失敗したら、都道府県分を返さずに失敗する", async () => {
    const responses = [
      jsonResponse(eventListResponse([connpassEvent({ id: 1 })])),
      jsonResponse({}, 502),
    ];
    const fetchMock = vi.fn(async () => responses.shift() as Response);

    const result = fetchConnpassEvents({
      apiKey: TEST_KEY,
      months: ["202611"],
      supplements: { subdomains: ["dmm"], eventIds: [] },
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    await expect(result).rejects.toThrow("connpass API が 502 を返しました");
    await expect(result).rejects.not.toThrow(TEST_KEY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("補完のリクエストも、都道府県の取得と合算した回数の上限で止める", async () => {
    const fetchMock = vi.fn(async (url: URL) =>
      jsonResponse(
        eventListResponse([connpassEvent({ id: 1 })], {
          results_start: Number(url.searchParams.get("start")),
        })
      )
    );

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202611"],
        supplements: { subdomains: ["dmm"], eventIds: [] },
        fetch: fetchMock as unknown as typeof fetch,
        sleep: async () => {},
        maxRequests: 1,
      })
    ).rejects.toThrow("上限（1 回）");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("補完設定が不正なら API を呼ばない", async () => {
    const fetchMock = vi.fn();

    await expect(
      fetchConnpassEvents({
        apiKey: TEST_KEY,
        months: ["202611"],
        supplements: { subdomains: ["DMM"], eventIds: [] },
        fetch: fetchMock as unknown as typeof fetch,
      })
    ).rejects.toThrow("英小文字");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
