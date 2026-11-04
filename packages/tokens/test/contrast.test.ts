import { describe, expect, it } from "vitest";
import { checkTheme, contrastPairs, formatViolations } from "../src/contrast";
import { alpine, ROLES, themes, zurich } from "../src/themes";

describe("themes", () => {
  it("define a light and dark hex value for every role", () => {
    for (const theme of themes) {
      for (const role of ROLES) {
        const pair = theme.colors[role];
        expect(pair, `${theme.name} ${role}`).toHaveLength(2);
        for (const hex of pair) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("use 4px corners in Alpine and square corners in Zürich", () => {
    expect(alpine.radius).toBe("4px");
    expect(zurich.radius).toBe("0");
  });
});

describe("contrastPairs", () => {
  it("covers text on surfaces, control borders, fills and tints", () => {
    const pairs = contrastPairs();
    expect(pairs).toContainEqual({ foreground: "text-muted", background: "surface-subtle", minimum: 4.5 });
    expect(pairs).toContainEqual({ foreground: "border-strong", background: "surface-page", minimum: 3 });
    expect(pairs).toContainEqual({ foreground: "on-danger", background: "danger", minimum: 4.5 });
    expect(pairs).toContainEqual({ foreground: "on-accent-subtle", background: "accent-subtle", minimum: 4.5 });
    expect(pairs).toHaveLength(7 * 3 + 3 + 4 * 2);
  });
});

describe("checkTheme", () => {
  it.each(themes.map((t) => [t.name, t] as const))("%s passes every pair in both modes", (_name, theme) => {
    expect(checkTheme(theme)).toEqual([]);
  });

  it("reports each failing pair with its ratio", () => {
    const broken = { ...alpine, colors: { ...alpine.colors, "text-muted": ["#AAAAAA", "#8794A0"] as const } };
    const violations = checkTheme(broken);
    expect(violations).toHaveLength(3);
    expect(violations[0]).toMatchObject({
      theme: "alpine",
      mode: "light",
      foreground: "text-muted",
      background: "surface-page",
      minimum: 4.5,
    });
    expect(violations[0].ratio).toBeCloseTo(2.32, 2);
    expect(formatViolations(violations)).toContain("alpine/light: text-muted on surface-page = 2.32:1 (needs 4.5:1)");
  });
});
