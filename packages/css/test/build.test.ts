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

describe("layout: container and grid", () => {
  it("makes the container a named size container with fluid margins", () => {
    expect(css).toMatch(/\.sw-container\s*\{[^}]*container:\s*raster\s*\/\s*inline-size/);
    expect(css).toMatch(/\.sw-container\s*\{[^}]*padding-inline:\s*var\(--page-margin\)/);
  });

  it("starts the grid at 4 columns and switches to 8 and 12 by container width", () => {
    expect(css).toMatch(/\.sw-grid\s*\{[^}]*--_cols:\s*4/);
    expect(css).toMatch(/@container[^{]*600px[^{]*\{\s*\.sw-grid\s*\{\s*--_cols:\s*8/);
    expect(css).toMatch(/@container[^{]*1024px[^{]*\{\s*\.sw-grid\s*\{\s*--_cols:\s*12/);
  });

  it("lets columns set a span per column count", () => {
    expect(css).toContain("span var(--span-4, 4)");
    expect(css).toContain("span var(--span-8, 8)");
    expect(css).toContain("span var(--span-12, 12)");
  });

  it("ships the hanging and asymmetric split presets", () => {
    // Lightning CSS may drop the quotes around attribute values, so match either form.
    expect(css).toMatch(/\.sw-grid\[data-layout="?hanging"?\]/);
    expect(css).toMatch(/\.sw-grid\[data-layout="?split-5-7"?\]/);
    expect(css).toMatch(/\.sw-grid\[data-layout="?split-1-2"?\]/);
  });

  it("ships visible grid rules and the debug overlay", () => {
    expect(css).toContain(".sw-grid[data-grid-rules]");
    expect(css).toContain(".sw-grid[data-grid-debug]");
  });

  it("aligns overlays to the content box and mirrors them in RTL", () => {
    for (const attr of ["data-grid-rules", "data-grid-debug"]) {
      const base = css.match(new RegExp(`\\.sw-grid\\[${attr}\\]\\s*\\{[^}]*\\}`));
      expect(base?.[0]).toMatch(/background-origin:\s*content-box/);
      expect(base?.[0]).toMatch(/background-clip:\s*content-box/);
      const rtl = css.match(new RegExp(`\\.sw-grid\\[${attr}\\]:dir\\(rtl\\)\\s*\\{[^}]*\\}`));
      expect(rtl?.[0]).toContain("to left");
    }
  });
});

describe("layout: stack and rule", () => {
  it("stacks with a token gap that data-gap can change", () => {
    expect(css).toMatch(/\.sw-stack\s*\{[^}]*gap:\s*var\(--stack-gap,\s*var\(--space-4\)\)/);
    expect(css).toMatch(/\.sw-stack\[data-gap="?9"?\]\s*\{\s*--stack-gap:\s*var\(--space-9\)/);
  });

  it("draws hairline rules with strong and signal variants", () => {
    expect(css).toMatch(/\.sw-rule\s*\{[^}]*border-block-start:\s*1px solid var\(--border\)/);
    expect(css).toMatch(/\.sw-rule\[data-variant="?signal"?\][^{]*\{[^}]*var\(--brand-signal\)/);
  });
});

describe("utilities", () => {
  it("lives in the last layer", () => {
    expect(css).toMatch(/@layer raster\.utilities\s*\{[\s\S]*\.sw-type-h1/);
  });

  it("offers every type step as a class", () => {
    for (const step of ["display", "h1", "h2", "h3", "h4", "body", "caption", "label"]) {
      expect(css).toContain(`.sw-type-${step}`);
    }
  });

  it("caps the reading measure and offers screen-reader-only text", () => {
    expect(css).toMatch(/\.sw-measure\s*\{[^}]*max-inline-size:\s*66ch/);
    expect(css).toContain(".sw-sr-only");
  });

  it("offers block margin utilities for all nine spacing steps", () => {
    expect(css).toMatch(/\.sw-mbs-1\s*\{\s*margin-block-start:\s*var\(--space-1\)/);
    expect(css).toMatch(/\.sw-mbe-9\s*\{\s*margin-block-end:\s*var\(--space-9\)/);
  });
});
