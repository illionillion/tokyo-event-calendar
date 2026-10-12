import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ViewToggle, WeekNavigation, WeekView } from "@/components/week-view";
import type { Event, Filters } from "@/lib/types";
import { weekDates } from "@/lib/week";

function event(overrides: Partial<Event> & Pick<Event, "id" | "startedAt" | "endedAt">): Event {
  return {
    title: `イベント${overrides.id}`,
    catch: null,
    description: null,
    date: overrides.startedAt.slice(0, 10),
    start: overrides.startedAt.slice(11, 16),
    end: overrides.endedAt.slice(11, 16),
    format: "offline",
    area: "港区",
    venueName: "",
    address: "",
    tags: [],
    imageUrl: null,
    accepted: 0,
    limit: null,
    url: `https://connpass.com/event/${overrides.id}/`,
    ...overrides,
  };
}

const filters: Filters = {
  date: "2026-10-14",
  areas: [],
  format: "all",
  keyword: "",
  view: "week",
};
const dates = weekDates("2026-10-14");
const events = [
  event({
    id: "1",
    title: "React LT Night",
    area: "北区",
    startedAt: "2026-10-14T19:00:00+09:00",
    endedAt: "2026-10-14T21:00:00+09:00",
  }),
  event({
    id: "2",
    title: "Go もくもく会",
    format: "online",
    area: "",
    startedAt: "2026-10-14T19:30:00+09:00",
    endedAt: "2026-10-14T20:30:00+09:00",
  }),
  event({
    id: "3",
    title: "CloudNative Days",
    startedAt: "2026-10-15T10:00:00+09:00",
    endedAt: "2026-10-16T18:00:00+09:00",
  }),
];

function renderWeek(overrides: Partial<Parameters<typeof WeekView>[0]> = {}) {
  const onOpenDay = vi.fn();
  render(
    <WeekView
      filters={filters}
      dates={dates}
      events={events}
      today="2026-10-12"
      now="2026-10-12T03:00:00.000Z"
      onOpenDay={onOpenDay}
      onChangeFilters={vi.fn()}
      {...overrides}
    />
  );
  return { onOpenDay };
}

