import { Img, staticFile } from "remotion";
import { PromoFrame } from "./frame";
import { theme } from "./theme";
import type { PromoCard } from "./types";

function initial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "・";
  const segment = new Intl.Segmenter("ja", { granularity: "grapheme" })
    .segment(trimmed)
    [Symbol.iterator]()
    .next().value;
  return segment?.segment ?? "・";
}

export function EventCard({ card }: { card: PromoCard }) {
  return (
    <PromoFrame>
      <div
        style={{
          margin: 28,
          height: 620,
          boxSizing: "border-box",
          padding: 20,
          backgroundColor: theme.thumb,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {card.thumb ? (
          <Img
            src={staticFile(card.thumb)}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <div style={{ fontSize: 160, fontWeight: 700, lineHeight: 1, color: theme.accent }}>
            {initial(card.title)}
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 40px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 700, color: theme.accent, lineHeight: 1.3 }}>
            {card.cancelled ? "中止　" : ""}
            {card.dateLabel}
            <span style={{ fontWeight: 500, color: theme.secondary }}>　{card.timeLabel}</span>
          </div>
          <div style={{ flexShrink: 0, fontSize: 28, fontWeight: 500, color: theme.faint }}>
            {card.index} / {card.total}
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.4,
            maxHeight: 52 * 1.4 * 4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.45,
            color: theme.muted,
          }}
        >
          {card.placeLabel}
        </div>
      </div>
    </PromoFrame>
  );
}
