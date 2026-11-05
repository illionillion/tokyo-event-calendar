import type { PromoProps } from "./types";

const siteUrl = "https://tokyo-event-calendar.illionillion.workers.dev/";

export const sampleLt: PromoProps = {
  headline: "LT",
  weekLabel: "2026年11月8日〜14日",
  siteName: "東京イベントカレンダー",
  siteUrl,
  matched: 3,
  cards: [
    {
      id: "sample-1",
      title: "React LT Night",
      dateLabel: "11月9日（月）",
      timeLabel: "19:00–21:00",
      placeLabel: "渋谷区 · 渋谷ヒカリエ",
      thumb: null,
      cancelled: false,
      index: 1,
      total: 3,
    },
    {
      id: "sample-2",
      title: "データ界隈 LT 祭",
      dateLabel: "11月11日（水）",
      timeLabel: "19:30–21:30",
      placeLabel: "港区 · オンライン併用",
      thumb: null,
      cancelled: false,
      index: 2,
      total: 3,
    },
    {
      id: "sample-3",
      title: "【中止】朝の LT",
      dateLabel: "11月14日（土）",
      timeLabel: "10:00–12:00",
      placeLabel: "オンライン",
      thumb: null,
      cancelled: true,
      index: 3,
      total: 3,
    },
  ],
};

export const sampleMokumoku: PromoProps = {
  headline: "もくもく",
  weekLabel: "2026年11月8日〜14日",
  siteName: "東京イベントカレンダー",
  siteUrl,
  matched: 1,
  cards: [
    {
      id: "sample-moku",
      title: "だれでももくもく会",
      dateLabel: "11月14日（土）",
      timeLabel: "13:30–16:00",
      placeLabel: "品川区 · 大崎第一地域センター",
      thumb: null,
      cancelled: false,
      index: 1,
      total: 1,
    },
  ],
};
