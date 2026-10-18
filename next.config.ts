import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const rawTextLoader = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "lib/raw-text-loader.cjs"
);

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: "javascript/auto",
      use: [rawTextLoader],
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["./lib/raw-text-loader.cjs"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
