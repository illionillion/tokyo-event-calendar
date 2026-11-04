import { BrandLockup } from "./brand";
import { PromoFrame } from "./frame";
import { theme } from "./theme";
import type { PromoProps } from "./types";

export function Opening({ headline, weekLabel, siteName, siteUrl }: PromoProps) {
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
        <BrandLockup siteName={siteName} weekLabel={weekLabel} siteUrl={siteUrl} />
        <div style={{ width: 72, height: 8, marginTop: 56, backgroundColor: theme.accent }} />
        <div style={{ marginTop: 24, fontSize: 32, fontWeight: 700, color: theme.accent }}>
          来週
        </div>
        <div style={{ marginTop: 8, fontSize: 84, fontWeight: 700, lineHeight: 1.15 }}>
          {headline}
        </div>
      </div>
    </PromoFrame>
  );
}
