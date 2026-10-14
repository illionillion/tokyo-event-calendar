import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventList } from "@/components/event-list";
import type { Event, Filters } from "@/lib/types";

function pastEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "1",
    title: "過去の勉強会",
    catch: null,
    description: null,
    date: "2026-09-20",
    start: "19:00",
    end: "21:00",
    startedAt: "2026-09-20T19:00:00+09:00",
    endedAt: "2026-09-20T21:00:00+09:00",
    format: "offline",
    area: "渋谷区",
    venueName: "",
    address: "東京都渋谷区",
    tags: [],
    imageUrl: null,
    accepted: 0,
    limit: null,
    url: "https://connpass.com/event/1/",
    cancelled: false,
    ...overrides,
  };
}

const filters: Filters = {
  date: "2026-09-28",
  areas: ["渋谷区"],
  format: "all",
  keyword: "",
  view: "month",
};

describe("EventList", () => {
  it("イベントがない日は移動と条件解除を案内する", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <EventList
        filters={filters}
        events={[]}
        today="2026-09-24"
        now="2026-09-24T00:00:00.000Z"
        onSelectDate={vi.fn()}
        onChangeFilters={vi.fn()}
        onClearFilters={onClearFilters}
      />
    );

    expect(screen.getByText("この日のイベントはありません")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "条件をクリア" }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("キーワードは語ごとにチップになり、1語外すと残りで再検索する", async () => {
    const user = userEvent.setup();
    const onChangeFilters = vi.fn();

    render(
      <EventList
        filters={{ ...filters, keyword: "React Native, LT, 渋谷" }}
        events={[]}
        today="2026-09-24"
        now="2026-09-24T00:00:00.000Z"
        onSelectDate={vi.fn()}
        onChangeFilters={onChangeFilters}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "React Nativeの条件を解除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reactの条件を解除" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LTの条件を解除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "渋谷の条件を解除" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "React Nativeの条件を解除" }));
    expect(onChangeFilters).toHaveBeenCalledWith({ keyword: "LT, 渋谷" });
  });

  it("エリアは選んだ数だけチップになり、1つ外すと残りのエリアで絞り込む", async () => {
    const user = userEvent.setup();
    const onChangeFilters = vi.fn();

    render(
      <EventList
        filters={{ ...filters, areas: ["北区", "港区", "千葉県"] }}
        events={[]}
        today="2026-09-24"
        now="2026-09-24T00:00:00.000Z"
        onSelectDate={vi.fn()}
        onChangeFilters={onChangeFilters}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "北区の条件を解除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "千葉県の条件を解除" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "港区の条件を解除" }));
    expect(onChangeFilters).toHaveBeenCalledWith({ areas: ["北区", "千葉県"] });
  });

  it("見出しの曜日に土日祝の色を付け、祝日名を出す。今日は今日の赤を優先する", () => {
    const props = {
      events: [],
      now: "2026-09-24T00:00:00.000Z",
      onSelectDate: vi.fn(),
      onChangeFilters: vi.fn(),
      onClearFilters: vi.fn(),
    };
    const { rerender } = render(
      <EventList {...props} filters={{ ...filters, date: "2026-10-12" }} today="2026-10-10" />
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "10月12日（月）スポーツの日"
    );
    expect(screen.getByText("（月）")).toHaveClass("text-holiday");
    expect(screen.getByText("スポーツの日")).toHaveClass("text-holiday");

    rerender(
      <EventList {...props} filters={{ ...filters, date: "2026-10-10" }} today="2026-10-10" />
    );
    expect(screen.getByText("（土）")).not.toHaveClass("text-saturday");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("10月10日（土）今日");

    rerender(
      <EventList {...props} filters={{ ...filters, date: "2026-10-17" }} today="2026-10-10" />
    );
    expect(screen.getByText("（土）")).toHaveClass("text-saturday");
  });

  it("過去の日でも、中止のイベントしかないときは「すべて終了」を出さない", () => {
    render(
      <EventList
        filters={{ ...filters, date: "2026-09-20", areas: [] }}
        events={[pastEvent({ cancelled: true })]}
        today="2026-09-24"
        now="2026-09-24T00:00:00.000Z"
        onSelectDate={vi.fn()}
        onChangeFilters={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.queryByText("この日のイベントはすべて終了しています")).not.toBeInTheDocument();
  });

  it("過去の日で、中止でないイベントがすべて終わっていれば「すべて終了」を出す", () => {
    render(
      <EventList
        filters={{ ...filters, date: "2026-09-20", areas: [] }}
        events={[pastEvent(), pastEvent({ id: "2", cancelled: true })]}
        today="2026-09-24"
        now="2026-09-24T00:00:00.000Z"
        onSelectDate={vi.fn()}
        onChangeFilters={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );

    expect(screen.getByText("この日のイベントはすべて終了しています")).toBeInTheDocument();
  });
});
