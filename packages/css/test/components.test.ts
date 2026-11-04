import { beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../build.mjs";

let css = "";
beforeAll(async () => {
  css = await buildCss();
});

/** The body of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/"/g, '"?');
  const match = css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

describe("components layer", () => {
  it("holds component styles", () => {
    expect(css).toMatch(/@layer raster\.components\s*\{[\s\S]*\.sw-figure/);
  });
});

describe("figure", () => {
  it("stacks media and caption with a token gap", () => {
    expect(rule(".sw-figure")).toMatch(/display:\s*grid/);
    expect(rule(".sw-figure")).toMatch(/gap:\s*var\(--space-3\)/);
  });
});

describe("button", () => {
  it("is a 40px control with a token border and radius", () => {
    const r = rule(".sw-button");
    expect(r).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("extends the hit area to the touch target", () => {
    // Lightning CSS may print ::before as :before.
    expect(css).toMatch(
      /\.sw-button::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/,
    );
  });

  it("styles primary, ghost and danger variants from role tokens", () => {
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/background-color:\s*var\(--accent\)/);
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/color:\s*var\(--on-accent\)/);
    expect(rule('.sw-button[data-variant="ghost"]')).toMatch(/border-color:\s*(transparent|#0000)/);
    expect(rule('.sw-button[data-variant="danger"]')).toMatch(/background-color:\s*var\(--danger\)/);
  });

  it("keeps disabled buttons legible without opacity", () => {
    expect(css).toMatch(/\.sw-button:is\(:disabled,\s*\[aria-disabled="?true"?\]\)\s*\{[^}]*color:\s*var\(--text-muted\)/);
    expect(css).not.toMatch(/\.sw-button[^{]*\{[^}]*opacity/);
  });

  it("makes icon buttons square", () => {
    expect(rule(".sw-icon-button")).toMatch(/inline-size:\s*var\(--control-height\)/);
  });
});

describe("link", () => {
  it("uses the accent colour with a thin underline that thickens on hover", () => {
    expect(rule(".sw-link")).toMatch(/color:\s*var\(--accent\)/);
    expect(rule(".sw-link")).toMatch(/text-decoration-thickness:\s*1px/);
    expect(rule(".sw-link:hover")).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mirrors the external-link arrow in right-to-left text", () => {
    expect(css).toMatch(/\.sw-link svg:dir\(rtl\)\s*\{[^}]*scaleX\(-1\)/);
  });
});
