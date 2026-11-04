import { PromoFrame } from "./frame";
import { theme } from "./theme";

export function EmptyWeek({ headline }: { headline: string }) {
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
        <div style={{ marginTop: 16, fontSize: 64, fontWeight: 700, lineHeight: 1.35 }}>
          該当するイベントは
          <br />
          ありません
        </div>
      </div>
    </PromoFrame>
  );
}
