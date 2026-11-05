import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventExplorer } from "@/components/event-explorer";
import { toEventSummary } from "@/lib/event-data";
import { clearEventDataCache } from "@/lib/event-data-client";
import type { Event } from "@/lib/types";

const search = vi.hoisted(() => ({ params: new URLSearchParams("date=2026-09-24") }));

vi.mock("next/navigation", () => ({ useSearchParams: () => search.params }));

function makeEvent(id: string, date: string, extra: Partial<Event> = {}): Event {
  return {
    id,
    title: `イベント${id}`,
    catch: null,
    description: null,
    date,
    start: "19:00",
    end: "21:00",
    startedAt: `${date}T19:00:00+09:00`,
    endedAt: `${date}T21:00:00+09:00`,
    format: "offline",
    area: "渋谷区",
    venueName: "会場",
    address: "東京都渋谷区",
    tags: [],
    imageUrl: null,
    accepted: 1,
    limit: 10,
    url: `https://connpass.com/event/${id}/`,
    cancelled: false,
    ...extra,
  };
}

const events = [
  makeEvent("1", "2026-09-24", { description: "ハンズオンの説明" }),
  makeEvent("2", "2026-09-25", { area: "港区", cancelled: true }),
  makeEvent("3", "2026-09-10", { area: "新宿区", description: "ハンズオン" }),
  makeEvent("4", "2026-11-03", { area: "北区" }),
];

let fetchMock: ReturnType<typeof vi.fn>;
let failDays = false;

function requestedPaths(): string[] {
  return fetchMock.mock.calls.map(([url]) => String(url));
}

