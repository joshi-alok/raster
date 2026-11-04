import { describe, expect, it } from "vitest";
import * as raster from "../src";

describe("public API", () => {
  it("exports every Plan 2a component", () => {
    const expected = [
      "Container", "Section", "Stack", "Grid", "Col", "Rule",
      "Heading", "Text", "Eyebrow", "Figure",
      "Button", "IconButton", "Link",
      "Card", "Tag", "Callout", "Table",
      "cx",
    ];
    for (const name of expected) expect(typeof (raster as Record<string, unknown>)[name], name).toBe("function");
  });

  it("does not export the old Label name", () => {
    expect("Label" in raster).toBe(false);
  });
});
