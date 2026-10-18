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
  if (!isCrawler(request.headers.get("user-agent"))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = CRAWLER_PATH;
  const response = NextResponse.rewrite(url);
  // 同じ URL で中身が変わるので、共有キャッシュに入れない
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// `/` だけで動かす（静的ファイル・_next・データの JSON には動かさない）
export const config = {
  matcher: ["/"],
};
