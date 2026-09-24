import fs from "node:fs";
import path from "node:path";
import {
  assertFrontmatter,
  splitMarkdownDocument,
  type LegalDocumentSlug,
  type LoadedLegalDocument,
} from "@/lib/legal-document";

export type { LegalDocumentSlug, LoadedLegalDocument } from "@/lib/legal-document";

/**
 * `content/legal/{slug}.md` を読み込み、frontmatter と本文を返す。
 */
export function loadLegalDocument(slug: LegalDocumentSlug): LoadedLegalDocument {
  const filePath = path.join(process.cwd(), "content", "legal", `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = splitMarkdownDocument(raw);
  const frontmatter = assertFrontmatter(data, slug);

  return {
    ...frontmatter,
    content,
  };
}
