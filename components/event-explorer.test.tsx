import { act, render, screen, within } from "@testing-library/react";
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
    ).toMatchObject({ date: "2026-09-25", areas: [], format: "all", keyword: "" });

    await user.selectOptions(screen.getByRole("combobox", { name: "月を選択" }), "2026-10");
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ date: "2026-10-24" });

    await user.click(screen.getByRole("radio", { name: "オンライン" }));
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ format: "online" });

    await user.click(screen.getByRole("checkbox", { name: /^渋谷区/ }));
    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ areas: ["渋谷区"] });
  });

  it("SP のカレンダーを開いて日付を選ぶと pushState で URL を更新して閉じる", async () => {
    const user = userEvent.setup();
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer();

    const toggle = screen.getByRole("button", { name: "カレンダーから日付を選ぶ" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const calendar = screen.getByRole("region", { name: "ミニカレンダー" });
    await user.click(within(calendar).getByRole("button", { name: /^2026-09-27 / }));

    expect(
      parseFilters(new URLSearchParams(lastHistoryUrl(pushState).split("?")[1]), "2026-09-24")
    ).toMatchObject({ date: "2026-09-27" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
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

  it("絞り込みを変えると、イベントの終了判定に今の時刻を使う", async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, "pushState");
    renderExplorer();
    expect(screen.queryByText("この日のイベントはすべて終了しています")).not.toBeInTheDocument();

    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-09-24T13:00:00.000Z"));
      await user.click(screen.getByRole("radio", { name: "オフライン" }));
    } finally {
      vi.useRealTimers();
    }

    expect(screen.getByText("この日のイベントはすべて終了しています")).toBeInTheDocument();
  });

  it("日付をまたいだあとの操作では、今日を東京の今の日付にする", async () => {
    const user = userEvent.setup();
    vi.spyOn(window.history, "pushState");
    renderExplorer();
    expect(screen.getByRole("button", { name: "今日" })).toBeDisabled();

    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-09-24T16:00:00.000Z"));
      await user.click(screen.getByRole("radio", { name: "オンライン" }));
    } finally {
      vi.useRealTimers();
    }

    expect(screen.getByRole("button", { name: "今日" })).toBeEnabled();
  });

  it("戻る・進むでも時刻を取り直す", () => {
    renderExplorer();
    expect(screen.queryByText("この日のイベントはすべて終了しています")).not.toBeInTheDocument();

    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-09-24T13:00:00.000Z"));
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    } finally {
      vi.useRealTimers();
    }

    expect(screen.getByText("この日のイベントはすべて終了しています")).toBeInTheDocument();
  });
});
