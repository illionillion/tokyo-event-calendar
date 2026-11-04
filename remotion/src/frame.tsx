import type { ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
import { theme } from "./theme";

export function useLandscape(): boolean {
  const { width, height } = useVideoConfig();
  return width > height;
}

/** 一覧の1画面。余白の外は薄いグレー、中は白のカード。 */
export function PromoFrame({ children }: { children: ReactNode }) {
  const opacity = useCut();
  const landscape = useLandscape();

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: theme.page,
        color: theme.ink,
        fontFamily,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: landscape ? 36 : 48,
        }}
      >
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
