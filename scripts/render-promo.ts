/**
 * data/events.json から、次の土曜投稿が案内する来週の紹介動画（LT / もくもく、縦横）を書き出す。
 * 公開パスは固定。中身は毎日のジョブで上書きする。
 * サムネはレンダー前に remotion/public/thumbs へ落とす。失敗したカードは文字だけ。
 *
 *   pnpm promo:prepare
 *   pnpm promo:render
 *   pnpm promo:render -- --date 2026-10-24 --only lt
 */
import { spawn } from "node:child_process";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../lib/promo-args";
import { formatDayHeading, parseDateKey, todayKey } from "../lib/dates";
import { materializeEvents } from "../lib/events";
import {
  PROMO_EVENT_CAP,
  PROMO_VARIANTS,
  promoDurationSeconds,
  promoPlaceLabel,
  promoTimeLabel,
  saturdayPostWeek,
  takePromoEvents,
} from "../lib/promo-selection";
import {
  contentLengthWithin,
  imageExtension,
  isHttpsUrl,
  MAX_THUMB_BYTES,
  readBodyUpTo,
} from "../lib/promo-thumbs";
import { siteTitle, siteUrl } from "../lib/site-metadata";
import type { Event, EventSnapshot } from "../lib/types";
import { formatWeekRange } from "../lib/week";
import type { PromoCard, PromoProps } from "../remotion/src/types";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const remotionDir = path.join(rootDir, "remotion");
const thumbDir = path.join(remotionDir, "public", "thumbs");
const propsDir = path.join(remotionDir, "props", "generated");
const outputDir = path.join(rootDir, "public", "promo", "videos");
const displayUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;

/** Workers の静的ファイル上限（25 MiB 前後）に余裕を残す。 */
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const THUMB_TIMEOUT_MS = 15_000;

function concurrency(): string {
  const raw = process.env.PROMO_CONCURRENCY ?? "2";
  if (!/^[1-9][0-9]?$/.test(raw)) {
    throw new Error(`PROMO_CONCURRENCY が不正です: ${raw}`);
  }
  return raw;
}

async function downloadThumb(event: Event): Promise<string | null> {
  if (!isHttpsUrl(event.imageUrl) || !/^[0-9]+$/.test(event.id)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), THUMB_TIMEOUT_MS);
  try {
    const response = await fetch(event.imageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.1",
        "user-agent": "tokyo-event-calendar-promo",
      },
    });
    if (
      !response.ok ||
      !contentLengthWithin(response.headers.get("content-length"), MAX_THUMB_BYTES)
    ) {
      await response.body?.cancel().catch(() => undefined);
      return null;
    }
    const bytes = await readBodyUpTo(response.body, MAX_THUMB_BYTES);
    if (!bytes) return null;
    const extension = imageExtension(bytes);
    if (!extension) return null;
    const filename = `${event.id}.${extension}`;
    await writeFile(path.join(thumbDir, filename), bytes);
    return `thumbs/${filename}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toCard(event: Event, thumb: string | null, index: number, total: number): PromoCard {
  return {
    id: event.id,
    title: event.title,
    dateLabel: formatDayHeading(event.date),
    timeLabel: promoTimeLabel(event),
    placeLabel: promoPlaceLabel(event),
    thumb,
    cancelled: event.cancelled,
    index,
    total,
  };
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} が終了コード ${code ?? "none"} で失敗しました`));
    });
  });
}

async function renderVideo(
  compositionId: string,
  fileName: string,
  propsPath: string,
  outputPath: string
) {
  await run(
    "pnpm",
    [
      "exec",
      "remotion",
      "render",
      "src/index.ts",
      compositionId,
      outputPath,
      `--props=${propsPath}`,
      "--codec=h264",
      "--crf=28",
      "--jpeg-quality=70",
      "--image-format=jpeg",
      "--pixel-format=yuv420p",
      "--x264-preset=veryfast",
      "--max-rate=2500k",
      "--buffer-size=5000k",
      `--concurrency=${concurrency()}`,
      "--gl=swangle",
      "--muted",
      "--overwrite",
      "--bundle-cache",
    ],
    remotionDir
  );

  const size = (await stat(outputPath)).size;
  if (size > MAX_VIDEO_BYTES) {
    throw new Error(
      `${path.basename(outputPath)} が ${size} バイトで、上限 ${MAX_VIDEO_BYTES} を超えています`
    );
  }
  console.log(`${fileName}: ${(size / 1024 / 1024).toFixed(1)} MiB`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const anchor = args.date ?? todayKey();
  if (!parseDateKey(anchor)) throw new Error(`不正な日付です: ${anchor}`);

  const week = saturdayPostWeek(anchor);
  const weekLabel = formatWeekRange(week);
  const snapshot = JSON.parse(
    await readFile(path.join(rootDir, "data", "events.json"), "utf8")
  ) as EventSnapshot;
  const events = materializeEvents(todayKey(), snapshot.events);
  const variants = PROMO_VARIANTS.filter((variant) => !args.only || variant.id === args.only);

  await mkdir(path.join(remotionDir, "public", "brand"), { recursive: true });
  await copyFile(
    path.join(rootDir, "public", "favicon.svg"),
    path.join(remotionDir, "public", "brand", "favicon.svg")
  );
  await rm(thumbDir, { recursive: true, force: true });
  await mkdir(thumbDir, { recursive: true });
  await mkdir(propsDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const manifestVideos = [];
  for (const variant of variants) {
    const { matched, shown } = takePromoEvents(events, week, variant.keyword);
    const cards: PromoCard[] = [];
    let thumbs = 0;
    for (const [offset, event] of shown.entries()) {
      const thumb = await downloadThumb(event);
      if (thumb) thumbs += 1;
      cards.push(toCard(event, thumb, offset + 1, shown.length));
    }

    const props: PromoProps = {
      headline: variant.headline,
      weekLabel,
      siteName: siteTitle,
      siteUrl: displayUrl,
      matched: matched.length,
      cards,
    };
    const propsPath = path.join(propsDir, `${variant.id}.json`);
    await writeFile(propsPath, `${JSON.stringify(props, null, 2)}\n`);
    console.log(
      `${variant.keyword}: ${matched.length} 件中 ${shown.length} 件、サムネ ${thumbs} 枚、${promoDurationSeconds(shown.length).toFixed(1)} 秒`
    );

    const seconds = Math.round(promoDurationSeconds(shown.length) * 10) / 10;
    for (const output of variant.outputs) {
      const outputPath = path.join(outputDir, output.fileName);
      if (!args.prepareOnly) {
        await renderVideo(output.compositionId, output.fileName, propsPath, outputPath);
      }
      manifestVideos.push({
        id: variant.id,
        orientation: output.orientation,
        keyword: variant.keyword,
        file: output.fileName,
        publicPath: `/promo/videos/${output.fileName}`,
        matched: matched.length,
        shown: shown.length,
        seconds,
      });
    }
  }

  if (args.prepareOnly) {
    console.log(`プレビュー用の props を書きました: ${propsDir}`);
    return;
  }
  if (args.only) {
    console.log(
      "指定した種類だけ書きました。manifest は LT ともくもくがそろったときだけ更新します。"
    );
    return;
  }

  const manifest = {
    anchor,
    weekStart: week[0],
    weekEnd: week.at(-1),
    weekLabel,
    generatedAt: new Date().toISOString(),
    cap: PROMO_EVENT_CAP,
    videos: manifestVideos,
  };
  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`動画を書きました: ${outputDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
