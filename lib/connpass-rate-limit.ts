/**
 * connpass フリープラン API の呼び出し制御。
 * 制限は 2026-11-04 から。https://help.connpass.com/api/
 * - 12秒につき 1 リクエスト
 * - 1日 100 リクエストまで
 *
 * API を呼ぶのは `fetchConnpassEvents` だけ（都道府県検索、subdomain 補完、event_id 補完、429 の再試行）。
 * 画像の取得（media.connpass.com）は API キーを付けないので、ここには含めない。
 *
 * 間隔は 12 秒ちょうどではなく 12.5 秒にする。前のレスポンスを受け取ってから次を送るので、
 * リクエストの開始どうしは 12.5 秒より長くなる。429 の再試行も同じゲートを通す。
 * backoff が 12.5 秒より短いときは 12.5 秒まで延ばす。
 *
 * 回数の見積り（2026-11-11 の取得結果は重複除去後 541 件。終了から 7 日超の 17 件は
 * スナップショットへ書く前に除く。ページ数は除く前の件数で決まる）:
 * - 都道府県（tokyo, kanagawa, saitama, chiba）は 1 検索で、count は 100。
 *   541 件がすべて都道府県側だとしても ceil(541 / 100) = 6 回。
 * - subdomain 補完は `data/connpass-supplements.json` の 3 件（dmm, akabane-yurumoku, tsukiyo）を
 *   1 検索にまとめる。同じ 3 か月で 100 件未満なら 1 回。超えた分はページを足す。
 * - event_id 補完は event_ids が空なので 0 回。ID が増えても 1 検索にまとめる。
 * - 429 の再試行は通常 0 回。起きたときは同じページにつき最大 3 回で、回数に含める。
 * 通常バッチの見込みは 7 回（`ESTIMATED_REQUESTS_PER_BATCH`）。
 *
 * バッチ頻度:
 * - 定期実行は `.github/workflows/update-events.yml` の cron `0 18 * * *`（UTC 18:00 = 日本時間 3:00）で 1 日 1 回。
 * - 同じワークフローは workflow_dispatch で手動実行できる。同じ日の手動実行を 1 回まで予算に含める。
 * 7 回 × (1 + 1) バッチ = 14 回/日で、100 回を下回る。
 * ページが増えても 1 バッチの上限は floor(100 / 2) = 50 回。超えるリクエストは送らない。
 * 同じ日に手動実行を 2 回以上足すと、この上限だけでは 1 日 100 回を超え得る。
 */

/** フリープランの最短間隔。これより短い間隔は受け付けない。 */
export const CONNPASS_MIN_INTERVAL_MS = 12_000;

/** 実際に空ける間隔。最短の 12 秒に 0.5 秒の余裕を足す。 */
export const REQUEST_INTERVAL_MS = 12_500;

/** フリープランの 1 日のリクエスト上限。 */
export const DAILY_REQUEST_BUDGET = 100;

/** cron `0 18 * * *` は 1 日 1 回。 */
export const SCHEDULED_BATCHES_PER_DAY = 1;

/** workflow_dispatch を同じ日に 1 回まで予算に含める。 */
export const MANUAL_BATCHES_PER_DAY = 1;

export const BATCHES_PER_DAY = SCHEDULED_BATCHES_PER_DAY + MANUAL_BATCHES_PER_DAY;

/**
 * 1 バッチで connpass API に送ってよい回数。429 の再試行と補完の検索も含む。
 * 定期 1 回と手動 1 回を同じ日に行っても、1 日 100 回を超えない。
 */
export const MAX_REQUESTS_PER_BATCH = Math.floor(DAILY_REQUEST_BUDGET / BATCHES_PER_DAY);

/**
 * 2026-11-11 時点の見込み（都道府県 6 + subdomain 1 + event_id 0）。
 * スナップショットの件数は日々変わる。上限そのものは `MAX_REQUESTS_PER_BATCH`。
 */
export const ESTIMATED_REQUESTS_PER_BATCH = 7;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 次のリクエストの前に待つ時間。
 * 最初の 1 回は backoff が無い限り待たない。2 回目以降は間隔と backoff の長い方。
 */
export function waitMsBeforeNextConnpassRequest(
  hasPriorRequest: boolean,
  intervalMs: number,
  extraDelayMs: number
): number {
  if (!hasPriorRequest) return Math.max(0, extraDelayMs);
  return Math.max(intervalMs, extraDelayMs);
}

export function connpassBudgetSkipMessage(what: string, used: number, limit: number): string {
  return `connpass API のリクエスト上限（${limit} 回）に達したため、${what}をスキップします。1 日の予算は ${DAILY_REQUEST_BUDGET} 回、バッチ頻度は定期 ${SCHEDULED_BATCHES_PER_DAY} 回と手動 ${MANUAL_BATCHES_PER_DAY} 回で 1 バッチあたり ${MAX_REQUESTS_PER_BATCH} 回です。このバッチの使用は ${used} 回です。取り切れていないため、スナップショットは更新しません`;
}

export type ConnpassAcquireResult = { ok: true; waitedMs: number } | { ok: false };

export type ConnpassRequestGate = {
  readonly requestCount: number;
  readonly limit: number;
  /** 予算が残っていれば待ちを入れて 1 回分を確保する。残っていなければ送らない。 */
  acquire(extraDelayMs?: number): Promise<ConnpassAcquireResult>;
};

export function createConnpassRequestGate(options: {
  intervalMs?: number;
  maxRequests?: number;
  sleep?: (ms: number) => Promise<void>;
}): ConnpassRequestGate {
  const intervalMs = options.intervalMs ?? REQUEST_INTERVAL_MS;
  const limit = options.maxRequests ?? MAX_REQUESTS_PER_BATCH;
  const sleep = options.sleep ?? defaultSleep;
  if (intervalMs < REQUEST_INTERVAL_MS) {
    throw new Error(`リクエスト間隔は ${REQUEST_INTERVAL_MS}ms 以上にしてください`);
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("リクエスト上限は 1 以上の整数にしてください");
  }

  let requestCount = 0;

  return {
    get requestCount() {
      return requestCount;
    },
    limit,
    async acquire(extraDelayMs = 0) {
      if (requestCount >= limit) return { ok: false };
      const waitedMs = waitMsBeforeNextConnpassRequest(requestCount > 0, intervalMs, extraDelayMs);
      if (waitedMs > 0) await sleep(waitedMs);
      requestCount += 1;
      return { ok: true, waitedMs };
    },
  };
}
