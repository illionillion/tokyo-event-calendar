import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { continueRender, delayRender, staticFile } from "remotion";
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

function Letter({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 160, fontWeight: 700, lineHeight: 1, color: theme.accent }}>
      {initial(title)}
    </div>
  );
}

/**
 * 1 枚のデコード失敗で動画全体を止めない。
 * そのカードだけ頭文字に戻す。
 */
function EventThumb({ card }: { card: PromoCard }) {
  const src = card.thumb ? staticFile(card.thumb) : null;
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!src || !image) return;
    const handle = delayRender(`サムネ ${card.id}`);
    let settled = false;
    const release = () => {
      if (settled) return;
      settled = true;
      continueRender(handle);
    };
    const fail = () => {
      if (settled) return;
      flushSync(() => setFailed(true));
      release();
    };
    image.addEventListener("error", fail);
    image.decode().then(release).catch(fail);
    return () => {
      image.removeEventListener("error", fail);
      release();
    };
  }, [card.id, src]);

  if (!src || failed) return <Letter title={card.title} />;

  return (
    <img
      ref={imageRef}
      src={src}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
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
        <EventThumb card={card} />
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
