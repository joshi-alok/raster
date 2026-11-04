import { describe, expect, it } from "vitest";
import { componentHref, groupComponents, neighbours, sortComponents } from "../src/lib/components";

const entry = (id: string, group: string, order: number) => ({ id, data: { title: id, group, order } }) as const;

const entries = [
  entry("link", "Actions", 3),
  entry("grid", "Layout", 3),
  entry("button", "Actions", 1),
  entry("heading", "Type", 1),
  entry("container", "Layout", 1),
];

describe("sortComponents", () => {
  it("orders by group (Layout, Type, Actions, …), then by order", () => {
    expect(sortComponents(entries).map((e) => e.id)).toEqual(["container", "grid", "heading", "button", "link"]);
  });
});

describe("groupComponents", () => {
  it("returns only the groups that have entries, in group order", () => {
    expect(groupComponents(entries).map((g) => [g.group, g.entries.map((e) => e.id)])).toEqual([
      ["Layout", ["container", "grid"]],
      ["Type", ["heading"]],
      ["Actions", ["button", "link"]],
    ]);
  });
});

describe("neighbours", () => {
  it("finds the previous and next entries", () => {
    const sorted = sortComponents(entries);
    expect(neighbours(sorted, "heading")).toEqual({ previous: sorted[1], next: sorted[3] });
    expect(neighbours(sorted, "container").previous).toBeUndefined();
    expect(neighbours(sorted, "link").next).toBeUndefined();
  });
});

describe("componentHref", () => {
  it("builds the page URL", () => {
    expect(componentHref("button")).toBe("/components/button/");
  });
});
