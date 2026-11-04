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
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > :nth-child\(12\)\s*\{\s*--_i:\s*11/);
  });

  it("turns page transitions on, and everything off under reduced motion", () => {
    expect(motion).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*@view-transition\s*\{\s*navigation:\s*none/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation:\s*none/);
    expect(motion).toMatch(/\[data-motion="?reduce"?\] :is\([^)]*\.sw-reveal[^{]*\{\s*animation:\s*none/);
  });

  it("offers the variable-weight shift", () => {
    expect(motion).toMatch(/\.sw-weight-shift\s*\{[^}]*transition:\s*font-weight var\(--dur-base\)/);
  });
});
