import { describe, expect, it } from "vitest";
import { PATTERNS, patternHref, sortPatterns, usageLink } from "../src/lib/guidance";

const titles = new Map([
  ["select", "Select"],
  ["link", "Link"],
]);

describe("usageLink", () => {
  it("links a component by id", () => {
    expect(usageLink("select", titles)).toEqual({ href: "/components/select/", text: "Use Select instead." });
  });

  it("links a pattern by patterns/<id>", () => {
    expect(usageLink("patterns/forms", titles)).toEqual({ href: "/patterns/forms/", text: "See the Forms pattern." });
  });

  it("returns null for an id that names nothing", () => {
    expect(usageLink("selekt", titles)).toBeNull();
    expect(usageLink("patterns/wizards", titles)).toBeNull();
  });
});

describe("patterns", () => {
  it("lists the five patterns in reading order", () => {
    expect(PATTERNS.map((p) => p.id)).toEqual(["forms", "navigation", "data", "empty-states", "errors-and-feedback"]);
    expect(patternHref("data")).toBe("/patterns/data/");
  });

  it("sorts entries in that order", () => {
    const entries = [{ id: "data" }, { id: "forms" }, { id: "errors-and-feedback" }];
    expect(sortPatterns(entries).map((e) => e.id)).toEqual(["forms", "data", "errors-and-feedback"]);
  });
});
