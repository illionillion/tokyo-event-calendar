import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(70);
Config.setOverwriteOutput(true);

// アプリ本体の `@/` を、尺の定数だけ参照するために通す。
Config.overrideWebpackConfig((current) => {
  const alias = current.resolve?.alias;
  const record =
    alias && typeof alias === "object" && !Array.isArray(alias)
      ? (alias as Record<string, string | string[] | boolean>)
      : {};

  return {
    ...current,
    resolve: {
      ...current.resolve,
      alias: {
        ...record,
        "@": path.resolve(process.cwd(), ".."),
      },
    },
  };
});
