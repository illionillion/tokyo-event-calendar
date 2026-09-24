import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/lib/types";

const event: Event = {
  id: "390004",
  title: "React LT Night Tokyo",
  catch: null,
  description: null,
  date: "2026-09-24",
  start: "19:00",
  end: "21:30",
  startedAt: "2026-09-24T19:00:00+09:00",
  endedAt: "2026-09-24T21:30:00+09:00",
  format: "offline",
  area: "渋谷区",
  venueName: "渋谷ヒカリエ 8F",
  address: "東京都渋谷区渋谷2-21-1",
  tags: ["React", "LT"],
  accepted: 48,
  limit: 80,
  url: "https://connpass.com/event/390004/",
};

describe("EventCard", () => {
  it("connpass のイベントページへ遷移できる", () => {
    render(<EventCard event={event} now="2026-09-24T08:00:00.000Z" />);

    const link = screen.getByRole("link", { name: /React LT Night Tokyo/ });
    expect(link).toHaveAttribute("href", "https://connpass.com/event/390004/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("19:00–21:30")).toBeInTheDocument();
    expect(screen.getByText(/渋谷区/)).toBeInTheDocument();
    expect(screen.getByText("#React")).toBeInTheDocument();
    expect(screen.getByText("48 / 80人")).toBeInTheDocument();
  });

  it("終了したイベントには終了と表示する", () => {
    render(<EventCard event={event} now="2026-09-24T13:00:00.000Z" />);
    expect(screen.getByText("終了")).toBeInTheDocument();
  });
});
