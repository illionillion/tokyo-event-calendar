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

export type AreaGroups = {
  wards: string[];
  cities: string[];
  other: string[];
};

export function groupAreas(events: Event[], selected: string | null): AreaGroups {
  const present = new Set<string>();

  for (const event of events) {
    if (event.area) present.add(event.area);
  }

  if (selected) present.add(selected);

  const known = new Set<string>([...TOKYO_WARDS, ...TOKYO_CITIES]);
  const other = [...present]
    .filter((name) => !known.has(name))
    .sort((left, right) => left.localeCompare(right, "ja"));

  return {
    wards: TOKYO_WARDS.filter((name) => present.has(name)),
    cities: TOKYO_CITIES.filter((name) => present.has(name)),
    other,
  };
}
