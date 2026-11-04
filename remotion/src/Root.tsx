import { Composition } from "remotion";
import { sampleLt, sampleMokumoku } from "./samples";
import { durationInFrames, FPS } from "./timing";
import type { PromoProps } from "./types";
import { WeeklyPromo } from "./WeeklyPromo";

function promoComposition(id: string, props: PromoProps, width: number, height: number) {
  return (
    <Composition
      id={id}
      component={WeeklyPromo}
      durationInFrames={durationInFrames(props.cards.length)}
      fps={FPS}
      width={width}
      height={height}
      defaultProps={props}
      calculateMetadata={({ props: next }) => ({
        durationInFrames: durationInFrames(next.cards.length),
      })}
    />
  );
}

export function RemotionRoot() {
  return (
    <>
      {promoComposition("WeeklyLt", sampleLt, 1080, 1920)}
      {promoComposition("WeeklyMokumoku", sampleMokumoku, 1080, 1920)}
      {promoComposition("WeeklyLtLandscape", sampleLt, 1920, 1080)}
      {promoComposition("WeeklyMokumokuLandscape", sampleMokumoku, 1920, 1080)}
    </>
  );
}
