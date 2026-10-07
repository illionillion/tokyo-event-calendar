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
});
