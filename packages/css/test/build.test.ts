import { beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../build.mjs";

let css = "";
beforeAll(async () => {
  css = await buildCss();
});

describe("raster.css bundle", () => {
  it("declares the layer order before anything else", () => {
    expect(css.trimStart()).toMatch(
      /^@layer raster\.reset,\s*raster\.tokens,\s*raster\.base,\s*raster\.layout,\s*raster\.components,\s*raster\.utilities;/,
    );
  });

  it("declares the layer order first in the minified bundle too", async () => {
    const min = await buildCss({ minify: true });
    expect(min.trimStart()).toMatch(
      /^@layer raster\.reset,\s*raster\.tokens,\s*raster\.base,\s*raster\.layout,\s*raster\.components,\s*raster\.utilities;/,
    );
  });

  it("includes the generated tokens inside the tokens layer", () => {
    expect(css).toMatch(/@layer raster\.tokens\s*\{[\s\S]*--surface-page:/);
  });

  it("sets page colours and font from tokens in the base layer", () => {
    expect(css).toMatch(/@layer raster\.base\s*\{[\s\S]*background-color: var\(--surface-page\)/);
    expect(css).toContain("font-family: var(--font-sans)");
  });

  it("caps durations when reduced motion is requested", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--dur-layout: 0(?:ms|s)\b/);
    expect(css).toMatch(/\[data-motion="?reduce"?\][\s\S]*--dur-layout: 0(?:ms|s)\b/);
  });
});
