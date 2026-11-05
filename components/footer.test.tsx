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

  it("都道府県検索に出ないイベントの申請先を案内し、優遇ではないと書く", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "確認できれば表示に足します。おすすめとしての優遇ではありません。"
    );

    const issue = screen.getByRole("link", { name: /Issue（表示されていないイベントの申請）/ });
    expect(issue).toHaveAttribute(
      "href",
      "https://github.com/illionillion/tokyo-event-calendar/issues/new?template=missing_event.yml"
    );
    expect(issue).toHaveAttribute("target", "_blank");
    expect(issue).toHaveAttribute("rel", "noopener noreferrer");

    const dm = screen.getByRole("link", { name: /DM（作者の X）/ });
    expect(dm).toHaveAttribute("href", "https://x.com/Sei_engineer");
    expect(dm).toHaveAttribute("target", "_blank");
  });

  it("スポンサーや金銭の呼びかけを出さない", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).not.toHaveTextContent(
      /sponsor|スポンサー|寄付|投げ銭|donate|チップ/i
    );
  });
});
