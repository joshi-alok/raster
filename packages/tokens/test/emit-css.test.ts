import { describe, expect, it } from "vitest";
import { foundationCss, themeCss, tokensCss } from "../src/emit-css";
import { alpine, zurich } from "../src/themes";

describe("foundationCss", () => {
  const css = foundationCss();

  it("puts foundation tokens on :root and follows the OS colour scheme", () => {
    expect(css).toMatch(/^:root \{\n  color-scheme: light dark;\n/);
    expect(css).toContain("  --space-1: 0.25rem;\n");
    expect(css).toContain("  --text-body-size: clamp(1rem, 0.9792rem + 0.0926vw, 1.0625rem);\n");
  });

  it("lets data-mode force a colour scheme on any element", () => {
    expect(css).toContain('[data-mode="light"] {\n  color-scheme: light;\n}');
    expect(css).toContain('[data-mode="dark"] {\n  color-scheme: dark;\n}');
  });
});

describe("themeCss", () => {
  it("applies the default theme to :root as well as its data-theme selector", () => {
    const css = themeCss(alpine, true);
    expect(css.startsWith(':root, [data-theme="alpine"] {\n')).toBe(true);
    expect(css).toContain("  --surface-page: light-dark(#FFFFFF, #12181D);\n");
    expect(css).toContain("  --radius: 4px;\n");
  });

  it("scopes a non-default theme to its data-theme selector only", () => {
    const css = themeCss(zurich, false);
    expect(css.startsWith('[data-theme="zurich"] {\n')).toBe(true);
    expect(css).toContain("  --radius: 0;\n");
    expect(css).toContain("  --brand-signal: light-dark(#E5341D, #F2836F);\n");
  });
});

describe("tokensCss", () => {
  it("emits foundation, then Alpine, then Zürich", () => {
    const css = tokensCss();
    const f = css.indexOf("--space-1");
    const a = css.indexOf('[data-theme="alpine"]');
    const z = css.indexOf('[data-theme="zurich"]');
    expect(f).toBeGreaterThan(-1);
    expect(a).toBeGreaterThan(f);
    expect(z).toBeGreaterThan(a);
  });
});
