import { AbsoluteFill } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
import { theme } from "./theme";
import type { PromoProps } from "./types";

export function Ending({ headline, siteName, siteUrl, matched, cards }: PromoProps) {
  const opacity = useCut();
  const rest = Math.max(0, matched - cards.length);

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: theme.bg, color: theme.ink, fontFamily }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(980px 820px at 70% 110%, #6a2228 0%, rgba(20,9,11,0) 60%)",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 80px 140px",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: theme.accent,
          }}
        >
          {headline}
        </div>
        <div style={{ marginTop: 20, fontSize: 84, fontWeight: 800, lineHeight: 1.15 }}>
          続きはこちら
        </div>
        <div style={{ width: 128, height: 12, marginTop: 36, backgroundColor: theme.accent }} />
        <div
          style={{
            marginTop: 40,
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          {siteUrl.replaceAll("/", "/\u200b").replaceAll(".", ".\u200b")}
        </div>
        {rest > 0 ? (
          <div style={{ marginTop: 36, fontSize: 36, fontWeight: 700, color: theme.muted }}>
            ほか {rest} 件
          </div>
        ) : null}
        <div style={{ marginTop: 64, fontSize: 32, fontWeight: 700, color: theme.muted }}>
          {siteName}
        </div>
      </div>
    </AbsoluteFill>
  );
}
