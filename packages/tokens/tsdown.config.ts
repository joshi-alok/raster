import { defineConfig } from "tsdown";

/** The library: themes, scales, checks and emitters, as one ESM file with declarations. */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  dts: true,
  outDir: "dist",
  clean: false, // dist also holds tokens.css, tokens.json and design-tools/, written by src/build.ts
  sourcemap: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
