export type EventFormat = "online" | "offline" | "hybrid";

export type FormatFilter = "all" | "online" | "offline";

export type Event = {
  id: string;
  title: string;
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
  accepted: number;
  limit: number | null;
  url: string;
};

export type Filters = {
  date: string;
  area: string | null;
  format: FormatFilter;
  keyword: string;
};

export type RawEvent = {
  id: string;
  title: string;
  dayOffset: number;
  start: string;
  end: string;
  format: EventFormat;
  area: string;
  venueName: string;
  address: string;
  tags: string[];
  accepted: number;
  limit: number | null;
};
