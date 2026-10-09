import { describe, expect, it } from "vitest";
import { areaFromAddress, formatFromConnpass, toCalendarEvent } from "@/lib/connpass";
import { connpassEvent, snapshotEvent } from "@/lib/connpass.fixtures";

describe("connpass", () => {
  it("住所から区・市を取る", () => {
    expect(areaFromAddress("東京都北区赤羽1-1-1")).toBe("北区");
    expect(areaFromAddress("東京都豊島区西池袋1-1-1")).toBe("豊島区");
    expect(areaFromAddress("東京都小金井市本町6-6-3")).toBe("小金井市");
    expect(areaFromAddress("東京都東大和市中央3-930")).toBe("東大和市");
    expect(areaFromAddress("東京都西東京市南町5-6-13")).toBe("西東京市");
    expect(areaFromAddress("神奈川県横浜市西区みなとみらい2-3-5")).toBe("神奈川県");
    expect(areaFromAddress("神奈川県川崎市川崎区駅前本町26-2")).toBe("神奈川県");
    expect(areaFromAddress("埼玉県さいたま市北区宮原町1-1-1")).toBe("埼玉県");
    expect(areaFromAddress("千葉県千葉市中央区中央1-1-1")).toBe("千葉県");
    expect(areaFromAddress(null)).toBe("");
  });

  it("県名がない住所も市名から神奈川県・埼玉県・千葉県にまとめる", () => {
    expect(areaFromAddress("〒220-0012 横浜市西区みなとみらい2-3-5")).toBe("神奈川県");
    expect(areaFromAddress("さいたま市中央区新都心1-1")).toBe("埼玉県");
    expect(areaFromAddress("千葉市中央区中央1-1-1")).toBe("千葉県");
    expect(areaFromAddress("1-1 Nakase, Mihama-ku, Chiba")).toBe("千葉県");
    expect(areaFromAddress("〒104-0061 東京都中央区銀座1-1-1")).toBe("中央区");
    expect(areaFromAddress("渋谷区松濤1-29-1")).toBe("渋谷区");
  });

  it("県名がない住所は、各県のどの市でも県にまとめ、東京都の地名と重なるときは前に出てくる方を使う", () => {
    expect(areaFromAddress("大和市中央1-1-1")).toBe("神奈川県");
    expect(areaFromAddress("茅ケ崎市東海岸北1-1")).toBe("神奈川県");
    expect(areaFromAddress("熊谷市宮町2-47-1")).toBe("埼玉県");
    expect(areaFromAddress("成田市花崎町760")).toBe("千葉県");
    expect(areaFromAddress("鎌ヶ谷市新鎌ヶ谷2-6-1")).toBe("千葉県");
    expect(areaFromAddress("相模原市中央区中央2-11-15")).toBe("神奈川県");
    expect(areaFromAddress("東大和市中央3-930")).toBe("東大和市");
    expect(areaFromAddress("八王子市旭町1-1")).toBe("八王子市");
    expect(areaFromAddress("横浜市港北区新横浜2-1")).toBe("神奈川県");
  });

  it("住所とキャッチから開催形態を決める", () => {
    expect(formatFromConnpass(connpassEvent({ address: null, place: "オンライン" }))).toBe(
      "online"
    );
    expect(formatFromConnpass(connpassEvent({ address: "オンライン", place: null }))).toBe(
      "online"
    );
    expect(formatFromConnpass(connpassEvent({ catch: "会場とオンラインの併用です" }))).toBe(
      "hybrid"
    );
    expect(formatFromConnpass(connpassEvent())).toBe("offline");
  });

  it("API のイベントを画面用に変換する", () => {
    const event = toCalendarEvent(connpassEvent(), 1);

    expect(event).toMatchObject({
      id: "1",
      date: "2026-09-25",
      start: "19:00",
      end: "21:00",
      area: "渋谷区",
      venueName: "渋谷ヒカリエ",
      tags: ["golang"],
      url: "https://connpass.com/event/1/",
    });
  });

  it("説明文は検索用のプレーンテキストにする", () => {
    const event = toCalendarEvent(
      connpassEvent({
        description: "<p>会場で<strong>ハンズオン</strong>をします。<br>Q&amp;A あり</p>",
      })
    );

    expect(event?.description).toBe("会場でハンズオンをします。 Q&A あり");
  });

  it("スナップショットのイベントも同じように変換し、画像 URL を渡す", () => {
    const event = toCalendarEvent(snapshotEvent({ title: "スナップショット" }));

    expect(event).toMatchObject({
      id: "1",
      title: "スナップショット",
      date: "2026-09-24",
      area: "渋谷区",
      imageUrl: "https://media.connpass.com/thumbs/00/00/example.png",
    });
  });

  it("開催日時が無いイベントは表示しない", () => {
    expect(toCalendarEvent(snapshotEvent({ started_at: null }))).toBeNull();
  });

  it("必須項目が欠けたイベントはエラーにする", () => {
    expect(() => toCalendarEvent(snapshotEvent({ title: "" }))).toThrow(
      "イベントデータを読み取れませんでした"
    );
  });
});
