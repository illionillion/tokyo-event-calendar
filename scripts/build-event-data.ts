/**
 * `data/events.json`（connpass のスナップショット）から、ブラウザが取りにいく静的な JSON を
 * `public/data/` に書き出す。`pnpm build` / `pnpm dev` の前に毎回動く（生成物はコミットしない）。
 * イベントのデータを Worker にバンドルしないための手順。
 * 終了から 7 日を超えたイベントは、スナップショットに残っていても日別 JSON と軽い一覧には出さない。
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayKey } from "../lib/dates";
import { buildDailyEventData, EVENT_INDEX_PATH, EVENT_LITE_PATH } from "../lib/event-data";
import { omitEventsEndedBeyondRetention } from "../lib/event-retention";
import { materializeEvents } from "../lib/events";
import type { EventSnapshot } from "../lib/types";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(publicDir, "data");
const daysDir = path.join(dataDir, "events");

async function main(): Promise<void> {
  const snapshot = JSON.parse(
    await readFile(path.join(rootDir, "data", "events.json"), "utf8")
  ) as EventSnapshot;
  const now = new Date();
  const retained = omitEventsEndedBeyondRetention(snapshot.events, now);
  const omitted = snapshot.events.length - retained.length;
  if (omitted > 0) {
    console.log(`終了から7日を超えたイベントを ${omitted} 件、表示用データから除きました`);
  }
  const events = materializeEvents(todayKey(now), retained);
  const { index, days, lite } = buildDailyEventData(events, new Date().toISOString());

  // 前回の生成物に残った古い日のファイルを消してから書く
  await rm(dataDir, { recursive: true, force: true });
  await mkdir(daysDir, { recursive: true });

  await Promise.all([
    ...[...days].map(([date, list]) =>
      writeFile(path.join(daysDir, `${date}.json`), JSON.stringify(list))
    ),
    writeFile(path.join(publicDir, EVENT_INDEX_PATH), JSON.stringify(index)),
    writeFile(path.join(publicDir, EVENT_LITE_PATH), JSON.stringify(lite)),
  ]);

  console.log(`イベントデータを書き出しました: ${events.length} 件 / ${days.size} 日分`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
