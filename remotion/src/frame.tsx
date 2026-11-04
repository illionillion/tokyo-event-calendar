import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
import { theme } from "./theme";

/** 一覧の1画面。余白の外は薄いグレー、中は白のカード。 */
export function PromoFrame({ children }: { children: ReactNode }) {
  const opacity = useCut();

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: theme.page,
        color: theme.ink,
        fontFamily,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 48 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
}
