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

export type Filters = {
  date: string;
  area: string | null;
  format: FormatFilter;
  keyword: string;
};
