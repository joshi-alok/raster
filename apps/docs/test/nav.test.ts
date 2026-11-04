import { describe, expect, it } from "vitest";
import { ariaCurrent, FOUNDATIONS, NAV } from "../src/lib/nav";

const item = (label: string) => NAV.find((i) => i.label === label)!;

describe("ariaCurrent", () => {
  it("marks an exact match", () => {
    expect(ariaCurrent("/", item("Principles"))).toBe("page");
    expect(ariaCurrent("/themes/", item("Themes"))).toBe("page");
  });

  it("marks a section link on any page inside the section", () => {
    expect(ariaCurrent("/foundations/type/", item("Foundations"))).toBe("page");
    expect(ariaCurrent("/components/button/", item("Components"))).toBe("page");
  });

  it("does not treat the home page as a section", () => {
    expect(ariaCurrent("/components/", item("Principles"))).toBeUndefined();
  });

  it("tolerates a missing trailing slash", () => {
    expect(ariaCurrent("/foundations/type", FOUNDATIONS[1])).toBe("page");
  });
});
