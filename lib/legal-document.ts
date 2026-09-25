export type LegalDocumentSlug = "privacy" | "terms";

export type LegalDocumentFrontmatter = {
  title: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
};

export type LoadedLegalDocument = LegalDocumentFrontmatter & {
  content: string;
};

const REQUIRED_KEYS: (keyof LegalDocumentFrontmatter)[] = [
  "title",
  "pageTitle",
  "description",
  "canonicalPath",
  "lastUpdated",
];

/**
 * 法務 MD の frontmatter に必須キーが揃っているか検証する。
 */
export function assertFrontmatter(
  data: Record<string, unknown>,
  slug: LegalDocumentSlug
): LegalDocumentFrontmatter {
  const missing = REQUIRED_KEYS.filter(
    (key) => typeof data[key] !== "string" || (data[key] as string).length === 0
  );
  if (missing.length > 0) {
    throw new Error(
      `content/legal/${slug}.md: missing or empty frontmatter: ${missing.join(", ")}`
    );
  }

  const canonicalPath = data.canonicalPath as string;
  if (canonicalPath.startsWith("/")) {
    throw new Error(
      `content/legal/${slug}.md: canonicalPath must not start with "/": ${canonicalPath}`
    );
  }
  if (canonicalPath !== slug) {
    throw new Error(
      `content/legal/${slug}.md: canonicalPath must be "${slug}", got "${canonicalPath}"`
    );
  }

  return {
    title: data.title as string,
    pageTitle: data.pageTitle as string,
    description: data.description as string,
    canonicalPath,
    lastUpdated: data.lastUpdated as string,
  };
}

/**
 * YAML frontmatter 風のキー・値行をパースする（単純な `key: value` のみ）。
 */
export function parseFrontmatterBlock(block: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    data[key] = value;
  }
  return data;
}

/**
 * `---\\nfrontmatter\\n---\\nbody` 形式の Markdown を分割する。
 */
export function splitMarkdownDocument(raw: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("legal document must start with YAML frontmatter delimited by ---");
  }
  return {
    data: parseFrontmatterBlock(match[1] ?? ""),
    content: (match[2] ?? "").trim(),
  };
}
