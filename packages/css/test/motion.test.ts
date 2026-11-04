import { beforeAll, describe, expect, it } from "vitest";
import { buildCss, buildMotionCss } from "../build.mjs";

let motion = "";
let core = "";
beforeAll(async () => {
  motion = await buildMotionCss();
  core = await buildCss();
});

describe("motion.css (expressive tier)", () => {
  it("is a separate opt-in stylesheet, not part of raster.css", () => {
    expect(motion).toContain(".sw-reveal");
    expect(core).not.toContain("sw-reveal-in");
  });

  it("reveals on scroll only where view timelines are supported", () => {
    expect(motion).toMatch(/@supports \(animation-timeline: view\(\)\)/);
    expect(motion).toMatch(/--_reveal-timeline:\s*view\(\)/);
    expect(motion).toMatch(/animation-timeline:\s*var\(--_reveal-timeline\)/);
  });

  it("never merges the timeline into the animation shorthand (browsers reject that)", () => {
    expect(motion).not.toMatch(/animation:[^;]*view\(\)/);
  });

  it("uses backwards fill only, so no transform lingers after the reveal", () => {
    expect(motion).toMatch(/animation:[^;]*sw-reveal-in[^;]*;/);
    expect(motion).toMatch(/animation:[^;]*backwards/);
    expect(motion).not.toMatch(/animation:[^;]*(forwards|both)/);
  });

  it("staggers children column by column", () => {
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > :nth-child\(2\)\s*\{\s*--_i:\s*1/);
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > :nth-child\(12\)[^{]*\{\s*--_i:\s*11/);
  });

  it("turns page transitions on, and everything off under reduced motion", () => {
    expect(motion).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*@view-transition\s*\{\s*navigation:\s*none/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation:\s*none/);
    expect(motion).toMatch(/\[data-motion="?reduce"?\] :is\([^)]*\.sw-reveal[^{]*\{\s*animation:\s*none/);
  });

  it("completes the reveal once the element is fully in view, even at the page end", () => {
    const range = motion.match(/animation-range:([^;]*);/)?.[1] ?? "";
    expect(range).toMatch(/entry 100%\s*$/);
    expect(range).not.toContain("cover");
  });

  it("starts the layer order with the canonical statement", () => {
    expect(motion.trimStart()).toMatch(
      /^@layer\s+raster\.reset,\s*raster\.tokens,\s*raster\.base,\s*raster\.layout,\s*raster\.components,\s*raster\.utilities;/,
    );
  });

  it("resets the stagger index for the first child and caps it past twelve", () => {
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > \*\s*\{[^}]*--_i:\s*0/);
    expect(motion).toMatch(/:nth-child\(n ?\+ ?13\)[^{]*\{\s*--_i:\s*11/);
  });

  it("switches the weight shift off under [data-motion=reduce]", () => {
    expect(motion).toMatch(/\[data-motion="?reduce"?\] \.sw-weight-shift\s*\{\s*transition:\s*none/);
  });

  it("offers the variable-weight shift", () => {
    expect(motion).toMatch(/\.sw-weight-shift\s*\{[^}]*transition:\s*font-weight var\(--dur-base\)/);
  });
});
