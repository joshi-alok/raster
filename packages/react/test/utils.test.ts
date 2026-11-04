import { describe, expect, it } from "vitest";
import { cx } from "../src/utils/cx";

describe("cx", () => {
  it("joins truthy class names with single spaces", () => {
    expect(cx("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cx()).toBe("");
    expect(cx(false, undefined)).toBe("");
  });
});
