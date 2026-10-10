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

/** 東京都の 26 市（市部）。 */
export const TOKYO_CITIES = [
  "八王子市",
  "立川市",
  "武蔵野市",
  "三鷹市",
  "青梅市",
  "府中市",
  "昭島市",
  "調布市",
  "町田市",
  "小金井市",
  "小平市",
  "日野市",
  "東村山市",
  "国分寺市",
  "国立市",
  "福生市",
  "狛江市",
  "東大和市",
  "清瀬市",
  "東久留米市",
  "武蔵村山市",
  "多摩市",
  "稲城市",
  "羽村市",
  "あきる野市",
  "西東京市",
] as const;

/**
 * 東京都と一緒に取得する近隣の県。市町村には分けず、県名でまとめて選ぶ。
 * スナップショットに該当イベントがない日でも、絞り込みの選択肢として常に出す。
 */
export const NEIGHBOR_PREFECTURES = ["神奈川県", "埼玉県", "千葉県"] as const;

export type NeighborPrefecture = (typeof NEIGHBOR_PREFECTURES)[number];

/**
 * 住所に県名が書かれていないときに県を決める手がかり（各県の全市と、東京の地名と紛らわしくない町村）。
 * 「ヶ」「ケ」の表記ゆれは両方入れる。「大井町」（品川区）・「小川町」（千代田区神田）・「栄町」は
 * 東京都の町名と重なるので入れない。
 */
export const NEIGHBOR_PREFECTURE_HINTS: Record<NeighborPrefecture, readonly string[]> = {
  神奈川県: [
    "Kanagawa",
    "横浜市",
    "川崎市",
    "相模原市",
    "横須賀市",
    "平塚市",
    "鎌倉市",
    "藤沢市",
    "小田原市",
    "茅ヶ崎市",
    "茅ケ崎市",
    "逗子市",
    "三浦市",
    "秦野市",
    "厚木市",
    "大和市",
    "伊勢原市",
    "海老名市",
    "座間市",
    "南足柄市",
    "綾瀬市",
    "葉山町",
    "寒川町",
    "大磯町",
    "二宮町",
    "中井町",
    "松田町",
    "山北町",
    "開成町",
    "箱根町",
    "真鶴町",
    "湯河原町",
    "愛川町",
    "清川村",
  ],
  埼玉県: [
    "Saitama",
    "さいたま市",
    "川越市",
    "熊谷市",
    "川口市",
    "行田市",
    "秩父市",
    "所沢市",
    "飯能市",
    "加須市",
    "本庄市",
    "東松山市",
    "春日部市",
    "狭山市",
    "羽生市",
    "鴻巣市",
    "深谷市",
    "上尾市",
    "草加市",
    "越谷市",
    "蕨市",
    "戸田市",
    "入間市",
    "朝霞市",
    "志木市",
    "和光市",
    "新座市",
    "桶川市",
    "久喜市",
    "北本市",
    "八潮市",
    "富士見市",
    "三郷市",
    "蓮田市",
    "坂戸市",
    "幸手市",
    "鶴ヶ島市",
    "鶴ケ島市",
    "日高市",
    "吉川市",
    "ふじみ野市",
    "白岡市",
    "伊奈町",
    "三芳町",
    "毛呂山町",
    "越生町",
    "滑川町",
    "嵐山町",
    "川島町",
    "吉見町",
    "鳩山町",
    "ときがわ町",
    "横瀬町",
    "皆野町",
    "長瀞町",
    "小鹿野町",
    "東秩父村",
    "美里町",
    "神川町",
    "上里町",
    "寄居町",
    "宮代町",
    "杉戸町",
    "松伏町",
  ],
  千葉県: [
    "Chiba",
    "千葉市",
    "銚子市",
    "市川市",
    "船橋市",
    "館山市",
    "木更津市",
    "松戸市",
    "野田市",
    "茂原市",
    "成田市",
    "佐倉市",
    "東金市",
    "旭市",
    "習志野市",
    "柏市",
    "勝浦市",
    "市原市",
    "流山市",
    "八千代市",
    "我孫子市",
    "鴨川市",
    "鎌ケ谷市",
    "鎌ヶ谷市",
    "君津市",
    "富津市",
    "浦安市",
    "四街道市",
    "袖ケ浦市",
    "袖ヶ浦市",
    "八街市",
    "印西市",
    "白井市",
    "富里市",
    "南房総市",
    "匝瑳市",
    "香取市",
    "山武市",
    "いすみ市",
    "大網白里市",
    "酒々井町",
    "神崎町",
    "多古町",
    "東庄町",
    "九十九里町",
    "芝山町",
    "横芝光町",
    "一宮町",
    "睦沢町",
    "長生村",
    "白子町",
    "長柄町",
    "長南町",
    "大多喜町",
    "御宿町",
    "鋸南町",
  ],
};

export type AreaGroups = {
  wards: string[];
  cities: string[];
  prefectures: string[];
  other: string[];
};

export function groupAreas(events: Event[], selected: readonly string[]): AreaGroups {
  const present = new Set<string>();

  for (const event of events) {
    if (event.area) present.add(event.area);
  }

  for (const name of selected) present.add(name);

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
