import privacyMarkdown from "@/content/legal/privacy.md";
import termsMarkdown from "@/content/legal/terms.md";
import {
  assertFrontmatter,
  splitMarkdownDocument,
  type LegalDocumentSlug,
  type LoadedLegalDocument,
} from "@/lib/legal-document";

export type { LegalDocumentSlug, LoadedLegalDocument } from "@/lib/legal-document";

const RAW_MARKDOWN: Record<LegalDocumentSlug, string> = {
  privacy: privacyMarkdown,
  terms: termsMarkdown,
};

/**
 * `content/legal/{slug}.md` の frontmatter と本文を返す。
 * リクエスト時にディスクを読まない。OpenNext の Worker では作業ディレクトリが `/bundle` で、
 * この Markdown はそこには無く、ファイルを開くと 500 になる。
 */
export function loadLegalDocument(slug: LegalDocumentSlug): LoadedLegalDocument {
  const { data, content } = splitMarkdownDocument(RAW_MARKDOWN[slug]);
  const frontmatter = assertFrontmatter(data, slug);

  return {
    ...frontmatter,
    content,
  };
}
