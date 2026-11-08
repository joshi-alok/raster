import { describe, expect, it } from "vitest";
import { PATTERNS, patternHref, sortPatterns, usageLink } from "../src/lib/guidance";
import { entries } from "./frontmatter";

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

describe("usage on component pages", () => {
  const components = entries("components");
  const patterns = entries("patterns");
  const titles = new Map(components.map((c) => [c.id, String(c.data.title)]));

  it("covers all 60 components", () => {
    expect(components).toHaveLength(60);
  });

  it.each(components.map((c) => [c.id, c] as const))("%s says when to use it and when not to", (_, c) => {
    expect(Array.isArray(c.data.use) && c.data.use.length > 0).toBe(true);
    expect(Array.isArray(c.data.avoid) && c.data.avoid.length > 0).toBe(true);
  });

  it("points every 'instead' at a page that exists", () => {
    const broken = components.flatMap((c) =>
      ((c.data.avoid as { text: string; instead?: string }[] | undefined) ?? [])
        .filter((a) => a.instead !== undefined && usageLink(a.instead, titles) === null)
        .map((a) => `${c.id}: ${a.instead}`),
    );
    expect(broken).toEqual([]);
  });

  it("has a page for every pattern in PATTERNS, and no others", () => {
    expect(patterns.map((p) => p.id).sort()).toEqual(PATTERNS.map((p) => p.id).sort());
  });

  it("titles each pattern page as PATTERNS does, so link text and page agree", () => {
    for (const p of patterns) expect(p.data.title).toBe(PATTERNS.find((q) => q.id === p.id)?.title);
  });

  it("names only real components in each pattern", () => {
    const unknown = patterns.flatMap((p) =>
      (p.data.components as string[]).filter((id) => !titles.has(id)).map((id) => `${p.id}: ${id}`),
    );
    expect(unknown).toEqual([]);
  });
});
