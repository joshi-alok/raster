import { describe, expect, it } from "vitest";
import * as raster from "../src";

describe("public API", () => {
  it("exports every Plan 2a component", () => {
    const expected = [
      "Container", "Section", "Stack", "Grid", "Col", "Rule",
      "Heading", "Text", "Label", "Figure",
      "Button", "IconButton", "Link",
      "Card", "Tag", "Callout", "Table",
      "cx",
    ];
    for (const name of expected) expect(typeof (raster as Record<string, unknown>)[name], name).toBe("function");
  });
});
