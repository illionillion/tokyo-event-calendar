import { describe, expect, it, vi } from "vitest";
import {
  BATCHES_PER_DAY,
  CONNPASS_MIN_INTERVAL_MS,
  DAILY_REQUEST_BUDGET,
  ESTIMATED_REQUESTS_PER_BATCH,
  MANUAL_BATCHES_PER_DAY,
  MAX_REQUESTS_PER_BATCH,
  REQUEST_INTERVAL_MS,
  SCHEDULED_BATCHES_PER_DAY,
  connpassBudgetSkipMessage,
  createConnpassRequestGate,
  waitMsBeforeNextConnpassRequest,
} from "@/lib/connpass-rate-limit";

describe("connpass の呼び出し間隔", () => {
  it("12 秒より 0.5 秒長く空ける", () => {
    expect(CONNPASS_MIN_INTERVAL_MS).toBe(12_000);
    expect(REQUEST_INTERVAL_MS).toBe(12_500);
    expect(REQUEST_INTERVAL_MS).toBeGreaterThan(CONNPASS_MIN_INTERVAL_MS);
  });

  it("2 回目以降は間隔と再試行待ちの長い方を待つ", () => {
    expect(waitMsBeforeNextConnpassRequest(false, REQUEST_INTERVAL_MS, 0)).toBe(0);
    expect(waitMsBeforeNextConnpassRequest(true, REQUEST_INTERVAL_MS, 0)).toBe(REQUEST_INTERVAL_MS);
    expect(waitMsBeforeNextConnpassRequest(true, REQUEST_INTERVAL_MS, 5_000)).toBe(
      REQUEST_INTERVAL_MS
    );
    expect(waitMsBeforeNextConnpassRequest(true, REQUEST_INTERVAL_MS, 20_000)).toBe(20_000);
  });

  it("ゲートは都道府県・補完・再試行で同じ待ちを使う", async () => {
    const sleep = vi.fn(async () => {});
    const gate = createConnpassRequestGate({ sleep, maxRequests: 4 });

    await expect(gate.acquire()).resolves.toEqual({ ok: true, waitedMs: 0 });
    await expect(gate.acquire()).resolves.toEqual({ ok: true, waitedMs: REQUEST_INTERVAL_MS });
    await expect(gate.acquire(5_000)).resolves.toEqual({
      ok: true,
      waitedMs: REQUEST_INTERVAL_MS,
    });
    await expect(gate.acquire(20_000)).resolves.toEqual({ ok: true, waitedMs: 20_000 });
    await expect(gate.acquire()).resolves.toEqual({ ok: false });

    expect(sleep.mock.calls).toEqual([[REQUEST_INTERVAL_MS], [REQUEST_INTERVAL_MS], [20_000]]);
    expect(gate.requestCount).toBe(4);
  });

  it("間隔を 12.5 秒より短くはできない", () => {
    expect(() => createConnpassRequestGate({ intervalMs: CONNPASS_MIN_INTERVAL_MS })).toThrow(
      `${REQUEST_INTERVAL_MS}ms 以上`
    );
  });

  it("リクエスト上限は 1 以上の整数", () => {
    expect(() => createConnpassRequestGate({ maxRequests: 0 })).toThrow("1 以上");
  });
});

describe("connpass の 1 日のリクエスト予算", () => {
  it("定期 1 回と手動 1 回を見込んでも 1 日 100 回を超えない", () => {
    expect(SCHEDULED_BATCHES_PER_DAY).toBe(1);
    expect(MANUAL_BATCHES_PER_DAY).toBe(1);
    expect(BATCHES_PER_DAY).toBe(2);
    expect(DAILY_REQUEST_BUDGET).toBe(100);
    expect(MAX_REQUESTS_PER_BATCH).toBe(50);
    expect(MAX_REQUESTS_PER_BATCH * BATCHES_PER_DAY).toBeLessThanOrEqual(DAILY_REQUEST_BUDGET);
    expect(ESTIMATED_REQUESTS_PER_BATCH * BATCHES_PER_DAY).toBeLessThanOrEqual(
      DAILY_REQUEST_BUDGET
    );
    expect(ESTIMATED_REQUESTS_PER_BATCH).toBeLessThan(MAX_REQUESTS_PER_BATCH);
  });

  it("上限に達した理由を、見積りと一緒にログへ出す", () => {
    expect(connpassBudgetSkipMessage("subdomain の検索", 50, 50)).toContain("スキップします");
    expect(connpassBudgetSkipMessage("subdomain の検索", 50, 50)).toContain("100 回");
    expect(connpassBudgetSkipMessage("subdomain の検索", 50, 50)).toContain("更新しません");
  });
});
