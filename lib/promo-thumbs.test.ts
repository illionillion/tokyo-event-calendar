import { describe, expect, it } from "vitest";
import { imageExtension, isHttpsUrl } from "@/lib/promo-thumbs";

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

  it("https 以外の画像 URL は落とす", () => {
    expect(isHttpsUrl("https://connpass.com/a.jpg")).toBe(true);
    expect(isHttpsUrl("http://connpass.com/a.jpg")).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
  });
});
