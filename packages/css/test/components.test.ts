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
