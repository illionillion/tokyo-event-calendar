import type { Metadata } from "next";

export const siteTitle = "東京イベントカレンダー";
export const siteDescription =
  "東京都と神奈川県・埼玉県・千葉県の connpass イベントを、日付・場所・キーワードから探すカレンダーです。";

/** 全ページ共通。絶対 URL を使わないので、静的なページでもそのまま使える。 */
export const baseMetadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
  },
};

/**
 * 公開 URL はリクエストのホストから決める。og:image や canonical などの絶対 URL に使う。
 */
export function resolveMetadataBase(headerList: Headers): URL | undefined {
  const rawHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const host = rawHost?.split(",")[0]?.trim();
  if (!host) return undefined;

  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return new URL(`${proto}://${host}`);
}

const ogImage = {
  url: "/og.svg",
  width: 1200,
  height: 630,
  type: "image/svg+xml",
  alt: siteTitle,
};

/**
 * リクエストごとに描くページ（クローラー向けのページ・規約など）の共通メタデータ。
 * ホストから metadataBase を決め、OGP を付ける。静的な `/` では使わない（headers() で動的になるため）。
 */
export function requestMetadata(headerList: Headers): Metadata {
  return {
    ...baseMetadata,
    metadataBase: resolveMetadataBase(headerList),
    openGraph: { siteName: siteTitle, locale: "ja_JP", type: "website", images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage] },
  };
}
