import type {
  ConnpassEvent,
  ConnpassEventListResponse,
  EventSnapshot,
  SnapshotEvent,
} from "@/lib/types";

/** connpass API v2 のイベント一覧。https://connpass.com/about/api/v2/ */
export const CONNPASS_EVENTS_ENDPOINT = "https://connpass.com/api/v2/events/";

/**
 * リクエストの間隔。API リファレンスの制限（API キーごとに 1 秒間に 1 リクエストまで）より広く、
 * 利用申請の内容に合わせて 5 秒に 1 回までにする。前のレスポンスを受け取ってから待つので、
 * リクエストの開始どうしは必ずこれ以上あく。
 */
export const REQUEST_INTERVAL_MS = 5_000;

/** API の count の上限。 */
export const PAGE_SIZE = 100;

/** 想定外に件数が多いときに止める上限。全部取り切れないときは書き出さずに失敗させる。 */
export const MAX_REQUESTS = 100;

/**
 * 取得する都道府県。API の `prefecture`（東京都・神奈川県・埼玉県・千葉県）。
 * 複数指定は同じ名前のパラメーターを並べる。開催地はどれか 1 つなので、年月と同じく和集合として取る。
 */
export const TARGET_PREFECTURES = ["tokyo", "kanagawa", "saitama", "chiba"] as const;

/** 今月を含めて何か月分を取るか。 */
export const TARGET_MONTH_COUNT = 3;

export const USER_AGENT =
  "tokyo-event-calendar (+https://github.com/illionillion/tokyo-event-calendar)";

/** 日本時間の今月から `count` か月分を `yyyymm` で返す。 */
export function targetMonths(now: Date, count = TARGET_MONTH_COUNT): string[] {
  const tokyo = new Date(now.getTime() + 9 * 3_600_000);
  const year = tokyo.getUTCFullYear();
  const month = tokyo.getUTCMonth();

  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month + offset, 1));
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export type EventsQuery = {
  months: readonly string[];
  prefectures: readonly string[];
  start: number;
  count?: number;
};

/** イベント一覧 API の URL。複数の月・都道府県は同じ名前で並べ、開催日時順（order=2）で start と count でページを送る。 */
export function eventsSearchUrl({
  months,
  prefectures,
  start,
  count = PAGE_SIZE,
}: EventsQuery): URL {
  const url = new URL(CONNPASS_EVENTS_ENDPOINT);
  for (const month of months) url.searchParams.append("ym", month);
  for (const prefecture of prefectures) url.searchParams.append("prefecture", prefecture);
  url.searchParams.set("order", "2");
  url.searchParams.set("start", String(start));
  url.searchParams.set("count", String(count));
  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isEventListResponse(value: unknown): value is ConnpassEventListResponse {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.results_returned) &&
    Number.isInteger(value.results_available) &&
    Number.isInteger(value.results_start) &&
    Array.isArray(value.events) &&
    value.events.every(
      (event) =>
        isRecord(event) &&
        Number.isInteger(event.id) &&
        typeof event.title === "string" &&
        typeof event.url === "string"
    )
  );
}

/** 主催者などのユーザー項目を落とす。画像 URL はカード表示に使うので残す。 */
export function toSnapshotEvent(event: ConnpassEvent): SnapshotEvent {
  return {
    id: event.id,
    title: event.title,
    catch: event.catch,
    description: event.description,
    url: event.url,
    image_url: event.image_url,
    hash_tag: event.hash_tag,
    started_at: event.started_at,
    ended_at: event.ended_at,
    published_at: event.published_at,
    limit: event.limit,
    event_type: event.event_type,
    open_status: event.open_status,
    group: event.group
      ? {
          id: event.group.id,
          subdomain: event.group.subdomain,
          title: event.group.title,
          url: event.group.url,
        }
      : null,
    address: event.address,
    place: event.place,
    lat: event.lat,
    lon: event.lon,
    accepted: event.accepted,
    waiting: event.waiting,
    updated_at: event.updated_at,
  };
}

/** 全ページ分のイベントを、イベント一覧レスポンスと同じ形のスナップショットにまとめる。 */
export function buildSnapshot(events: readonly ConnpassEvent[]): EventSnapshot {
  const seen = new Set<number>();
  const unique: SnapshotEvent[] = [];
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(toSnapshotEvent(event));
  }

  return {
    results_returned: unique.length,
    results_available: unique.length,
    results_start: 1,
    events: unique,
  };
}

export type FetchEventsOptions = {
  apiKey: string;
  months: readonly string[];
  prefectures?: readonly string[];
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  intervalMs?: number;
  maxRequests?: number;
  log?: (message: string) => void;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * イベント一覧 API を 1 ページずつ順に呼ぶ。2 回目以降は前のレスポンスのあと `intervalMs` 待つ。
 * どこかで失敗したら途中のデータは返さずに例外にする（API キーはメッセージに含めない）。
 */
export async function fetchConnpassEvents({
  apiKey,
  months,
  prefectures = TARGET_PREFECTURES,
  fetch: fetchImpl = fetch,
  sleep = defaultSleep,
  intervalMs = REQUEST_INTERVAL_MS,
  maxRequests = MAX_REQUESTS,
  log = () => {},
}: FetchEventsOptions): Promise<ConnpassEvent[]> {
  if (!apiKey) throw new Error("connpass API キーがありません");
  if (intervalMs < REQUEST_INTERVAL_MS) {
    throw new Error(`リクエスト間隔は ${REQUEST_INTERVAL_MS}ms 以上にしてください`);
  }

  const events: ConnpassEvent[] = [];
  let start = 1;

  for (let request = 1; ; request += 1) {
    if (request > maxRequests) {
      throw new Error(`リクエスト数が上限（${maxRequests} 回）を超えるため中断しました`);
    }
    if (request > 1) await sleep(intervalMs);

    const url = eventsSearchUrl({ months, prefectures, start });
    log(`GET ${url.pathname}${url.search}`);
    const response = await fetchImpl(url, {
      headers: { "X-API-Key": apiKey, "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`connpass API が ${response.status} を返しました`);
    }

    const body: unknown = await response.json();
    if (!isEventListResponse(body)) {
      throw new Error("connpass API のレスポンスを読み取れませんでした");
    }

    events.push(...body.events);
    if (body.events.length < PAGE_SIZE) return events;
    start += body.events.length;
  }
}
