import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "../src/color";

describe("relativeLuminance", () => {
  it("is 1 for white and 0 for black", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("rejects anything that is not a 6-digit hex", () => {
    expect(() => relativeLuminance("#FFF")).toThrow("Invalid hex colour: #FFF");
    expect(() => relativeLuminance("white")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("matches the known WCAG value for #777777 on white", () => {
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#2F5F8A", "#FFFFFF")).toBeCloseTo(contrastRatio("#FFFFFF", "#2F5F8A"), 10);
  });
});
