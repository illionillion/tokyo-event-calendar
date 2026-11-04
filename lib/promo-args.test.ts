import { describe, expect, it } from "vitest";
import { parseArgs } from "@/lib/promo-args";

describe("紹介動画の引数", () => {
  it("pnpm が渡す -- を飛ばして date と only を読む", () => {
    expect(parseArgs(["--", "--date", "2026-10-24", "--only", "lt"])).toEqual({
      date: "2026-10-24",
      only: "lt",
      prepareOnly: false,
    });
    expect(parseArgs(["--date", "2026-10-24", "--", "--only", "mokumoku"])).toEqual({
      date: "2026-10-24",
      only: "mokumoku",
      prepareOnly: false,
    });
    expect(parseArgs(["--", "--prepare-only"])).toEqual({ prepareOnly: true });
  });

  it("知らない引数と、値が -- だけの指定は受けない", () => {
    expect(() => parseArgs(["--nope"])).toThrow(/不明な引数/);
    expect(() => parseArgs(["--date", "--"])).toThrow(/値がありません/);
    expect(() => parseArgs(["--only", "weekend"])).toThrow(/lt か mokumoku/);
  });
});
