import { describe, expect, it } from "vitest";
import type { Event } from "@/lib/types";
import {
  assignColumns,
  countOnDate,
  formatWeekRange,
  initialScrollHour,
  isAllDayEvent,
  layoutWeek,
  limitColumns,
  overlapsDates,
  splitByDay,
  weekDates,
} from "@/lib/week";

function event(id: string, startedAt: string, endedAt: string): Event {
  return {
    id,
    title: `イベント${id}`,
    catch: null,
    description: null,
    date: startedAt.slice(0, 10),
    start: startedAt.slice(11, 16),
    end: endedAt.slice(11, 16),
    startedAt,
    endedAt,
    format: "offline",
    area: "港区",
    venueName: "",
    address: "",
    tags: [],
    imageUrl: null,
    accepted: 0,
    limit: null,
    url: `https://connpass.com/event/${id}/`,
  };
}

const at = (date: string, time: string) => `${date}T${time}:00+09:00`;
const week = weekDates("2026-10-14");

describe("week", () => {
  it("週は日曜始まりで、範囲の表記は月・年をまたぐと補う", () => {
    expect(week).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
    ]);
    expect(weekDates("2026-10-11")[0]).toBe("2026-10-11");
    expect(weekDates("2026-10-17")[0]).toBe("2026-10-11");
    expect(formatWeekRange(week)).toBe("2026年10月11日〜17日");
    expect(formatWeekRange(weekDates("2026-11-01"))).toBe("2026年11月1日〜7日");
    expect(formatWeekRange(weekDates("2026-09-30"))).toBe("2026年9月27日〜10月3日");
    expect(formatWeekRange(weekDates("2026-12-31"))).toBe("2026年12月27日〜2027年1月2日");
  });

  it("UTC で書かれた時刻も日本時間の日付と分にする", () => {
    const utc = event("1", "2026-10-13T15:30:00Z", "2026-10-13T16:30:00Z");
    // 日本時間 10/14 0:30〜1:30
    const [segment] = splitByDay({ ...utc, date: "2026-10-14" });
    expect(segment).toMatchObject({ date: "2026-10-14", start: 30, end: 90 });
  });

  it("24 時間未満で日付をまたぐイベントは日ごとに分ける", () => {
    const overnight = event("1", at("2026-10-14", "20:00"), at("2026-10-15", "06:00"));
    expect(isAllDayEvent(overnight)).toBe(false);
    expect(splitByDay(overnight)).toEqual([
      expect.objectContaining({
        date: "2026-10-14",
        start: 20 * 60,
        end: 24 * 60,
        continuesBefore: false,
        continuesAfter: true,
      }),
      expect.objectContaining({
        date: "2026-10-15",
        start: 0,
        end: 6 * 60,
        continuesBefore: true,
        continuesAfter: false,
      }),
    ]);
    // ちょうど 24:00 に終わるイベントは翌日に区間を作らない
    expect(
      splitByDay(event("2", at("2026-10-14", "20:00"), at("2026-10-15", "00:00")))
    ).toHaveLength(1);
  });

  it("重なるイベントは横に並べ、重なりがつながっている間は同じ列数にする", () => {
    const segments = [
      event("a", at("2026-10-14", "10:00"), at("2026-10-14", "12:00")),
      event("b", at("2026-10-14", "11:00"), at("2026-10-14", "13:00")),
      event("c", at("2026-10-14", "12:00"), at("2026-10-14", "14:00")),
      event("d", at("2026-10-14", "15:00"), at("2026-10-14", "16:00")),
    ].flatMap(splitByDay);

    const placed = Object.fromEntries(
      assignColumns(segments).map((segment) => [
        segment.event.id,
        [segment.column, segment.columns, segment.cluster],
      ])
    );
    // a と b が重なり、c は a の後に左の列へ入る。b と c も重なるので 3 つで 2 列
    expect(placed).toEqual({
      a: [0, 2, 0],
      b: [1, 2, 0],
      c: [0, 2, 0],
      d: [0, 1, 1],
    });
  });

  it("短いイベントは最低の高さ（45 分）で重なりを判定する", () => {
    const segments = [
      event("a", at("2026-10-14", "10:00"), at("2026-10-14", "10:10")),
      event("b", at("2026-10-14", "10:30"), at("2026-10-14", "11:00")),
      event("c", at("2026-10-14", "10:45"), at("2026-10-14", "11:00")),
    ].flatMap(splitByDay);

    const placed = assignColumns(segments);
    expect(placed.map((segment) => [segment.event.id, segment.column, segment.columns])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
    ]);
  });

  it("横並びは 2 列までにし、あふれたイベントは「+N件」にまとめる", () => {
    const segments = assignColumns(
      ["a", "b", "c", "d"]
        .map((id) => splitByDay(event(id, at("2026-10-14", "19:00"), at("2026-10-14", "21:00"))))
        .flat()
    );
    const { visible, overflow } = limitColumns(segments, 2);

    expect(visible.map((segment) => [segment.event.id, segment.column, segment.columns])).toEqual([
      ["a", 0, 2],
    ]);
    expect(overflow).toEqual([
      { date: "2026-10-14", start: 19 * 60, end: 21 * 60, count: 3, column: 1, columns: 2 },
    ]);

    const two = assignColumns(
      ["a", "b"].flatMap((id) =>
        splitByDay(event(id, at("2026-10-14", "19:00"), at("2026-10-14", "21:00")))
      )
    );
    expect(limitColumns(two, 2)).toEqual({ visible: two, overflow: [] });
  });

  it("「+N件」は同時に 3 件以上重なる時間帯だけにし、2 件までの時間帯のイベントは出す", () => {
    // A=9–12、B/C=9–10、D=10–11。D は A としか重ならない
    const segments = assignColumns(
      [
        event("A", at("2026-10-14", "09:00"), at("2026-10-14", "12:00")),
        event("B", at("2026-10-14", "09:00"), at("2026-10-14", "10:00")),
        event("C", at("2026-10-14", "09:00"), at("2026-10-14", "10:00")),
        event("D", at("2026-10-14", "10:00"), at("2026-10-14", "11:00")),
      ].flatMap(splitByDay)
    );
    const { visible, overflow } = limitColumns(segments, 2);

    expect(
      visible
        .map((segment) => [segment.event.id, segment.column, segment.columns])
        .sort(([left], [right]) => String(left).localeCompare(String(right)))
    ).toEqual([
      ["A", 0, 2],
      ["D", 1, 2],
    ]);
    expect(overflow).toEqual([
      { date: "2026-10-14", start: 9 * 60, end: 10 * 60, count: 2, column: 1, columns: 2 },
    ]);
  });

  it("24 時間以上のイベントは終日・複数日の帯にし、週の範囲で切り詰める", () => {
    const conference = event("conf", at("2026-10-15", "10:00"), at("2026-10-16", "18:00"));
    const fromLastWeek = event("long", at("2026-10-08", "09:00"), at("2026-10-12", "17:00"));
    const toNextWeek = event("next", at("2026-10-17", "10:00"), at("2026-10-19", "10:00"));
    const timed = event("lt", at("2026-10-15", "19:00"), at("2026-10-15", "21:00"));
    const outside = event("old", at("2026-10-01", "10:00"), at("2026-10-02", "12:00"));

    const layout = layoutWeek([conference, fromLastWeek, toNextWeek, timed, outside], week);

    expect(
      layout.allDay.map((bar) => [
        bar.event.id,
        bar.startIndex,
        bar.endIndex,
        bar.lane,
        bar.continuesBefore,
        bar.continuesAfter,
      ])
    ).toEqual([
      ["long", 0, 1, 0, true, false],
      ["conf", 4, 5, 0, false, false],
      ["next", 6, 6, 0, false, true],
    ]);
    expect(layout.allDayLanes).toBe(1);
    expect(layout.timed.get("2026-10-15")?.map((segment) => segment.event.id)).toEqual(["lt"]);
    // 日ごとの件数は帯と時間軸の両方を数える
    expect(countOnDate(layout, "2026-10-15")).toBe(2);
    expect(countOnDate(layout, "2026-10-11")).toBe(1);
    expect(countOnDate(layout, "2026-10-13")).toBe(0);
  });

  it("帯が重なるときは段を分ける", () => {
    const layout = layoutWeek(
      [
        event("a", at("2026-10-12", "10:00"), at("2026-10-14", "18:00")),
        event("b", at("2026-10-13", "10:00"), at("2026-10-15", "18:00")),
        event("c", at("2026-10-15", "09:00"), at("2026-10-16", "18:00")),
      ],
      week
    );
    expect(layout.allDay.map((bar) => [bar.event.id, bar.lane])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 0],
    ]);
    expect(layout.allDayLanes).toBe(2);
  });

  it("週に重なるかは開始日と終了日（0:00 終わりは前の日）で決める", () => {
    expect(
      overlapsDates(
        event("1", at("2026-10-10", "20:00"), at("2026-10-11", "00:00")),
        "2026-10-11",
        "2026-10-17"
      )
    ).toBe(false);
    expect(
      overlapsDates(
        event("2", at("2026-10-10", "20:00"), at("2026-10-11", "02:00")),
        "2026-10-11",
        "2026-10-17"
      )
    ).toBe(true);
    expect(
      overlapsDates(
        event("3", at("2026-10-17", "23:00"), at("2026-10-18", "01:00")),
        "2026-10-11",
        "2026-10-17"
      )
    ).toBe(true);
    expect(
      overlapsDates(
        event("4", at("2026-10-18", "10:00"), at("2026-10-18", "12:00")),
        "2026-10-11",
        "2026-10-17"
      )
    ).toBe(false);
  });

  it("最初に見せる時刻は 8 時。それより早いイベントがあればその時刻", () => {
    expect(initialScrollHour(layoutWeek([], week))).toBe(8);
    expect(
      initialScrollHour(
        layoutWeek([event("1", at("2026-10-14", "10:00"), at("2026-10-14", "11:00"))], week)
      )
    ).toBe(8);
    expect(
      initialScrollHour(
        layoutWeek([event("1", at("2026-10-14", "06:30"), at("2026-10-14", "08:00"))], week)
      )
    ).toBe(6);
  });
});
