import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-metadata";

/**
 * サイトマップに載せる公開ページ。
 * `/crawler` は middleware が `/` を書き換える先なので含めない。
 * 新しい公開ページを足すときは、この配列に path を追加する。
 */
const publicPages: { path: string }[] = [{ path: "/" }, { path: "/privacy" }, { path: "/terms" }];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(({ path }) => ({
    url: new URL(path, siteUrl).href,
  }));
}
