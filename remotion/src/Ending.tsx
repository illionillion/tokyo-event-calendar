import { BrandLockup } from "./brand";
import { PromoFrame, useLandscape } from "./frame";
import { theme } from "./theme";
import type { PromoProps } from "./types";

export function Ending({ headline, siteName, siteUrl, weekLabel, matched, cards }: PromoProps) {
  const rest = Math.max(0, matched - cards.length);
  const landscape = useLandscape();

  if (landscape) {
    return (
      <PromoFrame>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 64,
            padding: "0 56px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <BrandLockup siteName={siteName} weekLabel={weekLabel} siteUrl={siteUrl} />
          </div>
          <div style={{ width: 640, flexShrink: 0 }}>
            <div style={{ width: 72, height: 8, backgroundColor: theme.accent }} />
            <div style={{ marginTop: 20, fontSize: 32, fontWeight: 700, color: theme.accent }}>
              {headline}
            </div>
            <div style={{ marginTop: 8, fontSize: 72, fontWeight: 700, lineHeight: 1.2 }}>
              続きはこちら
            </div>
            {rest > 0 ? (
              <div style={{ marginTop: 20, fontSize: 32, fontWeight: 500, color: theme.muted }}>
                ほか {rest} 件
              </div>
            ) : null}
          </div>
        </div>
      </PromoFrame>
    );
  }

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
          {headline}
        </div>
        <div style={{ marginTop: 8, fontSize: 64, fontWeight: 700, lineHeight: 1.25 }}>
          続きはこちら
        </div>
        {rest > 0 ? (
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 500, color: theme.muted }}>
            ほか {rest} 件
          </div>
        ) : null}
      </div>
    </PromoFrame>
  );
}
