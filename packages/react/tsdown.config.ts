import { defineConfig } from "tsdown";

/**
 * One ESM file and one declaration file. Dependencies and peer dependencies stay external (tsdown's
 * default). Every component is a client component, so the bundle opens with "use client" for React
 * Server Components frameworks.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  dts: true,
  outDir: "dist",
  clean: true,
  sourcemap: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  banner: { js: '"use client";' },
});
