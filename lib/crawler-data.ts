import { readFile } from "node:fs/promises";
import path from "node:path";
import { EVENT_LITE_PATH } from "@/lib/event-data";
import type { EventSummary } from "@/lib/types";

/** ASSETS はパスだけ見る。リクエストの Host は使わない。 */
const ASSET_ORIGIN = "https://assets.local";
const LITE_FILE = path.join(process.cwd(), "public", "data", "events-lite.json");

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
 * Cloudflare では ASSETS バインディング、それ以外（next start・next dev）は public/ のファイルを読む。
 * リクエストの Host や X-Forwarded-Host では取りにいかない。
 */
export async function loadSummaries(): Promise<EventSummary[]> {
  const assets = assetsBinding();
  if (!assets) return readLocalSummaries();

  const response = await assets.fetch(new URL(EVENT_LITE_PATH, ASSET_ORIGIN).toString());
  if (!response.ok) throw new Error(`イベントデータを読み込めませんでした（${response.status}）`);
  return (await response.json()) as EventSummary[];
}

async function readLocalSummaries(): Promise<EventSummary[]> {
  try {
    return JSON.parse(await readFile(LITE_FILE, "utf8")) as EventSummary[];
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? String(error.code) : "read";
    throw new Error(`イベントデータを読み込めませんでした（${code}）`);
  }
}
