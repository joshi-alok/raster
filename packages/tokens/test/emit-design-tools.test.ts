import { describe, expect, it } from "vitest";
import { designToolFiles } from "../src/emit-design-tools";
import { foundationTokens, TYPE_STEPS } from "../src/foundation";
import { ROLES, themes } from "../src/themes";

const files = designToolFiles();
type Node = { [key: string]: unknown };
const TYPES = new Set(["color", "dimension", "fontFamily", "fontWeight", "number", "duration", "cubicBezier"]);

/** Every token in a file, as [path, token]. */
function tokens(node: Node, path: string[] = []): [string, Node][] {
  if ("$value" in node) return [[path.join("."), node]];
  return Object.entries(node).flatMap(([k, v]) => tokens(v as Node, [...path, k]));
}

describe("designToolFiles", () => {
  it("writes one file per theme mode and one per size mode", () => {
    expect(Object.keys(files).sort()).toEqual([
      "raster-alpine-dark.tokens.json",
      "raster-alpine-light.tokens.json",
      "raster-size-desktop.tokens.json",
      "raster-size-mobile.tokens.json",
      "raster-zurich-dark.tokens.json",
      "raster-zurich-light.tokens.json",
    ]);
  });

  it("gives every token a known $type and a $value", () => {
    for (const [file, content] of Object.entries(files)) {
      for (const [path, token] of tokens(content as Node)) {
        expect(TYPES.has(String(token.$type)), `${file} ${path}`).toBe(true);
      }
    }
  });

  it("carries every role colour, as the theme defines it", () => {
    for (const theme of themes) {
      for (const [mode, i] of [["light", 0], ["dark", 1]] as const) {
        const color = (files[`raster-${theme.name}-${mode}.tokens.json`] as Node).color as Node;
        for (const role of ROLES) {
          expect((color[role] as Node).$value, `${theme.name} ${mode} ${role}`).toMatchObject({
            colorSpace: "srgb",
            hex: theme.colors[role][i].toLowerCase(),
          });
        }
      }
    }
  });

  it("writes colours as sRGB components between 0 and 1", () => {
    const accent = ((files["raster-alpine-light.tokens.json"] as Node).color as Node).accent as Node;
    const { components } = accent.$value as { components: number[] };
    expect(components).toHaveLength(3);
    for (const c of components) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it("resolves fluid sizes at 360px (mobile) and 1440px (desktop), the ends of the CSS clamp()", () => {
    const size = (mode: string) => files[`raster-size-${mode}.tokens.json`] as Node;
    const value = (mode: string, group: string, name: string) =>
      (((size(mode)[group] as Node)[name] as Node).$value as { value: number }).value;
    expect(value("mobile", "space", "9")).toBe(64);
    expect(value("desktop", "space", "9")).toBe(96);
    expect(value("mobile", "layout", "grid-gutter")).toBe(16);
    expect(value("desktop", "layout", "grid-gutter")).toBe(28.8);
    for (const [name, step] of Object.entries(TYPE_STEPS)) {
      const text = (mode: string) => ((size(mode).text as Node)[name] as Node).size as Node;
      expect((text("mobile").$value as { value: number }).value).toBe(step.min);
      expect((text("desktop").$value as { value: number }).value).toBe(step.max);
    }
  });

  it("matches the CSS: each fluid token's mobile value is the clamp()'s minimum", () => {
    const css = foundationTokens();
    const mobile = files["raster-size-mobile.tokens.json"] as Node;
    for (let i = 1; i <= 9; i++) {
      const min = Number(/^(?:clamp\()?([\d.]+)rem/.exec(css[`space-${i}`])![1]) * 16;
      expect((((mobile.space as Node)[String(i)] as Node).$value as { value: number }).value).toBe(min);
    }
  });

  it("matches the CSS layout constants and durations", () => {
    const size = (mode: string) => files[`raster-size-${mode}.tokens.json`] as Node;
    const value = (mode: string, group: string, name: string) =>
      (((size(mode)[group] as Node)[name] as Node).$value as { value: number }).value;
    // page-margin is clamp(1rem, 5vw, 6rem): 5% of 360 = 18, 5% of 1440 = 72.
    expect(value("mobile", "layout", "page-margin")).toBe(18);
    expect(value("desktop", "layout", "page-margin")).toBe(72);
    const css = foundationTokens();
    const remPx = (v: string) => Number(/^([\d.]+)rem$/.exec(v)![1]) * 16;
    for (const name of ["content-max", "control-height", "target-min", "header-height"]) {
      expect(value("desktop", "layout", name), name).toBe(remPx(css[name]));
    }
    for (const name of ["focus-width", "focus-offset", "radius-full"]) {
      expect(value("mobile", "layout", name), name).toBe(parseFloat(css[name]));
    }
    for (const name of ["dur-fast", "dur-base", "dur-slow", "dur-layout"]) {
      expect(value("mobile", "motion", name), name).toBe(parseFloat(css[name]));
    }
  });

  it("turns tracking in em into pixels at each size", () => {
    const display = ((files["raster-size-desktop.tokens.json"] as Node).text as Node).display as Node;
    expect((display.tracking as Node).$value).toEqual({ value: -1.3, unit: "px" });
  });
});
