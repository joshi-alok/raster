import { contrastRatio } from "./color";
import type { Role, Theme } from "./themes";

/** The categorical series roles, in the fixed order charts assign them. */
export const CHART_SLOTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"] as const;

/**
 * The limits every chart palette meets (spec §16), from the data-visualisation method:
 * - OKLCH lightness inside a band per mode;
 * - chroma high enough to read as a hue;
 * - neighbours apart under protanopia and deuteranopia (Machado 2009, severity 1.0) and under normal
 *   vision, as ΔE in OKLab ×100;
 * - 3:1 against every surface.
 */
export const CHART_LIMITS = {
  lightness: { light: [0.43, 0.77], dark: [0.48, 0.67] },
  chroma: 0.1,
  colourBlind: 8,
  normal: 15,
  contrast: 3,
} as const;

const SURFACES: readonly Role[] = ["surface-page", "surface-raised", "surface-subtle"];

const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
} as const;

type Vision = keyof typeof MACHADO;
type Rgb = readonly [number, number, number];

function linearRgb(hex: string): Rgb {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return [r, g, b];
}

function oklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function simulate(rgb: Rgb, vision: Vision): Rgb {
  const clamp = (c: number) => Math.min(1, Math.max(0, c));
  const [m0, m1, m2] = MACHADO[vision];
  const row = (m: readonly number[]) => clamp(m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2]);
  return [row(m0), row(m1), row(m2)];
}

/** OKLCH lightness and chroma of a #RRGGBB colour. */
export function oklch(hex: string): { lightness: number; chroma: number } {
  const [l, a, b] = oklab(linearRgb(hex));
  return { lightness: l, chroma: Math.hypot(a, b) };
}

/** Distance between two colours in OKLab ×100, as seen with normal vision or simulated colour blindness. */
export function deltaE(a: string, b: string, vision?: Vision): number {
  const see = (hex: string) => oklab(vision ? simulate(linearRgb(hex), vision) : linearRgb(hex));
  const [p, q] = [see(a), see(b)];
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

export interface ChartIssue {
  theme: string;
  mode: "light" | "dark";
  check: "lightness" | "chroma" | "colour-blind" | "normal" | "contrast";
  detail: string;
}

/** Every way a theme's chart palette breaks the limits, in either mode; empty when it passes. */
export function checkChartPalette(theme: Theme): ChartIssue[] {
  const issues: ChartIssue[] = [];
  (["light", "dark"] as const).forEach((mode, i) => {
    const colours = CHART_SLOTS.map((slot) => theme.colors[slot][i]);
    const report = (check: ChartIssue["check"], detail: string) =>
      issues.push({ theme: theme.name, mode, check, detail });
    const [lo, hi] = CHART_LIMITS.lightness[mode];
    colours.forEach((hex, slot) => {
      const { lightness, chroma } = oklch(hex);
      if (lightness < lo || lightness > hi) report("lightness", `chart-${slot + 1} ${hex} L ${lightness.toFixed(3)}`);
      if (chroma < CHART_LIMITS.chroma) report("chroma", `chart-${slot + 1} ${hex} C ${chroma.toFixed(3)}`);
      for (const surface of SURFACES) {
        const ratio = contrastRatio(hex, theme.colors[surface][i]);
        if (ratio < CHART_LIMITS.contrast) report("contrast", `chart-${slot + 1} on ${surface} ${ratio.toFixed(2)}:1`);
      }
    });
    for (let slot = 1; slot < colours.length; slot++) {
      const [a, b] = [colours[slot - 1], colours[slot]];
      const pair = `chart-${slot} and chart-${slot + 1}`;
      const blind = Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan"));
      if (blind < CHART_LIMITS.colourBlind) report("colour-blind", `${pair} ΔE ${blind.toFixed(1)}`);
      const normal = deltaE(a, b);
      if (normal < CHART_LIMITS.normal) report("normal", `${pair} ΔE ${normal.toFixed(1)}`);
    }
  });
  return issues;
}
