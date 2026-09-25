import { describe, expect, it } from "vitest";
import {
  assertFrontmatter,
  parseFrontmatterBlock,
  splitMarkdownDocument,
} from "@/lib/legal-document";
import { loadLegalDocument } from "@/lib/load-legal-document";

describe("parseFrontmatterBlock", () => {
  it("parses key-value lines", () => {
    expect(parseFrontmatterBlock("title: 利用規約\nlastUpdated: 2026年9月25日")).toEqual({
      title: "利用規約",
      lastUpdated: "2026年9月25日",
    });
  });
});

describe("splitMarkdownDocument", () => {
  it("splits frontmatter and body", () => {
    const { data, content } = splitMarkdownDocument(
      "---\ntitle: テスト\n---\n\n本文の段落です。\n"
    );
    expect(data).toEqual({ title: "テスト" });
    expect(content).toBe("本文の段落です。");
  });

  it("throws when frontmatter is missing", () => {
    expect(() => splitMarkdownDocument("本文だけ")).toThrow(/frontmatter/);
  });
});

describe("assertFrontmatter", () => {
  it("accepts a complete privacy frontmatter", () => {
    expect(
      assertFrontmatter(
        {
          title: "プライバシーポリシー",
          pageTitle: "プライバシーポリシー | 東京イベントカレンダー",
          description: "説明",
          canonicalPath: "privacy",
          lastUpdated: "2026年9月25日",
        },
        "privacy"
      )
    ).toMatchObject({ canonicalPath: "privacy" });
  });

  it("rejects a leading slash in canonicalPath", () => {
    expect(() =>
      assertFrontmatter(
        {
          title: "t",
          pageTitle: "p",
          description: "d",
          canonicalPath: "/privacy",
          lastUpdated: "2026年9月25日",
        },
        "privacy"
      )
    ).toThrow(/must not start with/);
  });
});

describe("loadLegalDocument", () => {
  it("loads privacy.md", () => {
    const doc = loadLegalDocument("privacy");
    expect(doc.title).toBe("プライバシーポリシー");
    expect(doc.canonicalPath).toBe("privacy");
    expect(doc.content).toContain("アカウント");
    expect(doc.content).toContain("アクセス解析");
  });

  it("loads terms.md", () => {
    const doc = loadLegalDocument("terms");
    expect(doc.title).toBe("利用規約");
    expect(doc.canonicalPath).toBe("terms");
    expect(doc.content).toContain("モックデータ");
    expect(doc.content).toContain("日本法");
  });
});
