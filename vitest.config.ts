import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig, type Plugin } from "vitest/config";

function markdownRawPlugin(): Plugin {
  return {
    name: "markdown-raw",
    enforce: "pre",
    load(id) {
      const filePath = id.split("?")[0];
      if (!filePath?.endsWith(".md")) return null;
      return `export default ${JSON.stringify(readFileSync(filePath, "utf8"))}`;
    },
  };
}

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), markdownRawPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(configDir, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
