import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MiniCalendar } from "@/components/mini-calendar";

function renderCalendar(selectedDate: string, today: string) {
  return render(
    <MiniCalendar
      selectedDate={selectedDate}
      today={today}
      markedDates={new Set()}
      onSelectDate={vi.fn()}
    />
  );
}

describe("MiniCalendar", () => {
  it("曜日の見出しは日曜を赤、土曜を青にする", () => {
    renderCalendar("2026-10-14", "2026-10-14");

    expect(screen.getByText("日")).toHaveClass("text-holiday");
    expect(screen.getByText("土")).toHaveClass("text-saturday");
    expect(screen.getByText("月")).not.toHaveClass("text-holiday", "text-saturday");
  });

  it("土曜は青、日曜・祝日・振替休日は赤にする", () => {
    renderCalendar("2026-05-20", "2026-05-20");

    expect(screen.getByRole("button", { name: "2026-05-02 土曜日" })).toHaveClass("text-saturday");
    expect(screen.getByRole("button", { name: "2026-05-03 日曜日 憲法記念日" })).toHaveClass(
      "text-holiday"
    );
    const substitute = screen.getByRole("button", { name: "2026-05-06 水曜日 振替休日" });
    expect(substitute).toHaveClass("text-holiday");
    expect(substitute).toHaveAttribute("title", "振替休日");
    expect(screen.getByRole("button", { name: "2026-05-07 木曜日" })).toHaveClass(
      "text-foreground"
    );
  });

  it("選択中・今日・前後の月の日は土日祝の色より優先する", () => {
    // 2026-10-10（土）が今日、2026-10-11（日）が選択中
    renderCalendar("2026-10-11", "2026-10-10");

    const today = screen.getByRole("button", { name: "2026-10-10 土曜日" });
    expect(today).toHaveClass("text-primary");
    expect(today).not.toHaveClass("text-saturday");

    const selected = screen.getByRole("button", { name: "2026-10-11 日曜日" });
    expect(selected).toHaveClass("bg-primary", "text-white");
    expect(selected).not.toHaveClass("text-holiday");

    // 前の月の 9/27（日）と次の月の 11/7（土）は薄いグレーのまま
    expect(screen.getByRole("button", { name: "2026-09-27 日曜日" })).toHaveClass("text-muted");
    expect(screen.getByRole("button", { name: "2026-11-07 土曜日" })).toHaveClass("text-muted");
  });
});
