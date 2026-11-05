import type { EventSnapshot, SnapshotEvent } from "@/lib/types";

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
  prefectures?: readonly string[];
  /** グループの subdomain。都道府県インデックスに載らないイベントの補完に使う。 */
  subdomains?: readonly string[];
  /** イベント ID。都道府県インデックスに載らない単発のイベントの補完に使う。 */
  eventIds?: readonly number[];
  start: number;
  count?: number;
};

/**
 * 都道府県検索では拾えないイベントを足すための allowlist。
 * ファイルは `subdomains` と `event_ids` だけを持つ（`data/connpass-supplements.json`）。
 */
export type ConnpassSupplements = {
  subdomains: readonly string[];
  eventIds: readonly number[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** subdomain は URL ではなく、英小文字・数字・ハイフンだけ。`dmm.connpass.com` の `dmm`。 */
const SUBDOMAIN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * 補完設定を読む。余計な項目や、URL をそのまま書いた subdomain、重複は受け付けない。
 * 失敗したら API は呼ばない（呼び出し側が先にこれを通す）。
 */
export function parseConnpassSupplements(value: unknown): ConnpassSupplements {
  if (!isRecord(value)) {
    throw new Error("connpass の補完設定を読み取れませんでした");
  }

  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "event_ids" || keys[1] !== "subdomains") {
    throw new Error("connpass の補完設定は subdomains と event_ids だけにしてください");
  }
  if (!Array.isArray(value.subdomains) || !Array.isArray(value.event_ids)) {
    throw new Error("connpass の補完設定を読み取れませんでした");
  }

  const subdomains: string[] = [];
  for (const subdomain of value.subdomains) {
    if (typeof subdomain !== "string" || !SUBDOMAIN_PATTERN.test(subdomain)) {
      throw new Error(
        "connpass の補完設定の subdomain は、URL ではなく英小文字・数字・ハイフンだけにしてください"
      );
    }
    if (subdomains.includes(subdomain)) {
      throw new Error(`connpass の補完設定の subdomain が重複しています: ${subdomain}`);
    }
    subdomains.push(subdomain);
  }

  const eventIds: number[] = [];
  for (const eventId of value.event_ids) {
    if (typeof eventId !== "number" || !Number.isSafeInteger(eventId) || eventId <= 0) {
      throw new Error("connpass の補完設定の event_id は正の整数にしてください");
    }
    if (eventIds.includes(eventId)) {
      throw new Error(`connpass の補完設定の event_id が重複しています: ${eventId}`);
    }
    eventIds.push(eventId);
  }

  return { subdomains, eventIds };
}

/**
 * イベント一覧 API の URL。複数の月・都道府県・subdomain・event_id は同じ名前で並べ、
 * 開催日時順（order=2）で start と count でページを送る。
 * 空の配列はパラメーターを付けない。補完は prefecture なしで subdomain または event_id を付ける。
 */
export function eventsSearchUrl({
  months,
  prefectures = [],
  subdomains = [],
  eventIds = [],
  start,
  count = PAGE_SIZE,
}: EventsQuery): URL {
  const url = new URL(CONNPASS_EVENTS_ENDPOINT);
  for (const month of months) url.searchParams.append("ym", month);
  for (const prefecture of prefectures) url.searchParams.append("prefecture", prefecture);
  for (const subdomain of subdomains) url.searchParams.append("subdomain", subdomain);
  for (const eventId of eventIds) url.searchParams.append("event_id", String(eventId));
  url.searchParams.set("order", "2");
  url.searchParams.set("start", String(start));
  url.searchParams.set("count", String(count));
  return url;
}

const EVENT_TYPES: readonly unknown[] = ["participation", "advertisement"];
const OPEN_STATUSES: readonly unknown[] = ["preopen", "open", "close", "cancelled"];

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isGroup(value: unknown): boolean {
  if (value === null) return true;
  return (
    isRecord(value) &&
    Number.isInteger(value.id) &&
    isStringOrNull(value.subdomain) &&
    typeof value.title === "string" &&
    typeof value.url === "string"
  );
}

/**
 * スナップショットに書く項目がすべて EventSchema どおりの型か。欠けた項目を `undefined` のまま書き出さないよう、
 * 1 つでも合わなければ false にする。保存しないユーザー項目（owner_*）は見ないので、型はユーザー項目を除いた
 * `SnapshotEvent` に絞る（owner_* があるとは扱わない）。
 */
export function isSnapshotSourceEvent(value: unknown): value is SnapshotEvent {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.id) &&
    typeof value.title === "string" &&
    isStringOrNull(value.catch) &&
    isStringOrNull(value.description) &&
    typeof value.url === "string" &&
    isStringOrNull(value.image_url) &&
    isStringOrNull(value.hash_tag) &&
    isStringOrNull(value.started_at) &&
    isStringOrNull(value.ended_at) &&
    isStringOrNull(value.published_at) &&
    (value.limit === null || Number.isInteger(value.limit)) &&
    EVENT_TYPES.includes(value.event_type) &&
    OPEN_STATUSES.includes(value.open_status) &&
    isGroup(value.group) &&
    isStringOrNull(value.address) &&
    isStringOrNull(value.place) &&
    isStringOrNull(value.lat) &&
    isStringOrNull(value.lon) &&
    Number.isInteger(value.accepted) &&
    Number.isInteger(value.waiting) &&
    typeof value.updated_at === "string"
  );
}

