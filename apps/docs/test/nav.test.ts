import { describe, expect, it } from "vitest";
import { ariaCurrent, FOUNDATIONS, NAV } from "../src/lib/nav";

const item = (label: string) => NAV.find((i) => i.label === label)!;

describe("ariaCurrent", () => {
  it("marks an exact match", () => {
    expect(ariaCurrent("/", item("Principles"))).toBe("page");
    expect(ariaCurrent("/themes/", item("Themes"))).toBe("page");
  });

  it("marks a section link as current (but not as the page) inside the section", () => {
    expect(ariaCurrent("/foundations/type/", item("Foundations"))).toBe("true");
    expect(ariaCurrent("/components/button/", item("Components"))).toBe("true");
    expect(ariaCurrent("/components/", item("Components"))).toBe("page");
  });

  it("does not treat the home page as a section", () => {
    expect(ariaCurrent("/components/", item("Principles"))).toBeUndefined();
  });

  it("has a Templates section", () => {
    expect(ariaCurrent("/templates/", item("Templates"))).toBe("page");
    expect(ariaCurrent("/templates/article/", item("Templates"))).toBe("true");
  });

  it("has a Patterns section between Components and Templates", () => {
    expect(NAV.map((i) => i.label)).toEqual(["Principles", "Foundations", "Components", "Patterns", "Templates", "Themes"]);
    expect(ariaCurrent("/patterns/", item("Patterns"))).toBe("page");
    expect(ariaCurrent("/patterns/forms/", item("Patterns"))).toBe("true");
  });

  it("lists Content style under Foundations", () => {
    expect(FOUNDATIONS.at(-1)).toEqual({ href: "/foundations/content/", label: "Content style" });
  });

  it("tolerates a missing trailing slash", () => {
    expect(ariaCurrent("/foundations/type", FOUNDATIONS[1])).toBe("page");
  });
});
