import { AbsoluteFill } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
import { theme } from "./theme";
import type { PromoProps } from "./types";

export function Opening({ headline, weekLabel, siteName }: PromoProps) {
  const opacity = useCut();
  const headlineSize = headline.length > 2 ? 168 : 280;

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: theme.bg, color: theme.ink, fontFamily }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(900px 780px at 18% 12%, #6a2228 0%, rgba(20,9,11,0) 62%)",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 80px 120px",
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: theme.accent,
          }}
        >
          来週
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: headlineSize,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: headline.length > 2 ? "-0.04em" : "-0.03em",
          }}
        >
          {headline}
        </div>
        <div style={{ width: 128, height: 12, marginTop: 36, backgroundColor: theme.accent }} />
        <div style={{ marginTop: 36, fontSize: 48, fontWeight: 700, lineHeight: 1.35 }}>
          {weekLabel}
        </div>
        <div style={{ marginTop: 80, fontSize: 34, fontWeight: 700, color: theme.muted }}>
          {siteName}
        </div>
      </div>
    </AbsoluteFill>
  );
}
