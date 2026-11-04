import { Img, staticFile } from "remotion";
import { theme } from "./theme";
import type { PromoProps } from "./types";

/** 公開サイトの `public/favicon.svg`。書き出し時に同じファイルをここにコピーする。 */
const icon = staticFile("brand/favicon.svg");

function readableUrl(url: string): string {
  return url.replaceAll("/", "/\u200b").replaceAll(".", ".\u200b");
}

/** アイコン、サイト名、週、URL をひと目で並べる。 */
export function BrandLockup({
  siteName,
  weekLabel,
  siteUrl,
}: Pick<PromoProps, "siteName" | "weekLabel" | "siteUrl">) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Img src={icon} style={{ width: 112, height: 112, flexShrink: 0 }} />
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.3 }}>{siteName}</div>
      </div>
      <div
        style={{
          marginTop: 32,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.4,
          color: theme.secondary,
        }}
      >
        {weekLabel}
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.45,
          color: theme.accent,
        }}
      >
        {readableUrl(siteUrl)}
      </div>
    </div>
  );
}
