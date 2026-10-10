export type EventFormat = "online" | "offline" | "hybrid";

export type FormatFilter = "all" | "online" | "offline";

export type Event = {
  id: string;
  title: string;
  catch: string | null;
  description: string | null;
  date: string;
  start: string;
  end: string;
  startedAt: string;
  endedAt: string;
  format: EventFormat;
  area: string;
  venueName: string;
  address: string;
  tags: string[];
  imageUrl: string | null;
  accepted: number;
  limit: number | null;
  url: string;
};

export type ConnpassGroup = {
  id: number;
  subdomain: string | null;
  title: string;
  url: string;
};

/** connpass API v2 の EventSchema。https://connpass.com/about/api/v2/ */
export type ConnpassEvent = {
  id: number;
  title: string;
  catch: string | null;
  description: string | null;
  url: string;
  image_url: string | null;
  hash_tag: string | null;
  started_at: string | null;
  ended_at: string | null;
  published_at: string | null;
  limit: number | null;
  event_type: "participation" | "advertisement";
  open_status: "preopen" | "open" | "close" | "cancelled";
  group: ConnpassGroup | null;
  address: string | null;
  place: string | null;
  lat: string | null;
  lon: string | null;
  owner_id: number | null;
  owner_nickname: string;
  owner_display_name: string;
  accepted: number;
  waiting: number;
  updated_at: string;
};

/** connpass API v2 の GET /api/v2/events/ のレスポンス（EventListResponseSchema）。 */
export type ConnpassEventListResponse = {
  results_returned: number;
  results_available: number;
  results_start: number;
  events: ConnpassEvent[];
};

/** 主催者（connpass ユーザー）に当たる項目。スナップショットには残さない。 */
export type ConnpassUserField = "owner_id" | "owner_nickname" | "owner_display_name";

/**
 * `data/events.json` に書くイベント。API の EventSchema からユーザー項目を除く。
 * `image_url` はそのまま残し、カードは URL があるとき画像を表示する。
 */
export type SnapshotEvent = Omit<ConnpassEvent, ConnpassUserField>;

/** `data/events.json` の形。イベント一覧レスポンスと同じ形で、全ページ分をまとめたもの。 */
export type EventSnapshot = Omit<ConnpassEventListResponse, "events"> & {
  events: SnapshotEvent[];
};

export type Filters = {
  date: string;
  /** 選んだエリア（区・市・県）。空ならすべて。複数あるときはいずれかに当たるイベントを出す（OR）。 */
  areas: string[];
  format: FormatFilter;
  keyword: string;
};
