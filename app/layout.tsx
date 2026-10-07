import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { BackToTop } from "@/components/back-to-top";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

/**
 * Noto Sans JP（google/fonts の可変フォントを woff2 にしたもの。ライセンスは app/fonts/OFL.txt）。
 * ビルドで Google Fonts を取りに行かないよう同梱する。Google Fonts と同じく 400 / 500 / 700 の 3 つの太さだけを
 * 宣言し、600 などは従来どおり近い太さで描く。1 ファイルで約 4MB あるので先読みはしない。
 */
const notoSansJp = localFont({
  src: [
    { path: "./fonts/NotoSansJP-VF.woff2", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansJP-VF.woff2", weight: "500", style: "normal" },
    { path: "./fonts/NotoSansJP-VF.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  // 可変フォントの既定は Thin なので自動計算だと寸法がずれる。代替は globals.css で従来と同じ値にする。
  adjustFontFallback: false,
  variable: "--font-noto",
  fallback: [
    "Noto Sans JP Fallback",
    "Hiragino Sans",
    "Hiragino Kaku Gothic ProN",
    "Yu Gothic",
    "Meiryo",
    "sans-serif",
  ],
});

const siteTitle = "東京イベントカレンダー";
const siteDescription =
  "東京の connpass イベントを、日付・場所・キーワードから探すカレンダーです。";

/**
 * 公開 URL はリクエストのホストから決める。og:image などの絶対 URL に使う。
 */
function resolveMetadataBase(headerList: Headers): URL | undefined {
  const rawHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const host = rawHost?.split(",")[0]?.trim();
  if (!host) return undefined;

  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return new URL(`${proto}://${host}`);
}

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();

  return {
    metadataBase: resolveMetadataBase(headerList),
    title: siteTitle,
    description: siteDescription,
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
    },
    openGraph: {
      siteName: siteTitle,
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          type: "image/svg+xml",
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [
        {
          url: "/og.svg",
          width: 1200,
          height: 630,
          type: "image/svg+xml",
          alt: siteTitle,
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} min-h-dvh`}>
      <body className="flex min-h-dvh min-w-0 flex-col bg-background font-sans text-foreground antialiased">
        <Header />
        <div className="flex min-w-0 flex-1 flex-col pb-8">{children}</div>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
