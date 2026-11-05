import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSummaries } from "@/lib/crawler-data";

const { readFileMock } = vi.hoisted(() => ({ readFileMock: vi.fn() }));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
  default: { readFile: readFileMock },
}));

const contextKey = Symbol.for("__cloudflare-context__");

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[contextKey];
  readFileMock.mockReset();
  vi.unstubAllGlobals();
});

function requestUrl(input: Request | string | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

describe("loadSummaries", () => {
  it("ASSETS が無いときは public のファイルを読み、fetch しない", async () => {
    readFileMock.mockResolvedValue(JSON.stringify([{ id: "1" }]));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadSummaries()).resolves.toEqual([{ id: "1" }]);
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/public\/data\/events-lite\.json$/),
      "utf8"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ASSETS は決まったオリジンのパスだけを取る", async () => {
    const fetchMock = vi.fn(async (input: Request | string | URL) => {
      expect(requestUrl(input)).toBe("https://assets.local/data/events-lite.json");
      return Response.json([{ id: "2" }]);
    });
    (globalThis as Record<symbol, unknown>)[contextKey] = { env: { ASSETS: { fetch: fetchMock } } };

    await expect(loadSummaries()).resolves.toEqual([{ id: "2" }]);
    expect(readFileMock).not.toHaveBeenCalled();
  });
});
