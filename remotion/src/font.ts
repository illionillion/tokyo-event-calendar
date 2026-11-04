import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const fontFamily = '"Noto Sans JP", sans-serif';

const handle = delayRender("Noto Sans JP");

const face = new FontFace(
  "Noto Sans JP",
  `url(${staticFile("fonts/NotoSansJP-VF.woff2")}) format("woff2")`,
  { weight: "400 900", style: "normal" }
);

face
  .load()
  .then(() => {
    document.fonts.add(face);
    continueRender(handle);
  })
  .catch((error: unknown) => {
    cancelRender(error instanceof Error ? error : new Error("フォントを読み込めませんでした"));
  });
