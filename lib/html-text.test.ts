import { describe, expect, it } from "vitest";
import { plainTextFromHtml } from "@/lib/html-text";

describe("plainTextFromHtml", () => {
  it("本文と文字参照を残し、タグと埋め込みは捨てる", () => {
    expect(
      plainTextFromHtml(
        '<p>Reactの<strong>勉強会</strong>です。<br>Q&amp;A もあります。</p><script>secret</script><style>.x{color:red}</style><a href="https://example.com/token">詳細</a>'
      )
    ).toBe("Reactの勉強会です。 Q&A もあります。 詳細");
  });

  it("空やタグだけの入力は null にする", () => {
    expect(plainTextFromHtml(null)).toBeNull();
    expect(plainTextFromHtml("")).toBeNull();
    expect(plainTextFromHtml("<p> <br> </p>")).toBeNull();
  });

  it("数値文字参照を本文にする", () => {
    expect(plainTextFromHtml("<p>&#12354;&#x3042;</p>")).toBe("ああ");
  });

  it("名前付き文字参照を標準どおりに戻し、不可視の書式文字は捨てる", () => {
    expect(plainTextFromHtml("<p>AGENTS&zwnj;.md&emsp;を読む</p>")).toBe("AGENTS.md を読む");
    expect(plainTextFromHtml("<p>&copy; 2026&hellip;</p>")).toBe("\u00a9 2026\u2026");
    expect(plainTextFromHtml("<p>Next&#8203;.js&shy;入門</p>")).toBe("Next.js入門");
  });

  it("未知の文字参照はそのまま残す", () => {
    expect(plainTextFromHtml("<p>&unknownentity; です</p>")).toBe("&unknownentity; です");
  });
});
