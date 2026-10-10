import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CollapsibleCalendar } from "@/components/collapsible-calendar";

function renderCalendar(onSelectDate = vi.fn()) {
  render(
    <CollapsibleCalendar
      selectedDate="2026-10-14"
      today="2026-10-10"
      markedDates={new Set(["2026-10-20"])}
      onSelectDate={onSelectDate}
    />
  );
  const toggle = screen.getByRole("button", { name: "カレンダーから日付を選ぶ" });
  const calendar = screen.getByRole("region", { name: "ミニカレンダー" });
  // 開閉の対象は aria-controls が指すラッパー（PC では lg:block で常に表示）
  const wrapper = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
  return { onSelectDate, toggle, calendar, wrapper };
}

describe("CollapsibleCalendar", () => {
  it("SP では閉じた状態で始まり、ボタンで開閉する", async () => {
    const user = userEvent.setup();
    const { toggle, calendar, wrapper } = renderCalendar();

    expect(wrapper).toContainElement(calendar);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveClass("lg:hidden");
    expect(wrapper).toHaveClass("hidden", "lg:block");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(wrapper).not.toHaveClass("hidden");
    expect(wrapper).toHaveClass("block");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(wrapper).toHaveClass("hidden");
  });

  it("開いて日付を選ぶと日付を渡して閉じ、フォーカスを開閉ボタンに戻す", async () => {
    const user = userEvent.setup();
    const { onSelectDate, toggle, calendar, wrapper } = renderCalendar();

    await user.click(toggle);
    await user.click(within(calendar).getByRole("button", { name: /^2026-10-20 / }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-10-20");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(wrapper).toHaveClass("hidden");
    expect(toggle).toHaveFocus();
  });

  it("開いた状態で Escape を押すと閉じる", async () => {
    const user = userEvent.setup();
    const { onSelectDate, toggle, calendar } = renderCalendar();

    await user.click(toggle);
    await user.click(within(calendar).getByRole("button", { name: "次の月" }));
    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(onSelectDate).not.toHaveBeenCalled();
  });

  it("閉じたまま（PC の表示）で日付を選んでも開閉の状態は変えない", async () => {
    const user = userEvent.setup();
    const { onSelectDate, toggle, calendar } = renderCalendar();

    await user.click(within(calendar).getByRole("button", { name: /^2026-10-21 / }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-10-21");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).not.toHaveFocus();
  });
});
