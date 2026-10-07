const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function codePointOrEntity(code: number, entity: string): string {
  if (
    !Number.isInteger(code) ||
    code < 0 ||
    code > 0x10ffff ||
    (code >= 0xd800 && code <= 0xdfff)
  ) {
    return entity;
  }
  return String.fromCodePoint(code);
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, body: string) => {
    const lower = body.toLowerCase();
    if (lower.startsWith("#x"))
      return codePointOrEntity(Number.parseInt(lower.slice(2), 16), entity);
    if (lower.startsWith("#"))
      return codePointOrEntity(Number.parseInt(lower.slice(1), 10), entity);
    return NAMED_ENTITIES[lower] ?? entity;
  });
}

/**
 * 検索に渡す説明文。タグと属性は捨て、本文と文字参照だけを残す。
 */
export function plainTextFromHtml(html: string | null): string | null {
  if (!html) return null;

  const withoutEmbedded = html
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/gi, " ");
  const withBreaks = withoutEmbedded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n")
    .replace(
      /<\/(?:p|div|h[1-6]|li|tr|blockquote|section|article|ul|ol|table|header|footer|pre|dt|dd|figcaption)>/gi,
      "\n"
    )
    .replace(/<[^>]+>/g, "");
  const text = decodeHtmlEntities(withBreaks).replace(/\s+/gu, " ").trim();
  return text.length > 0 ? text : null;
}
