import { PromoFrame } from "./frame";
import { theme } from "./theme";
import type { PromoProps } from "./types";

export function Ending({ headline, siteName, siteUrl, matched, cards }: PromoProps) {
  const rest = Math.max(0, matched - cards.length);

  return (
    <PromoFrame>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
        }}
      >
        <div style={{ width: 72, height: 8, backgroundColor: theme.accent }} />
        <div style={{ marginTop: 28, fontSize: 36, fontWeight: 700, color: theme.accent }}>
          {headline}
        </div>
        <div style={{ marginTop: 12, fontSize: 72, fontWeight: 700, lineHeight: 1.25 }}>
          続きはこちら
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.5,
            color: theme.accent,
          }}
        >
          {siteUrl.replaceAll("/", "/\u200b").replaceAll(".", ".\u200b")}
        </div>
        {rest > 0 ? (
          <div style={{ marginTop: 28, fontSize: 32, fontWeight: 500, color: theme.muted }}>
            ほか {rest} 件
          </div>
        ) : null}
        <div style={{ marginTop: 48, fontSize: 30, fontWeight: 500, color: theme.muted }}>
          {siteName}
        </div>
      </div>
    </PromoFrame>
  );
}
