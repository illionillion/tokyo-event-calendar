/**
 * connpass API v2 から東京都・神奈川県・埼玉県・千葉県のイベントを取得し、`data/events.json` に書き出す。
 * `data/connpass-supplements.json` の subdomain と event_id も、都道府県なしの検索として足す
 * （都道府県のインデックスに載らないイベントの補完。おすすめとしての優遇ではない）。
 * 通常は GitHub Actions（.github/workflows/update-events.yml）の定期実行で 1 日 1 回動く。
 * 同じワークフローの手動実行や、手元から下のコマンドで動かすこともできる（サイトからは呼ばない）。
 *
 *   pnpm fetch:events          … CI（環境変数は workflow が渡す）
 *   pnpm fetch:events:local    … 手元（package.json で --env-file=.env）
 *   CONNPASS_API_KEY=... pnpm fetch:events
 *
 * API キーは環境変数からだけ読み、ログやファイルには出さない。
 * 補完設定の読み取りか、いずれかの API 呼び出しが失敗したときは、スナップショットを書き出さない。
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import {
  buildSnapshot,
  fetchConnpassEvents,
  parseConnpassSupplements,
  REQUEST_INTERVAL_MS,
  TARGET_PREFECTURES,
  targetMonths,
} from "../lib/connpass-snapshot";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "data", "events.json");
const supplementsPath = path.join(rootDir, "data", "connpass-supplements.json");

async function main(): Promise<void> {
  const apiKey = process.env.CONNPASS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "環境変数 CONNPASS_API_KEY が設定されていません（手元: pnpm fetch:events:local または CONNPASS_API_KEY=... pnpm fetch:events）"
    );
  }

  const supplements = parseConnpassSupplements(await readSupplements());
  const months = targetMonths(new Date());
  const supplementNote = [
    supplements.subdomains.length > 0 ? `subdomain=${supplements.subdomains.join(",")}` : null,
    supplements.eventIds.length > 0 ? `event_id=${supplements.eventIds.join(",")}` : null,
  ]
    .filter((part) => part !== null)
    .join(" ");
  console.log(
    `connpass API: ym=${months.join(",")} prefecture=${TARGET_PREFECTURES.join(",")}${supplementNote ? ` ${supplementNote}` : ""} interval=${REQUEST_INTERVAL_MS}ms`
  );

  const events = await fetchConnpassEvents({
    apiKey,
    months,
    supplements,
    log: (message) => console.log(message),
  });
  if (events.length === 0) {
    throw new Error("イベントが 0 件だったため、スナップショットを更新しません");
  }

  const snapshot = buildSnapshot(events);
  const options = (await resolveConfig(outputPath)) ?? {};
  const json = await format(JSON.stringify(snapshot, null, 2), {
    ...options,
    filepath: outputPath,
  });
  await writeFile(outputPath, json);
  console.log(
    `${snapshot.events.length} 件を ${path.relative(rootDir, outputPath)} に書き出しました`
  );
}

async function readSupplements(): Promise<unknown> {
  try {
    return JSON.parse(await readFile(supplementsPath, "utf8")) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `補完設定 ${path.relative(rootDir, supplementsPath)} を読み取れませんでした: ${detail}`
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
