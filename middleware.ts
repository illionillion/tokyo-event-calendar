import { type NextRequest, NextResponse } from "next/server";
import { CRAWLER_PATH, isCrawler } from "@/lib/bots";

/**
 * クローラーには `/` の静的ページ（イベントはブラウザが読む）の代わりに、
 * サーバーで描く軽いページを同じ URL で返す。クエリはそのまま渡す。
 *
 * Next.js 16 の proxy.ts は Node.js ランタイム固定で、OpenNext（Cloudflare）での対応がまだ実験的なため、
 * Edge ランタイムで動く従来の middleware.ts を使う。
 */
export function middleware(request: NextRequest): NextResponse {
  if (!isCrawler(request.headers.get("user-agent"))) {
    // 静的な `/` は共有キャッシュに乗る。UA を Vary に入れ、クローラーへその応答を返さない。
    return distinguishUserAgent(NextResponse.next());
  }

  const url = request.nextUrl.clone();
  url.pathname = CRAWLER_PATH;
  const response = NextResponse.rewrite(url);
  // 同じ URL で中身が変わるので、共有キャッシュに入れない
  response.headers.set("Cache-Control", "private, no-store");
  return distinguishUserAgent(response);
}

/**
 * middleware の Vary はページ側の Vary を上書きする。
 * 静的な `/` が付けていた Next.js の値を残し、User-Agent をキャッシュキーに加える。
 */
const NEXT_VARY = [
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
];

function distinguishUserAgent(response: NextResponse): NextResponse {
  const parts = new Set<string>(NEXT_VARY);
  for (const part of (response.headers.get("Vary") ?? "").split(",")) {
    const trimmed = part.trim();
    if (trimmed) parts.add(trimmed);
  }
  parts.add("User-Agent");
  response.headers.set("Vary", [...parts].join(", "));
  return response;
}

// `/` だけで動かす（静的ファイル・_next・データの JSON には動かさない）
export const config = {
  matcher: ["/"],
};