beforeEach(() => {
  failDays = false;
  fetchMock = vi.fn(async (url: string) => {
    if (url === "/data/events/index.json") {
      const dates: Record<string, number> = {};
      for (const event of events) dates[event.date] = (dates[event.date] ?? 0) + 1;
      return Response.json({ generatedAt: "", dates });
    }
    if (url === "/data/events-lite.json") return Response.json(events.map(toEventSummary));
    const date = /\/data\/events\/(.+)\.json$/.exec(url)?.[1];
    if (failDays) return new Response("", { status: 500 });
    return Response.json(events.filter((event) => event.date === date));
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  clearEventDataCache();
  vi.unstubAllGlobals();
  search.params = new URLSearchParams("date=2026-09-24");
});

function renderExplorer() {
  return render(<EventExplorer today="2026-09-24" now="2026-09-24T08:00:00.000Z" />);
}

describe("EventExplorer（静的ファイルから読む）", () => {
  it("読み込み中を出し、選んだ日のファイルだけを取って一覧にする", async () => {
    renderExplorer();
    expect(screen.getByRole("status")).toHaveTextContent("イベントを読み込み中です");

    expect(await screen.findByRole("link", { name: /イベント1/ })).toBeInTheDocument();
    const dayFiles = requestedPaths().filter((path) => /\d{4}-\d{2}-\d{2}\.json$/.test(path));
    expect(dayFiles).toEqual(["/data/events/2026-09-24.json"]);
  });

  it("カレンダーの印とエリアの候補は軽い一覧から全期間で決める", async () => {
    renderExplorer();
    await screen.findByRole("link", { name: /イベント1/ });

    const calendar = screen.getByRole("region", { name: "ミニカレンダー" });
    expect(
      within(calendar).getByRole("button", { name: /^2026-09-10 .*イベントあり/ })
    ).toBeVisible();
    expect(
      within(calendar).getByRole("button", { name: /^2026-09-25 .*イベントあり/ })
    ).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /^北区/ })).toBeInTheDocument();
  });

  it("週表示では 7 日分を取り、中止のイベントも出す", async () => {
    search.params = new URLSearchParams("date=2026-09-24&view=week");
    renderExplorer();

    const friday = await screen.findByRole("region", { name: /^9月25日（金）/ });
    expect(within(friday).getByRole("link", { name: /イベント2/ })).toHaveTextContent("中止");
    // 索引にある日（9/24・9/25）だけを取りにいく
    const dayFiles = requestedPaths().filter((path) => /\d{4}-\d{2}-\d{2}\.json$/.test(path));
    expect(dayFiles.sort()).toEqual([
      "/data/events/2026-09-24.json",
      "/data/events/2026-09-25.json",
    ]);
  });

  it("キーワードがあるときは、カレンダーの月の分を取って説明文から印を付ける", async () => {
    search.params = new URLSearchParams("date=2026-09-24&keyword=ハンズオン");
    renderExplorer();
    await screen.findByRole("link", { name: /イベント1/ });

    const calendar = screen.getByRole("region", { name: "ミニカレンダー" });
    expect(
      await within(calendar).findByRole("button", { name: /^2026-09-10 .*イベントあり/ })
    ).toBeVisible();
    expect(within(calendar).getByRole("button", { name: /^2026-09-25 / })).not.toHaveAccessibleName(
      /イベントあり/
    );
    expect(requestedPaths()).toContain("/data/events/2026-09-10.json");
  });

  it("読み込みに失敗したら知らせ、もう一度読み込める", async () => {
    const user = userEvent.setup();
    failDays = true;
    renderExplorer();

    expect(await screen.findByRole("alert")).toHaveTextContent("読み込めませんでした");
    failDays = false;
    await user.click(screen.getByRole("button", { name: "もう一度読み込む" }));
    expect(await screen.findByRole("link", { name: /イベント1/ })).toBeInTheDocument();
  });

  it("開いたまま索引から日が消えても、再読み込みで空の一覧に戻る", async () => {
    const user = userEvent.setup();
    let dates: Record<string, number> = { "2026-09-24": 1 };
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/data/events/index.json") return Response.json({ generatedAt: "", dates });
      if (url === "/data/events-lite.json") return Response.json([]);
      return new Response("", { status: 404 });
    });
    renderExplorer();

    expect(await screen.findByRole("alert")).toHaveTextContent("404");
    dates = {};
    await user.click(screen.getByRole("button", { name: "もう一度読み込む" }));

    expect(await screen.findByText("この日のイベントはありません")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(requestedPaths().filter((path) => path === "/data/events/index.json")).toHaveLength(2);
    expect(requestedPaths().filter((path) => path.includes("2026-09-24"))).toEqual([
      "/data/events/2026-09-24.json",
    ]);
  });

  it("失敗した日のエラーは、別の日を読み込んでいる間は出さない", async () => {
    let releaseNext: () => void = () => {};
    const nextDay = new Promise<Response>((resolve) => {
      releaseNext = () => resolve(Response.json([]));
    });
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/data/events/index.json") {
        return Response.json({
          generatedAt: "",
          dates: { "2026-09-24": 1, "2026-09-25": 1 },
        });
      }
      if (url === "/data/events-lite.json") return Response.json([]);
      if (url.endsWith("/2026-09-24.json")) return new Response("", { status: 503 });
      if (url.endsWith("/2026-09-25.json")) return nextDay;
      return Response.json([]);
    });
    const { rerender } = renderExplorer();

    expect(await screen.findByRole("alert")).toHaveTextContent("503");
    search.params = new URLSearchParams("date=2026-09-25");
    rerender(<EventExplorer today="2026-09-24" now="2026-09-24T08:00:00.000Z" />);

    expect(await screen.findByRole("status")).toHaveTextContent("イベントを読み込み中です");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await act(async () => {
      releaseNext();
    });
    expect(await screen.findByText("この日のイベントはありません")).toBeInTheDocument();
  });

  it("索引の失敗は日付を変えても残る", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/data/events/index.json") return new Response("", { status: 503 });
      return Response.json([]);
    });
    const { rerender } = renderExplorer();

    expect(await screen.findByRole("alert")).toHaveTextContent("503");
    search.params = new URLSearchParams("date=2026-09-25");
    rerender(<EventExplorer today="2026-09-24" now="2026-09-24T08:00:00.000Z" />);
    expect(screen.getByRole("alert")).toHaveTextContent("503");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
