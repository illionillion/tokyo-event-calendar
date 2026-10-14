import { EVENT_LITE_PATH } from "@/lib/event-data";
import type { EventSummary } from "@/lib/types";

type AssetsBinding = { fetch: (input: Request | string) => Promise<Response> };

/**
 * OpenNext（Cloudflare）が isolate ごとに置くコンテキスト。getCloudflareContext() と同じ場所を読む。
 * 静的ファイルの ASSETS バインディングがあれば、Worker の外へ出ずに静的ファイルを読める。
 */
function assetsBinding(): AssetsBinding | null {
  const context = (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] as
    { env?: { ASSETS?: AssetsBinding } } | undefined;
  return context?.env?.ASSETS ?? null;
}

/**
 * 全イベントの軽い一覧を、ビルド時に書き出した静的ファイルから読む（Worker にはバンドルしない）。
 * Cloudflare では ASSETS バインディング、それ以外（next start・next dev）は自分のオリジンから取る。
 */
export async function loadSummaries(origin: string): Promise<EventSummary[]> {
  const url = new URL(EVENT_LITE_PATH, origin).toString();
  const assets = assetsBinding();
  const response = assets ? await assets.fetch(url) : await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`イベントデータを読み込めませんでした（${response.status}）`);
  return (await response.json()) as EventSummary[];
}
