import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearEventDataCache,
  invalidateEventMetadata,
  loadDayEvents,
  loadEventIndex,
  loadEventSummaries,
} from "@/lib/event-data-client";

const index = { generatedAt: "", dates: { "2026-10-01": 1 } };

describe("event-data-client", () => {
  afterEach(() => {
    clearEventDataCache();
    vi.unstubAllGlobals();
  });

  it("同じファイルは 1 回だけ取りにいく", async () => {
    const fetchMock = vi.fn(async () => Response.json([{ id: "1" }]));
    vi.stubGlobal("fetch", fetchMock);

    await loadDayEvents("2026-10-01", index);
    await loadDayEvents("2026-10-01", index);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/events/2026-10-01.json");
  });

  it("索引に無い日は取りにいかず空にする", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadDayEvents("2026-10-09", index)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("失敗したら捨てて、次は取り直す", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(Response.json(index));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadEventIndex()).rejects.toThrow("503");
    await expect(loadEventIndex()).resolves.toEqual(index);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("再読み込みでは成功済みの索引と軽い一覧を捨てて取り直す", async () => {
    const nextIndex = { generatedAt: "", dates: {} };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(index))
      .mockResolvedValueOnce(Response.json([{ id: "1" }]))
      .mockResolvedValueOnce(Response.json(nextIndex))
      .mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadEventIndex()).resolves.toEqual(index);
    await expect(loadEventSummaries()).resolves.toEqual([{ id: "1" }]);
    await expect(loadEventIndex()).resolves.toEqual(index);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    invalidateEventMetadata();
    await expect(loadEventIndex()).resolves.toEqual(nextIndex);
    await expect(loadEventSummaries()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
