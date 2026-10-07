import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventExplorer } from "@/components/event-explorer";
import { parseFilters } from "@/lib/query";
import type { Event } from "@/lib/types";

vi.mock("next/navigation", () => {
  const params = new URLSearchParams("date=2026-09-24");
  return { useSearchParams: () => params };
});

const event: Event = {
  id: "1",
  title: "React LT Night",
  catch: null,
  description: "会場でハンズオンをします",
  date: "2026-09-24",
  start: "19:00",
  end: "21:00",
  startedAt: "2026-09-24T19:00:00+09:00",
  endedAt: "2026-09-24T21:00:00+09:00",
  format: "offline",
  area: "渋谷区",
  venueName: "渋谷ヒカリエ",
  address: "東京都渋谷区渋谷2-21-1",
  tags: ["React"],
  imageUrl: null,
  accepted: 10,
  limit: 20,
  url: "https://connpass.com/event/1/",
};

function renderExplorer() {
  return render(
    <EventExplorer events={[event]} today="2026-09-24" now="2026-09-24T08:00:00.000Z" />
  );
}

function lastHistoryUrl(spy: ReturnType<typeof vi.spyOn>): string {
  const url = spy.mock.calls.at(-1)?.[2];
  return typeof url === "string" ? url : "";
}

describe("EventExplorer", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
  });

  it("日付と絞り込みは pushState で URL を更新する", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer();

    await user.click(screen.getByRole("button", { name: "次の日" }));
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ date: "2026-09-25", area: null, format: "all", keyword: "" });

    await user.selectOptions(screen.getByRole("combobox", { name: "月を選択" }), "2026-10");
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ date: "2026-10-24" });

    await user.click(screen.getByRole("radio", { name: "オンライン" }));
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ format: "online" });

    await user.selectOptions(screen.getByRole("combobox", { name: "エリアを選択" }), "渋谷区");
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ area: "渋谷区" });
  });

  it("キーワードは replaceState で URL を更新する", async () => {
    const user = userEvent.setup({ delay: null });
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer();

    await user.type(screen.getByRole("searchbox", { name: "キーワード" }), "ハンズオン");
    await user.keyboard("{Enter}");

    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(replaceState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ date: "2026-09-24", keyword: "ハンズオン" });
  });
});
