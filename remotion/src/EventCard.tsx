import { AbsoluteFill, Img, staticFile } from "remotion";
import { useCut } from "./cut";
import { fontFamily } from "./font";
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
  const opacity = useCut();

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: theme.bg, color: theme.ink, fontFamily }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(820px 640px at 90% -8%, #5a1c22 0%, rgba(20,9,11,0) 58%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: theme.accent,
            }}
          >
            {card.dateLabel}
          </div>
          <div style={{ marginTop: 8, fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
            {card.timeLabel}
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.muted }}>
          {String(card.index).padStart(2, "0")}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 72,
          right: 72,
          height: 860,
          borderRadius: 36,
          overflow: "hidden",
          backgroundColor: "#2a1418",
        }}
      >
        {card.thumb ? (
          <Img
            src={staticFile(card.thumb)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <AbsoluteFill
            style={{
              background: "linear-gradient(160deg, #3a1518 0%, #1a0c0e 72%)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 280, fontWeight: 800, lineHeight: 1 }}>
              {initial(card.title)}
            </div>
          </AbsoluteFill>
        )}
        {card.cancelled ? (
          <div
            style={{
              position: "absolute",
              top: 32,
              left: 32,
              padding: "10px 22px",
              borderRadius: 999,
              backgroundColor: theme.stamp,
              color: theme.stampInk,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            中止
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", top: 1180, left: 72, right: 72 }}>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.28,
            maxHeight: 58 * 1.28 * 4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
          }}
        >
          {card.title}
        </div>
        <div style={{ marginTop: 28, fontSize: 36, fontWeight: 700, color: theme.muted }}>
          {card.placeLabel}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 16,
          backgroundColor: "rgba(255,247,243,0.14)",
        }}
      >
        <div
          style={{
            width: `${(card.index / card.total) * 100}%`,
            height: "100%",
            backgroundColor: theme.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
