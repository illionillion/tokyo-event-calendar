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
});
