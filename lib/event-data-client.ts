import { dayDataPath, EVENT_INDEX_PATH, EVENT_LITE_PATH, type EventIndex } from "@/lib/event-data";
import type { Event, EventSummary } from "@/lib/types";

/**
 * ブラウザから静的なイベントデータを取りにいく。
 * 同じページのうちは、取った日（取得中を含む）を使い回す。失敗したものは捨てて、次に頼まれたとき取り直す。
 * 再読み込みでは索引と軽い一覧の成功キャッシュも捨てる。開いたタブがデプロイ前の索引を持ったままだと、
 * 消えた日のファイルが 404 のままになり、ボタンを押しても同じ索引で取り直してしまう。
 */
const cache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`イベントデータを読み込めませんでした（${response.status}）`);
  return (await response.json()) as T;
}

function cached<T>(url: string): Promise<T> {
  const hit = cache.get(url);
  if (hit) return hit as Promise<T>;
  const promise = fetchJson<T>(url);
  cache.set(url, promise);
  promise.catch(() => {
    if (cache.get(url) === promise) cache.delete(url);
  });
  return promise;
}

export function loadEventIndex(): Promise<EventIndex> {
  return cached<EventIndex>(EVENT_INDEX_PATH);
}

export function loadEventSummaries(): Promise<EventSummary[]> {
  return cached<EventSummary[]>(EVENT_LITE_PATH);
}

/** 1 日分のイベント。索引に無い日は取りにいかず空にする。 */
export async function loadDayEvents(date: string, index: EventIndex): Promise<Event[]> {
  if (!index.dates[date]) return [];
  return cached<Event[]>(dayDataPath(date));
}

/** 再読み込み用。成功済みの索引と軽い一覧を捨て、次に頼まれたとき取り直す。 */
export function invalidateEventMetadata(): void {
  cache.delete(EVENT_INDEX_PATH);
  cache.delete(EVENT_LITE_PATH);
}

/** テスト用。取得済みのデータを捨てる。 */
export function clearEventDataCache(): void {
  cache.clear();
}
