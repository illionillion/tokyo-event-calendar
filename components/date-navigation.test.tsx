import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateNavigation } from "@/components/date-navigation";

describe("DateNavigation", () => {
  it("近い日付と月を選べる", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();

    render(
      <DateNavigation selectedDate="2026-09-24" today="2026-09-24" onSelectDate={onSelectDate} />
    );

    expect(screen.getByRole("button", { name: "9月24日（木） 今日" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await user.click(screen.getByRole("button", { name: "次の日" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-25");

    await user.click(screen.getByRole("button", { name: "9月21日（月）" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-21");

    await user.selectOptions(screen.getByRole("combobox", { name: "月を選択" }), "2026-10");
    expect(onSelectDate).toHaveBeenCalledWith("2026-10-24");
  });
});
