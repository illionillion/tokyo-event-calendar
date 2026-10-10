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

    await user.click(screen.getByRole("button", { name: "9月21日（月） 敬老の日" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-21");

    await user.selectOptions(screen.getByRole("combobox", { name: "月を選択" }), "2026-10");
    expect(onSelectDate).toHaveBeenCalledWith("2026-10-24");
  });

  it("土曜は青、日曜・祝日は赤にし、選択中・今日・過去の日は色を付けない", () => {
    render(<DateNavigation selectedDate="2026-10-10" today="2026-10-08" onSelectDate={vi.fn()} />);

    const saturday = screen.getByRole("button", { name: "10月10日（土）" });
    expect(saturday).toHaveClass("bg-primary", "text-white");
    expect(saturday).not.toHaveClass("text-saturday");

    expect(screen.getByRole("button", { name: "10月11日（日）" })).toHaveClass("text-holiday");
    const holiday = screen.getByRole("button", { name: "10月12日（月） スポーツの日" });
    expect(holiday).toHaveClass("text-holiday");
    expect(holiday).toHaveAttribute("title", "スポーツの日");
    expect(screen.getByRole("button", { name: "10月13日（火）" })).toHaveClass("text-foreground");

    const today = screen.getByRole("button", { name: "10月8日（木） 今日" });
    expect(today).toHaveClass("text-primary");
    expect(screen.getByRole("button", { name: "10月7日（水）" })).toHaveClass("text-muted");
  });

  it("今日が土曜のときは青を混ぜず今日の赤だけにする", () => {
    render(<DateNavigation selectedDate="2026-10-08" today="2026-10-10" onSelectDate={vi.fn()} />);

    const today = screen.getByRole("button", { name: "10月10日（土） 今日" });
    expect(today).toHaveClass("text-primary");
    expect(today).not.toHaveClass("text-saturday");
    expect(today).not.toHaveClass("text-foreground");
    // 今日より前の日曜（10/4）は表示範囲外。今日より後の日曜は赤
    expect(screen.getByRole("button", { name: "10月11日（日）" })).toHaveClass("text-holiday");
  });
});
