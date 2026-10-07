import { decodeHTML } from "entities/decode";

/** ZWNJ・ZWSP・ソフトハイフンなど、見た目に出ず検索語との一致を妨げる書式文字。 */
const INVISIBLE_FORMAT_CHARS = /\p{Cf}/gu;

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
  const text = decodeHTML(withBreaks)
    .replace(INVISIBLE_FORMAT_CHARS, "")
    .replace(/\s+/gu, " ")
    .trim();
  return text.length > 0 ? text : null;
}
