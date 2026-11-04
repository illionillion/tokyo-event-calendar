import { AbsoluteFill, Series } from "remotion";
import { EmptyWeek } from "./EmptyWeek";
import { Ending } from "./Ending";
import { EventCard } from "./EventCard";
import { Opening } from "./Opening";
import { theme } from "./theme";
import { CARD_FRAMES, EMPTY_FRAMES, ENDING_FRAMES, OPENING_FRAMES } from "./timing";
import type { PromoProps } from "./types";

/**
 * 音声はまだ入れない。
 * VOICEVOX のナレーションを足すときは、wav を public に置いて
 * <Audio src={staticFile("voice/narration.wav")} /> をこの直下に足す。
 * BGM は <Audio src={staticFile("bgm/bed.mp3")} volume={0.18} loop />。
 */
export function WeeklyPromo(props: PromoProps) {
  const empty = props.cards.length === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.page }}>
      <Series>
        <Series.Sequence durationInFrames={OPENING_FRAMES}>
          <Opening {...props} />
        </Series.Sequence>
        {empty ? (
          <Series.Sequence durationInFrames={EMPTY_FRAMES}>
            <EmptyWeek headline={props.headline} />
          </Series.Sequence>
        ) : (
          props.cards.map((card) => (
            <Series.Sequence key={`${card.id}-${card.index}`} durationInFrames={CARD_FRAMES}>
              <EventCard card={card} />
            </Series.Sequence>
          ))
        )}
        <Series.Sequence durationInFrames={ENDING_FRAMES}>
          <Ending {...props} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
