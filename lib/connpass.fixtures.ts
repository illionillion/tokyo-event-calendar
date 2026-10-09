import { toSnapshotEvent } from "@/lib/connpass-snapshot";
import type { ConnpassEvent, ConnpassEventListResponse, SnapshotEvent } from "@/lib/types";

/** connpass API v2 の EventSchema と同じ形のテスト用イベント。 */
export function connpassEvent(overrides: Partial<ConnpassEvent> = {}): ConnpassEvent {
  return {
    id: 1,
    title: "勉強会",
    catch: null,
    description: null,
    url: "https://connpass.com/event/1/",
    image_url: "https://media.connpass.com/thumbs/00/00/example.png",
    hash_tag: "golang",
    started_at: "2026-09-24T19:00:00+09:00",
    ended_at: "2026-09-24T21:00:00+09:00",
    published_at: "2026-09-01T10:00:00+09:00",
    limit: 40,
    event_type: "participation",
    open_status: "open",
    group: {
      id: 1,
      subdomain: "bpstudy",
      title: "BPStudy",
      url: "https://bpstudy.connpass.com/",
    },
    address: "東京都渋谷区渋谷2-21-1",
    place: "渋谷ヒカリエ",
    lat: "35.659000000000",
    lon: "139.703000000000",
    owner_id: 8,
    owner_nickname: "haru",
    owner_display_name: "佐藤 治",
    accepted: 10,
    waiting: 0,
    updated_at: "2026-09-20T12:00:00+09:00",
    ...overrides,
  };
}

/** `data/events.json` に書かれる形のテスト用イベント。 */
export function snapshotEvent(overrides: Partial<ConnpassEvent> = {}): SnapshotEvent {
  return toSnapshotEvent(connpassEvent(overrides));
}

/** GET /api/v2/events/ と同じ形のテスト用レスポンス。 */
export function eventListResponse(
  events: ConnpassEvent[],
  overrides: Partial<Omit<ConnpassEventListResponse, "events">> = {}
): ConnpassEventListResponse {
  return {
    results_returned: events.length,
    results_available: events.length,
    results_start: 1,
    events,
    ...overrides,
  };
}
