import { Composition } from "remotion";
import { sampleLt, sampleMokumoku } from "./samples";
import { durationInFrames, FPS } from "./timing";
import { WeeklyPromo } from "./WeeklyPromo";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="WeeklyLt"
        component={WeeklyPromo}
        durationInFrames={durationInFrames(sampleLt.cards.length)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={sampleLt}
        calculateMetadata={({ props }) => ({
          durationInFrames: durationInFrames(props.cards.length),
        })}
      />
      <Composition
        id="WeeklyMokumoku"
        component={WeeklyPromo}
        durationInFrames={durationInFrames(sampleMokumoku.cards.length)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={sampleMokumoku}
        calculateMetadata={({ props }) => ({
          durationInFrames: durationInFrames(props.cards.length),
        })}
      />
    </>
  );
}
