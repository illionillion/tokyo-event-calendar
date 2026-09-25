import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventList } from "@/components/event-list";
import type { Filters } from "@/lib/types";

const filters: Filters = {
  date: "2026-09-28",
  area: "渋谷区",
  format: "all",
  keyword: "",
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
});