describe("WeekView", () => {
  it("サムネイルは列を 1 本で使う 90 分以上のブロックと SP の一覧に出し、画像がなければ頭文字にする", () => {
    const solo = event({
      id: "9",
      title: "Rust 勉強会",
      imageUrl: "https://media.connpass.com/thumbs/9.png",
      startedAt: "2026-10-13T10:00:00+09:00",
      endedAt: "2026-10-13T12:00:00+09:00",
    });
    const { container } = render(
      <WeekView
        filters={filters}
        dates={dates}
        events={[...events, solo]}
        today="2026-10-12"
        now="2026-10-12T03:00:00.000Z"
        onOpenDay={vi.fn()}
        onChangeFilters={vi.fn()}
      />
    );
    const grid = screen.getByRole("group", { name: "週の時間割" });
    const rust = within(grid).getByRole("link", { name: /^Rust 勉強会/ });
    expect(rust).toHaveAttribute("data-thumbnail", "true");
    expect(rust.querySelector("img")).toHaveAttribute(
      "src",
      "https://media.connpass.com/thumbs/9.png"
    );
    // 横に 2 本並ぶブロックは文字を優先してサムネを出さない
    expect(within(grid).getByRole("link", { name: /^React LT Night/ })).not.toHaveAttribute(
      "data-thumbnail"
    );
    // SP の一覧は全件サムネ付き。画像のないイベントは頭文字
    const agendaLinks = container.querySelectorAll(".lg\\:hidden a[href]");
    expect(agendaLinks.length).toBeGreaterThan(0);
    const reactRow = Array.from(agendaLinks).find((a) => a.textContent?.includes("React LT Night"));
    expect(reactRow?.textContent).toContain("R");
    expect(reactRow?.querySelector("span[aria-hidden='true']")).toHaveTextContent("R");
  });

  it("PC の時間割は日の列に最低幅を持たせ、狭い画面では横スクロールにする", () => {
    renderWeek();
    expect(screen.getByTestId("week-grid-inner")).toHaveStyle({ minWidth: `${48 + 148 * 7}px` });
    expect(screen.getByRole("group", { name: "週の時間割" })).toHaveClass("overflow-x-auto");
  });

  it("PC の時間割で、イベントは時刻・エリア・タイトルを出し、connpass を開くリンクにする", () => {
    renderWeek();
    const grid = screen.getByRole("group", { name: "週の時間割" });
    const wednesday = within(grid).getByRole("group", { name: "10月14日（水）" });

    const react = within(wednesday).getByRole("link", { name: /^React LT Night/ });
    // 横に 2 本並ぶブロックは開始時刻だけ。終了時刻は読み上げ名に残す
    expect(react).toHaveTextContent("19:00〜");
    expect(react).toHaveAccessibleName(/19:00〜21:00/);
    expect(react).toHaveTextContent("北区");
    expect(react).toHaveTextContent("React LT Night");
    expect(react).toHaveAttribute("href", "https://connpass.com/event/1/");
    expect(react).toHaveAttribute("target", "_blank");

    const go = within(wednesday).getByRole("link", { name: /^Go もくもく会/ });
    expect(go).toHaveTextContent("オンライン");
    // 重なる 2 件は横に並べる
    expect(react).toHaveAttribute("data-columns", "2");
    expect(go).toHaveAttribute("data-column", "1");
    // 19:00 → 56px × 19
    expect(react).toHaveStyle({ top: `${56 * 19}px` });

    // 24 時間以上のイベントは上の帯
    expect(within(grid).getByRole("link", { name: /^CloudNative Days/ })).toHaveTextContent(
      "10:00 CloudNative Days"
    );
  });

  it("日付の見出しに件数を出し、押すとその日の一覧を開く", async () => {
    const user = userEvent.setup();
    const { onOpenDay } = renderWeek();
    const grid = screen.getByRole("group", { name: "週の時間割" });

    expect(screen.getByTestId("day-count-2026-10-14")).toHaveTextContent("2件");
    expect(screen.getByTestId("day-count-2026-10-16")).toHaveTextContent("1件");
    expect(screen.getByTestId("day-count-2026-10-11")).toHaveTextContent("0件");

    await user.click(within(grid).getByRole("button", { name: "10月14日（水） 2件の一覧を開く" }));
    expect(onOpenDay).toHaveBeenCalledWith("2026-10-14");
  });

  it("見出しは土曜を青、日曜・祝日を赤にし、今日・選択中の日はその強調を優先する", () => {
    renderWeek();
    const grid = screen.getByRole("group", { name: "週の時間割" });

    expect(within(grid).getByRole("button", { name: /^10月11日（日）/ })).toHaveClass(
      "text-holiday"
    );
    expect(within(grid).getByRole("button", { name: /^10月17日（土）/ })).toHaveClass(
      "text-saturday"
    );
    // 10/12 はスポーツの日だが今日なので今日の赤枠
    const today = within(grid).getByRole("button", { name: /^10月12日（月） スポーツの日 今日/ });
    expect(today).toHaveClass("text-primary");
    expect(today).not.toHaveClass("text-holiday");
    const selected = within(grid).getByRole("button", { name: /^10月14日（水）/ });
    expect(selected).toHaveClass("bg-primary", "text-white");
  });

  it("3 件以上重なると「+N件」にまとめ、押すとその日の一覧を開く", async () => {
    const user = userEvent.setup();
    const crowded = ["a", "b", "c", "d"].map((id) =>
      event({
        id,
        startedAt: "2026-10-16T19:00:00+09:00",
        endedAt: "2026-10-16T21:00:00+09:00",
      })
    );
    const { onOpenDay } = renderWeek({ events: crowded });
    const grid = screen.getByRole("group", { name: "週の時間割" });
    const friday = within(grid).getByRole("group", { name: "10月16日（金）" });

    expect(within(friday).getAllByRole("link")).toHaveLength(1);
    await user.click(within(friday).getByRole("button", { name: "ほか3件（その日の一覧を開く）" }));
    expect(onOpenDay).toHaveBeenCalledWith("2026-10-16");
    expect(screen.getByTestId("day-count-2026-10-16")).toHaveTextContent("4件");
  });

  it("SP 用の日ごとの一覧にも 7 日分を出し、日付を押すとその日の一覧を開く", async () => {
    const user = userEvent.setup();
    const { onOpenDay } = renderWeek();
    const agenda = screen.getByRole("list", { name: "週の日ごとの一覧" });

    expect(within(agenda).getAllByRole("heading", { level: 3 })).toHaveLength(7);
    expect(within(agenda).getAllByText("イベントはありません")).toHaveLength(4);
    expect(within(agenda).getAllByRole("link", { name: /^CloudNative Days/ })).toHaveLength(2);

    await user.click(within(agenda).getByRole("button", { name: /^10月15日（木）/ }));
    expect(onOpenDay).toHaveBeenCalledWith("2026-10-15");
  });
});

describe("WeekNavigation / ViewToggle", () => {
  it("前の週・次の週は 7 日ずらし、今日で今日に戻る", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <WeekNavigation
        dates={dates}
        today="2026-10-12"
        selectedDate="2026-10-14"
        onSelectDate={onSelectDate}
      />
    );

    expect(screen.getByText("2026年10月11日〜17日")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "前の週" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-10-07");
    await user.click(screen.getByRole("button", { name: "次の週" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-10-21");
    await user.click(screen.getByRole("button", { name: "今日" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-10-12");
  });

  it("月と週を切り替える", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewToggle view="month" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "月" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "週" }));
    expect(onChange).toHaveBeenCalledWith("week");
  });
});