/**
 * イベント一覧レスポンスの形か。件数の項目と events の長さが食い違うときも false にする。
 * events はユーザー項目を確かめていないので `SnapshotEvent` として扱う。
 */
export function isEventListResponse(value: unknown): value is EventSnapshot {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.results_returned) &&
    Number.isInteger(value.results_available) &&
    Number.isInteger(value.results_start) &&
    Array.isArray(value.events) &&
    value.results_returned === value.events.length &&
    value.events.every(isSnapshotSourceEvent)
  );
}

/**
 * スナップショットに書く項目だけを取り出す。API のイベント（`ConnpassEvent`）を渡しても、主催者などのユーザー項目は
 * 書き出さない。画像 URL はカード表示に使うので残す。
 */
export function toSnapshotEvent(event: SnapshotEvent): SnapshotEvent {
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
export function buildSnapshot(events: readonly SnapshotEvent[]): EventSnapshot {
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
  /**
   * 都道府県検索に加えて取る subdomain と event_id。
   * 省略か両方が空なら、都道府県の検索だけを行う。
   */
  supplements?: ConnpassSupplements;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  intervalMs?: number;
  maxRequests?: number;
  log?: (message: string) => void;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type PageQuery = {
  months: readonly string[];
  prefectures: readonly string[];
  subdomains: readonly string[];
  eventIds: readonly number[];
};

type FetchContext = {
  apiKey: string;
  fetchImpl: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  intervalMs: number;
  maxRequests: number;
  log: (message: string) => void;
  /** 都道府県のページと補完のページを通した、これまでに始めたリクエスト数。 */
  requestCount: number;
};

/** 先に入った id を残して、イベント id で一つにまとめる。 */
function mergeById(groups: readonly (readonly SnapshotEvent[])[]): SnapshotEvent[] {
  const seen = new Set<number>();
  const unique: SnapshotEvent[] = [];
  for (const group of groups) {
    for (const event of group) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      unique.push(event);
    }
  }
  return unique;
}

/**
 * 1 種類の検索条件を、1 ページずつ順に取る。2 回目以降（別の検索の続きも含む）は前のレスポンスのあと `intervalMs` 待つ。
 * 都道府県・subdomain・event_id のどれも無い検索は、窓の中の全イベントを取りに行くので拒否する。
 */
async function fetchQueryPages(query: PageQuery, context: FetchContext): Promise<SnapshotEvent[]> {
  if (
    query.prefectures.length === 0 &&
    query.subdomains.length === 0 &&
    query.eventIds.length === 0
  ) {
    throw new Error("都道府県・subdomain・event_id のいずれも指定されていないため中断しました");
  }

  const events: SnapshotEvent[] = [];
  let start = 1;

  for (;;) {
    context.requestCount += 1;
    if (context.requestCount > context.maxRequests) {
      throw new Error(`リクエスト数が上限（${context.maxRequests} 回）を超えるため中断しました`);
    }
    if (context.requestCount > 1) await context.sleep(context.intervalMs);

    const url = eventsSearchUrl({ ...query, start });
    context.log(`GET ${url.pathname}${url.search}`);
    const response = await context.fetchImpl(url, {
      headers: {
        "X-API-Key": context.apiKey,
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`connpass API が ${response.status} を返しました`);
    }

    const body: unknown = await response.json();
    if (!isEventListResponse(body)) {
      throw new Error("connpass API のレスポンスを読み取れませんでした");
    }

    // 頼んだページと違う（同じページが返ってきた など）、または件数の辻つまが合わないときは、
    // 一部だけのスナップショットを書き出さないよう失敗させる
    if (body.events.length > 0 && body.results_start !== start) {
      throw new Error(`connpass API が start=${start} と違うページを返しました`);
    }
    const fetched = start - 1 + body.events.length;
    if (fetched > body.results_available) {
      throw new Error("connpass API の件数が results_available を超えました");
    }

    events.push(...body.events);
    // results_available まで取り切ったら終わり（ちょうど割り切れる件数で余分に呼ばない）
    if (fetched === body.results_available) return events;
    if (body.events.length < PAGE_SIZE) {
      throw new Error(
        "connpass API のページが途中で途切れました（results_available まで取れていません）"
      );
    }
    start += body.events.length;
  }
}

/**
 * 都道府県のイベント一覧を取り、続けて allowlist の subdomain と event_id でも取る。
 * 補完は prefecture を付けない。API では subdomain と event_id は都道府県なしで検索できる。
 * 別種の条件を一つの URL に混ぜると絞り込み（AND）になり、取りこぼしを拾えないので、検索は分ける。
 * 同じ種類の複数値は都道府県と同じく和集合（同じ名前のパラメーターを繰り返す）として 1 回の検索にまとめる。
 * 開催年月は都道府県の取得と同じ窓にする。グループの過去イベントを全部は取らない。
 * リクエスト間隔は検索をまたいでも `intervalMs`。どこかで失敗したら、取れた分は返さずに例外にする
 * （API キーはメッセージに含めない）。呼び出し側はそのときスナップショットを書き出さない。
 * 重複はイベント id で除き、先に取れた都道府県側を残す。
 */
export async function fetchConnpassEvents({
  apiKey,
  months,
  prefectures = TARGET_PREFECTURES,
  supplements,
  fetch: fetchImpl = fetch,
  sleep = defaultSleep,
  intervalMs = REQUEST_INTERVAL_MS,
  maxRequests = MAX_REQUESTS,
  log = () => {},
}: FetchEventsOptions): Promise<SnapshotEvent[]> {
  if (!apiKey) throw new Error("connpass API キーがありません");
  if (intervalMs < REQUEST_INTERVAL_MS) {
    throw new Error(`リクエスト間隔は ${REQUEST_INTERVAL_MS}ms 以上にしてください`);
  }

  const allowlist = parseConnpassSupplements({
    subdomains: supplements?.subdomains ?? [],
    event_ids: supplements?.eventIds ?? [],
  });

  const context: FetchContext = {
    apiKey,
    fetchImpl,
    sleep,
    intervalMs,
    maxRequests,
    log,
    requestCount: 0,
  };

  const byPrefecture = await fetchQueryPages(
    { months, prefectures, subdomains: [], eventIds: [] },
    context
  );

  let bySubdomain: SnapshotEvent[] = [];
  if (allowlist.subdomains.length > 0) {
    bySubdomain = await fetchQueryPages(
      { months, prefectures: [], subdomains: allowlist.subdomains, eventIds: [] },
      context
    );
  }

  let byEventId: SnapshotEvent[] = [];
  if (allowlist.eventIds.length > 0) {
    byEventId = await fetchQueryPages(
      { months, prefectures: [], subdomains: [], eventIds: allowlist.eventIds },
      context
    );
  }

  return mergeById([byPrefecture, bySubdomain, byEventId]);
}
