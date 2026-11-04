import { interpolate, useCurrentFrame } from "remotion";

/** ほぼ硬切り。2 フレームだけ立ち上げて、その後は静止させる（容量を増やさない）。 */
export function useCut(): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
