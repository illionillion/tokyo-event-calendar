import { describe, expect, it } from "vitest";
import { contentLengthWithin, imageExtension, isHttpsUrl, readBodyUpTo } from "@/lib/promo-thumbs";

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe("サムネの画像判定", () => {
  it("JPEG PNG GIF WebP だけを通し、上限を超えたら捨てる", () => {
    expect(
      imageExtension(Uint8Array.of(0xff, 0xd8, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0, 0, 0, 0))
    ).toBe("jpg");
    const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(imageExtension(png)).toBe("png");
    const gif = Uint8Array.of(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0);
    expect(imageExtension(gif)).toBe("gif");
    const webp = Uint8Array.of(
      ..."RIFF".split("").map((char) => char.charCodeAt(0)),
      0,
      0,
      0,
      0,
      ..."WEBP".split("").map((char) => char.charCodeAt(0))
    );
    expect(imageExtension(webp)).toBe("webp");
    expect(
      imageExtension(Uint8Array.of(0x3c, 0x68, 0x74, 0x6d, 0x6c, 0, 0, 0, 0, 0, 0, 0))
    ).toBeNull();
    expect(imageExtension(new Uint8Array(4_000_001))).toBeNull();
  });

  it("本文は上限を超えるチャンクの手前で打ち切る", async () => {
    const small = await readBodyUpTo(streamOf([Uint8Array.of(1, 2), Uint8Array.of(3)]), 4);
    expect(small).toEqual(Uint8Array.of(1, 2, 3));

    const big = await readBodyUpTo(streamOf([Uint8Array.of(1, 2), Uint8Array.of(3, 4, 5)]), 4);
    expect(big).toBeNull();
    expect(await readBodyUpTo(null, 4)).toBeNull();
  });

  it("Content-Length が上限を超えていれば本文を読む前に落とせる", () => {
    expect(contentLengthWithin(null, 4)).toBe(true);
    expect(contentLengthWithin("4", 4)).toBe(true);
    expect(contentLengthWithin("5", 4)).toBe(false);
    expect(contentLengthWithin("nope", 4)).toBe(true);
  });

  it("https 以外の画像 URL は落とす", () => {
    expect(isHttpsUrl("https://connpass.com/a.jpg")).toBe(true);
    expect(isHttpsUrl("http://connpass.com/a.jpg")).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
  });
});
