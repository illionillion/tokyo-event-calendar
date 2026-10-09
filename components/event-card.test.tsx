import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  imageUrl: null,
  accepted: 48,
  limit: 80,
  url: "https://connpass.com/event/390004/",
};

describe("EventCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("画像 URL があるときはその画像を表示する", () => {
    const { container } = render(
      <EventCard
        event={{ ...event, imageUrl: "https://media.connpass.com/thumbs/00/00/example.png" }}
        now="2026-09-24T08:00:00.000Z"
      />
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://media.connpass.com/thumbs/00/00/example.png"
    );
  });

  it("画像を読み込めなかったら（URL の失効など）頭文字のサムネに切り替える", () => {
    const { container } = render(
      <EventCard
        event={{ ...event, imageUrl: "https://media.connpass.com/thumbs/00/00/expired.png" }}
        now="2026-09-24T08:00:00.000Z"
      />
    );

    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    fireEvent.error(image as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("ハイドレーション前にすでに読み込みに失敗していた画像も、頭文字のサムネに切り替える", () => {
    // onError が届く前に失敗が確定している状態（complete かつ naturalWidth が 0）
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);

    const { container } = render(
      <EventCard
        event={{ ...event, imageUrl: "https://media.connpass.com/thumbs/00/00/expired.png" }}
        now="2026-09-24T08:00:00.000Z"
      />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("読み込み中や読み込めた画像はそのまま表示する", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(640);

    const { container } = render(
      <EventCard
        event={{ ...event, imageUrl: "https://media.connpass.com/thumbs/00/00/example.png" }}
        now="2026-09-24T08:00:00.000Z"
      />
    );

    expect(container.querySelector("img")).not.toBeNull();
  });

  it("画像 URL が無いときは頭文字のサムネを表示する", () => {
    const { container } = render(<EventCard event={event} now="2026-09-24T08:00:00.000Z" />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("connpass のイベントページへ遷移できる", () => {
    render(<EventCard event={event} now="2026-09-24T08:00:00.000Z" />);

    const link = screen.getByRole("link", { name: /React LT Night Tokyo/ });
    expect(link).toHaveAttribute("href", "https://connpass.com/event/390004/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("19:00–21:30")).toBeInTheDocument();
  });

  it("人数・場所・タグをカード上で識別できる", () => {
    render(<EventCard event={event} now="2026-09-24T08:00:00.000Z" />);

    const capacity = screen.getByText("48 / 80人");
    expect(capacity).toHaveClass("font-semibold", "rounded-full", "text-primary");

    const place = screen.getByText("渋谷区 渋谷ヒカリエ 8F");
    expect(place).toHaveClass("font-medium");
    expect(place.parentElement).toHaveClass("text-foreground");
    expect(place.parentElement?.querySelector("[data-place-icon='venue']")).toBeInTheDocument();

    expect(screen.getByText("#React")).toHaveClass(
      "rounded-md",
      "border-border",
      "bg-surface",
      "font-medium"
    );
    expect(screen.getByText("#LT")).toHaveClass("rounded-md", "bg-surface");
  });

  it("終了したイベントは終了と人数を併記する", () => {
    render(<EventCard event={event} now="2026-09-24T13:00:00.000Z" />);

    expect(screen.getByText("終了")).toHaveClass("rounded-full", "font-semibold");
    expect(screen.getByText("48 / 80人")).toHaveClass("font-semibold", "bg-surface");
  });

  it("オンライン開催は場所をオンラインとして強調する", () => {
    render(
      <EventCard
        event={{ ...event, format: "online", area: "", venueName: "Teams Online Meeting" }}
        now="2026-09-24T08:00:00.000Z"
      />
    );

    const place = screen.getByText("オンライン");
    expect(place).toHaveClass("font-medium", "text-primary");
    expect(place.parentElement?.querySelector("[data-place-icon='online']")).toBeInTheDocument();
    expect(screen.queryByText(/Teams Online Meeting/)).not.toBeInTheDocument();
  });

  it("オンライン併用はエリアと会場を場所行に出す", () => {
    render(<EventCard event={{ ...event, format: "hybrid" }} now="2026-09-24T08:00:00.000Z" />);

    expect(screen.getByText("渋谷区（オンライン併用） 渋谷ヒカリエ 8F")).toBeInTheDocument();
  });

  it("定員がないときは参加人数だけをピルで出す", () => {
    render(<EventCard event={{ ...event, limit: null }} now="2026-09-24T08:00:00.000Z" />);

    expect(screen.getByText("48人")).toHaveClass("font-semibold", "rounded-full");
  });

  it("時間帯は太字で、開催前は本文色・終了後は一段薄い色にする", () => {
    const { unmount } = render(<EventCard event={event} now="2026-09-24T08:00:00.000Z" />);
    expect(screen.getByText("19:00–21:30")).toHaveClass("font-semibold", "text-foreground");
    expect(screen.getByText("19:00–21:30")).not.toHaveClass("text-secondary");
    unmount();

    render(<EventCard event={event} now="2026-09-24T13:00:00.000Z" />);
    expect(screen.getByText("19:00–21:30")).toHaveClass("font-semibold", "text-secondary");
    expect(screen.getByText("19:00–21:30")).not.toHaveClass("text-foreground");
  });
});
