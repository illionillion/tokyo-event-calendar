import { describe, expect, it } from "vitest";
import {
  ogImage,
  requestMetadata,
  siteDescription,
  siteTitle,
  twitterSite,
} from "@/lib/site-metadata";

const page = {
  title: "2026年10月18日〜24日の港区・「LT」のイベント | 東京イベントカレンダー",
  description: "2026年10月18日〜24日の港区・「LT」のイベント。サイトの説明",
  url: "/?date=2026-10-19&area=%E6%B8%AF%E5%8C%BA&keyword=LT&view=week",
};

describe("requestMetadata", () => {
  it("X カードと OGP を絶対 URL になる形で付ける", () => {
    const headers = new Headers({
      host: "tokyo-event-calendar.example",
      "x-forwarded-proto": "https",
    });
    const metadata = requestMetadata(headers, page);

    expect(metadata.title).toBe(page.title);
    expect(metadata.description).toBe(page.description);
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    const metadataBase = metadata.metadataBase as URL;
    expect(metadataBase.href).toBe("https://tokyo-event-calendar.example/");
    expect(metadata.alternates).toEqual({ canonical: page.url });

    expect(ogImage).toMatchObject({
      url: "/og.png",
      width: 1200,
      height: 630,
      type: "image/png",
      alt: siteTitle,
    });
    expect(new URL(ogImage.url, metadataBase).href).toBe(
      "https://tokyo-event-calendar.example/og.png"
    );

    expect(metadata.openGraph).toMatchObject({
      title: page.title,
      description: page.description,
      url: page.url,
      siteName: siteTitle,
      locale: "ja_JP",
      type: "website",
      images: [ogImage],
    });
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      site: twitterSite,
      creator: twitterSite,
      images: [ogImage],
    });
    expect(twitterSite).toBe("@Sei_engineer");
  });

  it("localhost は http、転送されたホストを優先する", () => {
    const local = requestMetadata(new Headers({ host: "127.0.0.1:8787" }), page);
    expect(local.metadataBase).toBeInstanceOf(URL);
    expect((local.metadataBase as URL).href).toBe("http://127.0.0.1:8787/");

    const forwarded = requestMetadata(
      new Headers({
        host: "ignored.example",
        "x-forwarded-host": "tokyo-event-calendar.example, other",
        "x-forwarded-proto": "https",
      }),
      page
    );
    expect(forwarded.metadataBase).toBeInstanceOf(URL);
    expect((forwarded.metadataBase as URL).href).toBe("https://tokyo-event-calendar.example/");
  });

  it("静的な共通メタデータはサイト名と説明のまま", () => {
    expect(siteTitle).toBe("東京イベントカレンダー");
    expect(siteDescription).toContain("connpass");
  });
});
