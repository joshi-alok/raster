import { describe, expect, it } from "vitest";
import { fluid, foundationTokens, rem, TYPE_STEPS } from "../src/foundation";

describe("rem", () => {
  it("converts px to rem at a 16px root", () => {
    expect(rem(4)).toBe("0.25rem");
    expect(rem(44)).toBe("2.75rem");
    expect(rem(17)).toBe("1.0625rem");
  });
});

describe("fluid", () => {
  it("returns a plain rem value when min equals max", () => {
    expect(fluid(12, 12)).toBe("0.75rem");
  });

  it("interpolates between 360px and 1440px viewports", () => {
    expect(fluid(16, 17)).toBe("clamp(1rem, 0.9792rem + 0.0926vw, 1.0625rem)");
    expect(fluid(40, 52)).toBe("clamp(2.5rem, 2.25rem + 1.1111vw, 3.25rem)");
  });
});

describe("foundationTokens", () => {
  const t = foundationTokens();

  it("emits every type step with size, weight, tracking and leading", () => {
    for (const step of Object.keys(TYPE_STEPS)) {
      expect(t[`text-${step}-size`]).toBeDefined();
      expect(t[`text-${step}-weight`]).toBeDefined();
      expect(t[`text-${step}-tracking`]).toBeDefined();
      expect(t[`text-${step}-leading`]).toBeDefined();
    }
    expect(t["text-h1-size"]).toBe(fluid(33, 42));
    expect(t["text-display-weight"]).toBe("300");
    expect(t["text-label-tracking"]).toBe("0.04em");
  });

  it("never uses a weight above 500", () => {
    for (const step of Object.values(TYPE_STEPS)) expect(step.weight).toBeLessThanOrEqual(500);
  });

  it("emits a nine-step spacing scale on a 4px base", () => {
    expect(t["space-1"]).toBe("0.25rem");
    expect(t["space-6"]).toBe("2rem");
    expect(t["space-9"]).toBe(fluid(64, 96));
    expect(t["space-10"]).toBeUndefined();
  });

  it("emits grid, control, focus and motion tokens", () => {
    expect(t["grid-gutter"]).toBe("clamp(1rem, 2vw, 2rem)");
    expect(t["page-margin"]).toBe("clamp(1rem, 5vw, 6rem)");
    expect(t["content-max"]).toBe("90rem");
    expect(t["control-height"]).toBe("2.5rem");
    expect(t["target-min"]).toBe("2.75rem");
    expect(t["focus-width"]).toBe("2px");
    expect(t["dur-fast"]).toBe("120ms");
    expect(t["ease-standard"]).toBe("cubic-bezier(0.2, 0, 0, 1)");
    expect(t["scrim"]).toBe("light-dark(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6))");
  });
});
