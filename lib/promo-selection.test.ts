import { describe, expect, it } from "vitest";
import { formatWeekRange, weekDates } from "@/lib/week";
import {
  PROMO_EVENT_CAP,
  PROMO_VARIANTS,
  promoDurationSeconds,
  promoPlaceLabel,
  promoTimeLabel,
  saturdayPostWeek,
  takePromoEvents,
} from "@/lib/promo-selection";
import type { Event } from "@/lib/types";

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: "1",
    title: "React LT Night",
    catch: null,
    description: null,
    date: "2026-11-09",
    start: "19:00",
    end: "21:00",
    startedAt: "2026-11-09T19:00:00+09:00",
    endedAt: "2026-11-09T21:00:00+09:00",
    format: "offline",
    area: "渋谷区",
    venueName: "渋谷ヒカリエ",
    address: "東京都渋谷区渋谷2-21-1",
    tags: [],
    imageUrl: null,
    accepted: 10,
    limit: 20,
    url: "https://connpass.com/event/1/",
    cancelled: false,
    ...overrides,
  };
}

const week = weekDates("2026-11-08");

describe("土曜投稿の週", () => {
  it("土曜の翌日からの日曜〜土曜を、サイトの週表示と同じ範囲で返す", () => {
    expect(saturdayPostWeek("2026-10-24")).toEqual(weekDates("2026-10-25"));
    expect(formatWeekRange(saturdayPostWeek("2026-10-24"))).toBe("2026年10月25日〜31日");
    expect(saturdayPostWeek("2026-10-31")).toEqual(weekDates("2026-11-01"));
    expect(saturdayPostWeek("2026-11-04")).toEqual(weekDates("2026-11-08"));
    expect(saturdayPostWeek("2026-11-08")).toEqual(weekDates("2026-11-15"));
  });

  it("日付が不正なら投げないで済ませない", () => {
    expect(() => saturdayPostWeek("2026-11-31")).toThrow(/不正な日付/);
  });
});

describe("紹介動画の絞り込み", () => {
  it("週次投稿と同じ語だけを使い、発表や作業会は足さない", () => {
    expect(PROMO_VARIANTS.map((variant) => variant.keyword)).toEqual(["LT", "もくもく"]);
    expect(
      PROMO_VARIANTS.flatMap((variant) => variant.outputs.map((output) => output.fileName))
    ).toEqual([
      "week-lt.mp4",
      "week-lt-landscape.mp4",
      "week-mokumoku.mp4",
      "week-mokumoku-landscape.mp4",
    ]);
  });

  it("サイトの keyword と同じ部分一致で、日付と開始時刻の順に最大 10 件", () => {
    const events = [
      event({
        id: "late",
        date: "2026-11-10",
        start: "10:00",
        startedAt: "2026-11-10T10:00:00+09:00",
      }),
      event({
        id: "desc",
        title: "勉強会",
        description: "default の設定を話す",
        date: "2026-11-09",
        start: "12:00",
        startedAt: "2026-11-09T12:00:00+09:00",
      }),
      event({ id: "early", start: "09:00", startedAt: "2026-11-09T09:00:00+09:00" }),
      event({
        id: "cancelled",
        title: "中止の LT",
        cancelled: true,
        start: "18:00",
        startedAt: "2026-11-09T18:00:00+09:00",
      }),
      event({ id: "outside", date: "2026-11-16", title: "翌週の LT" }),
      event({ id: "moku", title: "もくもく会" }),
      event({
        id: "tag",
        title: "作業会",
        tags: ["もくもく会"],
        start: "13:00",
        startedAt: "2026-11-09T13:00:00+09:00",
      }),
    ];

    const lt = takePromoEvents(events, week, "LT");
    expect(lt.matched.map((item) => item.id)).toEqual(["early", "desc", "cancelled", "late"]);
    expect(lt.shown).toHaveLength(4);

    const moku = takePromoEvents(events, week, "もくもく");
    expect(moku.matched.map((item) => item.id)).toEqual(["tag", "moku"]);
    expect(
      takePromoEvents([event({ title: "作業会だけ" })], week, "もくもく").matched
    ).toHaveLength(0);
  });

  it("11 件目以降は動画に載せず、尺は 30 秒を超えない", () => {
    const events = Array.from({ length: 12 }, (_, index) =>
      event({
        id: String(index),
        title: `LT ${index}`,
        start: "19:00",
        startedAt: `2026-11-09T19:00:${String(index).padStart(2, "0")}+09:00`,
      })
    );
    const { matched, shown } = takePromoEvents(events, week, "LT");
    expect(matched).toHaveLength(12);
    expect(shown).toHaveLength(PROMO_EVENT_CAP);
    expect(shown[0]?.id).toBe("0");
    expect(promoDurationSeconds(PROMO_EVENT_CAP)).toBeLessThanOrEqual(30);
    expect(promoDurationSeconds(0)).toBeLessThanOrEqual(30);
  });

  it("場所は区と会場、オンラインは会場名を足さない", () => {
    expect(promoPlaceLabel(event())).toBe("渋谷区 · 渋谷ヒカリエ");
    expect(promoPlaceLabel(event({ format: "online", area: "", venueName: "Zoom" }))).toBe(
      "オンライン"
    );
    expect(promoTimeLabel(event())).toBe("19:00–21:00");
    expect(promoTimeLabel(event({ end: "19:00" }))).toBe("19:00");
  });
});
