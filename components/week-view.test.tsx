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
  it("日曜〜土曜の日ごとに見出しと、日の一覧と同じイベントカードを並べる", () => {
    renderWeek();
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "10月11日（日）0件",
      "10月12日（月）スポーツの日今日0件",
      "10月13日（火）0件",
      "10月14日（水）2件",
      "10月15日（木）1件",
      "10月16日（金）0件",
      "10月17日（土）0件",
    ]);

    const wednesday = screen.getByRole("region", { name: /^10月14日（水）/ });
    const react = within(wednesday).getByRole("link", { name: /React LT Night/ });
    expect(react).toHaveAttribute("href", "https://connpass.com/event/1/");
    expect(react).toHaveTextContent("北区");
    expect(within(wednesday).getByRole("link", { name: /Go もくもく会/ })).toBeInTheDocument();
    // 小さなカードは時刻・タイトル・場所を出す（頭文字のサムネ付き）
    expect(react).toHaveTextContent("19:00–21:00");
    expect(react).toHaveTextContent("React LT Night");
    expect(within(wednesday).getByRole("link", { name: /Go もくもく会/ })).toHaveTextContent(
      "オンライン"
    );
    // 時間割・「+N件」・終日の帯は出さない
    expect(screen.queryByRole("group", { name: "週の時間割" })).not.toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+件$/)).not.toBeInTheDocument();
  });

  it("複数日のイベントは日の一覧と同じく開始日にだけ出す", () => {
    renderWeek();
    const thursday = screen.getByRole("region", { name: /^10月15日（木）/ });
    const friday = screen.getByRole("region", { name: /^10月16日（金）/ });
    expect(within(thursday).getByRole("link", { name: /CloudNative Days/ })).toBeInTheDocument();
    expect(
      within(friday).queryByRole("link", { name: /CloudNative Days/ })
    ).not.toBeInTheDocument();
  });

  it("PC は 7 列を並べ、狭いときは週の枠の中だけ横スクロールする", () => {
    renderWeek();
    expect(screen.getByTestId("week-columns")).toHaveClass(
      "lg:grid-cols-[repeat(7,minmax(var(--week-col-min),1fr))]"
    );
    expect(screen.getByTestId("week-columns")).toHaveStyle({ "--week-col-min": "136px" });
    expect(screen.getByTestId("week-scroller")).toHaveClass("lg:overflow-x-auto");
  });

  it("イベントのない日は短い案内を出す", () => {
    renderWeek();
    const sunday = screen.getByRole("region", { name: /^10月11日（日）/ });
    expect(within(sunday).getByText("イベントはありません")).toBeInTheDocument();
  });

  it("日付の見出しに件数を出し、押すとその日の一覧を開く", async () => {
    const user = userEvent.setup();
    const { onOpenDay } = renderWeek();
    expect(screen.getByTestId("day-count-2026-10-14")).toHaveTextContent("2件");

    await user.click(screen.getByRole("button", { name: "10月14日（水） 2件の一覧を開く" }));
    expect(onOpenDay).toHaveBeenCalledWith("2026-10-14");
  });

  it("見出しは土曜を青、日曜・祝日を赤にし、今日はその強調を優先する", () => {
    renderWeek();
    const dayText = (name: RegExp) =>
      within(screen.getByRole("button", { name })).getByText(/^\d+月\d+日（.）$/);

    expect(dayText(/^10月11日（日）/)).toHaveClass("text-holiday");
    expect(dayText(/^10月17日（土）/)).toHaveClass("text-saturday");
    // 10/12 はスポーツの日だが今日なので今日の赤
    const today = dayText(/^10月12日（月） スポーツの日 今日/);
    expect(today).toHaveClass("text-primary");
    expect(today).not.toHaveClass("text-holiday");
    expect(screen.getByText("スポーツの日")).toHaveClass("text-secondary");
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
