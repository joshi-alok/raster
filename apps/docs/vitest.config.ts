import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Unit tests use the React source, so they run without building @rasterdesign/react first.
    alias: { "@rasterdesign/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)) },
  },
  esbuild: { jsx: "automatic" },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
