import type { Event } from "@/lib/types";

export const TOKYO_WARDS = [
  "千代田区",
  "中央区",
  "港区",
  "新宿区",
  "文京区",
  "台東区",
  "墨田区",
  "江東区",
  "品川区",
  "目黒区",
  "大田区",
  "世田谷区",
  "渋谷区",
  "中野区",
  "杉並区",
  "豊島区",
  "北区",
  "荒川区",
  "板橋区",
  "練馬区",
  "足立区",
  "葛飾区",
  "江戸川区",
] as const;

export const TOKYO_CITIES = [
  "八王子市",
  "立川市",
  "武蔵野市",
  "三鷹市",
  "府中市",
  "調布市",
  "町田市",
] as const;

/**
 * 東京都と一緒に取得する近隣の県。市町村には分けず、県名でまとめて選ぶ。
 * スナップショットに該当イベントがない日でも、絞り込みの選択肢として常に出す。
 */
export const NEIGHBOR_PREFECTURES = ["神奈川県", "埼玉県", "千葉県"] as const;

export type NeighborPrefecture = (typeof NEIGHBOR_PREFECTURES)[number];

/**
 * 住所に県名が書かれていないときに県を決める手がかり。
 * 「さいたま市中央区」などを東京都の区と取り違えないよう、東京都の区・市より先に見る。
 */
export const NEIGHBOR_PREFECTURE_HINTS: Record<NeighborPrefecture, readonly string[]> = {
  神奈川県: ["Kanagawa", "横浜市", "川崎市", "相模原市", "藤沢市", "鎌倉市", "横須賀市"],
  埼玉県: ["Saitama", "さいたま市", "川口市", "川越市", "所沢市", "越谷市"],
  千葉県: ["Chiba", "千葉市", "船橋市", "柏市", "市川市", "松戸市", "浦安市"],
};

export type AreaGroups = {
  wards: string[];
  cities: string[];
  prefectures: string[];
  other: string[];
};

export function groupAreas(events: Event[], selected: string | null): AreaGroups {
  const present = new Set<string>();

  for (const event of events) {
    if (event.area) present.add(event.area);
  }

  if (selected) present.add(selected);

  const known = new Set<string>([...TOKYO_WARDS, ...TOKYO_CITIES, ...NEIGHBOR_PREFECTURES]);
  const other = [...present]
    .filter((name) => !known.has(name))
    .sort((left, right) => left.localeCompare(right, "ja"));

  return {
    wards: TOKYO_WARDS.filter((name) => present.has(name)),
    cities: TOKYO_CITIES.filter((name) => present.has(name)),
    prefectures: [...NEIGHBOR_PREFECTURES],
    other,
  };
}
