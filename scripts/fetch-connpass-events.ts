/**
 * connpass API v2 から東京都・神奈川県・埼玉県・千葉県のイベントを取得し、`data/events.json` に書き出す。
 * 通常は GitHub Actions（.github/workflows/update-events.yml）の定期実行で 1 日 1 回動く。
 * 同じワークフローの手動実行や、手元から下のコマンドで動かすこともできる（サイトからは呼ばない）。
 *
 *   pnpm fetch:events          … CI（環境変数は workflow が渡す）
 *   pnpm fetch:events:local    … 手元（package.json で --env-file=.env）
 *   CONNPASS_API_KEY=... pnpm fetch:events
 *
 * API キーは環境変数からだけ読み、ログやファイルには出さない。
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import {
  buildSnapshot,
  fetchConnpassEvents,
  REQUEST_INTERVAL_MS,
  TARGET_PREFECTURES,
  targetMonths,
} from "../lib/connpass-snapshot";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "data", "events.json");

async function main(): Promise<void> {
  const apiKey = process.env.CONNPASS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "環境変数 CONNPASS_API_KEY が設定されていません（手元: pnpm fetch:events:local または CONNPASS_API_KEY=... pnpm fetch:events）"
    );
  }

  const months = targetMonths(new Date());
  console.log(
    `connpass API: ym=${months.join(",")} prefecture=${TARGET_PREFECTURES.join(",")} interval=${REQUEST_INTERVAL_MS}ms`
  );

  const events = await fetchConnpassEvents({
    apiKey,
    months,
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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
