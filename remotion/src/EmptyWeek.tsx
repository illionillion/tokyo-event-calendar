import { AbsoluteFill } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
import { theme } from "./theme";

export function EmptyWeek({ headline }: { headline: string }) {
  const opacity = useCut();

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: theme.bg, color: theme.ink, fontFamily }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        <div
          style={{ fontSize: 36, fontWeight: 700, letterSpacing: "0.16em", color: theme.accent }}
        >
          {headline}
        </div>
        <div style={{ marginTop: 28, fontSize: 72, fontWeight: 800, lineHeight: 1.3 }}>
          該当するイベントは
          <br />
          ありません
        </div>
      </div>
    </AbsoluteFill>
  );
}
