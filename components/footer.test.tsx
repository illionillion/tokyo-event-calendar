import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/footer";

describe("Footer", () => {
  it("作者の GitHub プロフィール、リポジトリ、Issues へリンクする", () => {
    render(<Footer />);

    const author = screen.getByRole("link", { name: /illionillionの GitHub プロフィール/ });
    expect(author).toHaveAttribute("href", "https://github.com/illionillion");
    expect(author).toHaveAttribute("target", "_blank");
    expect(author).toHaveAttribute("rel", "noopener noreferrer");

    expect(screen.getByRole("link", { name: /ソースコード/ })).toHaveAttribute(
      "href",
      "https://github.com/illionillion/tokyo-event-calendar"
    );
    expect(screen.getByRole("link", { name: /不具合・要望（GitHub Issues）/ })).toHaveAttribute(
      "href",
      "https://github.com/illionillion/tokyo-event-calendar/issues"
    );
  });

  it("スポンサーや金銭の呼びかけを出さない", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).not.toHaveTextContent(
      /sponsor|スポンサー|寄付|投げ銭|donate|チップ/i
    );
  });
});
