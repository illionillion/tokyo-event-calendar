import { decodeHTML } from "entities/decode";

/** ZWNJ・ZWSP・ソフトハイフンなど、見た目に出ず検索語との一致を妨げる書式文字。 */
const INVISIBLE_FORMAT_CHARS = /\p{Cf}/gu;

/** 前後の文字をつなげないブロック要素と表のセル。閉じタグを省いた HTML もあるので開きタグも区切りにする。 */
const BLOCK_BOUNDARY_TAG =
  /<\/?(?:p|div|h[1-6]|li|tr|td|th|caption|blockquote|section|article|ul|ol|dl|table|thead|tbody|tfoot|header|footer|pre|dt|dd|figure|figcaption)\b[^>]*>/gi;

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
    .replace(BLOCK_BOUNDARY_TAG, "\n")
    .replace(/<[^>]+>/g, "");
  const text = decodeHTML(withBreaks)
    .replace(INVISIBLE_FORMAT_CHARS, "")
    .replace(/\s+/gu, " ")
    .trim();
  return text.length > 0 ? text : null;
}
