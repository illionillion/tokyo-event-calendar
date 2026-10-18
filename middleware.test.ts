import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

function request(ua: string | null, path = "/", search = ""): NextRequest {
  const headers = new Headers();
  if (ua !== null) headers.set("user-agent", ua);
  return new NextRequest(new URL(`http://localhost:3000${path}${search}`), { headers });
}

describe("middleware", () => {
  it("通常のブラウザはそのまま通し、共有キャッシュは UA で分ける", () => {
    const response = middleware(request("Mozilla/5.0 Chrome/120.0.0.0"));
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(response.headers.get("Vary")).toBe(
      "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, User-Agent"
    );
  });

  it("クローラーは /crawler へ書き換え、共有キャッシュに入れない", () => {
    const response = middleware(
      request(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "/",
        "?date=2026-10-20&view=week"
      )
    );
    const rewrite = response.headers.get("x-middleware-rewrite");
    expect(rewrite).toContain("/crawler?date=2026-10-20&view=week");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe(
      "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, User-Agent"
    );
  });
});
