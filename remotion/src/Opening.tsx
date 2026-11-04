import { theme } from "./theme";
import { PromoFrame } from "./frame";
import type { PromoProps } from "./types";

export function Opening({ headline, weekLabel, siteName }: PromoProps) {
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
          来週
        </div>
        <div style={{ marginTop: 12, fontSize: 92, fontWeight: 700, lineHeight: 1.15 }}>
          {headline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 500,
            lineHeight: 1.4,
            color: theme.secondary,
          }}
        >
          {weekLabel}
        </div>
        <div style={{ marginTop: 48, fontSize: 30, fontWeight: 500, color: theme.muted }}>
          {siteName}
        </div>
      </div>
    </PromoFrame>
  );
}
