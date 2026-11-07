# Raster Plan 7f: Charts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add BarChart, LineChart and Sparkline to Raster (58 → 61 components), on both routes, with new chart colour roles held to colour-blindness and contrast limits by test, a docs page each, browser tests, parity and forced-colours screenshots and visual baselines.

**Architecture:** Pure geometry functions over `d3-scale` turn data into plot percentages. One SVG per chart draws bars, lines and areas, stretched over the plot (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`). Every word is HTML positioned by percentages in custom properties: ticks, gridlines, category labels, the legend, markers, end labels and the tooltip. React components build that markup and add a focus layer (one tab stop, arrow keys, named marks, a tooltip). The HTML route is the same markup, written by a server. The docs' native examples are generated from the React components with `interactive={false}`, and a unit test keeps them current.

**Tech stack:** `@raster/tokens` (TypeScript), Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1 (`useLocale` only), d3-scale 4.0.2, Vitest 3.2 + jsdom + user-event, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2](../specs/2026-11-06-raster-v2-components-design.md), section 16 (the Plan 7f design), plus sections 4–7.

**Branch:** `raster/plan-7f`, created from main.

---

## Lessons carried from Plans 7a–7e

- **Lightning CSS printing:**
  - It drops default values.
  - It prints `transparent` as `#0000` and lower-cases system colours, so use the `i` flag.
  - It prints `::before` as `:before`.
  - It joins grouped selectors onto one line.
  - It may print `0.12` as `.12`.
  - When a CSS test fails only because of printing, adjust the regex minimally with a comment. Never weaken it.
- **The plan's code is partly unrun.**
  - The geometry and the token check were run before this plan was written, and their expected numbers are real.
  - The React, CSS and docs code is unrun.
  - When a library behaves differently from what a test expects, find the real behaviour, correct the test to it and say why. Never weaken a test so it no longer checks its point.
- **Forced colours** drops backgrounds and box shadows, and forces SVG `fill` and `stroke`. Anything that carries a series colour needs `forced-color-adjust: none`.
- **Accessibility checks on docs pages:**
  - A plain `div` may not carry `aria-label`.
  - Adjacent small targets need 24px spacing.
  - Docs code blocks are labelled "HTML code: <title>", so `getByLabel` may need `{ exact: true }`.
- **Look at the screenshots.** Layout bugs have repeatedly passed every test and been caught only by eye. Task 8 ends by opening named images.
- **Regenerating baselines:** the tolerance can hide a small change. Delete a baseline before regenerating it, rather than relying on `--update-snapshots` to notice.

## Conventions every task follows

- **Running things:**
  - Run commands from the repository root.
  - One React test file: `cd packages/react && npx vitest run test/charts.test.tsx`.
  - Rebuild before docs browser tests: `pnpm --filter @raster/tokens build && pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`.
- **CSS:**
  - It goes in `packages/css/src/components/chart.css`, imported in `packages/css/src/index.css` with `layer(raster.components)` after `data-grid.css`.
  - No raw colours. System colours appear only inside `@media (forced-colors: active)`.
- **React:**
  - Charts live in `packages/react/src/charts/`. Every component forwards `ref` (React 19: a prop) and merges `className` with `cx` from `../utils/cx`.
  - Exports go in `packages/react/src/index.ts` after the DataGrid export. Each value export is added to `expected` in `packages/react/test/exports.test.ts`.
- **Charts lay out left to right:** the SVG never mirrors, so `.sw-chart-frame` sets `direction: ltr`.
- **Commits:** commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/tokens/src/themes.ts` | Seven new roles, `chart-1`–`chart-6` and `chart-muted`, in both themes |
| `packages/tokens/src/chart-palette.ts` | `CHART_SLOTS`, `CHART_LIMITS`, `oklch`, `deltaE`, `checkChartPalette` |
| `packages/tokens/test/chart-palette.test.ts` | The palette limits, held by test |
| `packages/react/src/charts/geometry.ts` | Pure layout: value axes, bars, lines, sparklines, hit testing, keyboard steps, formatting |
| `packages/react/src/charts/ChartFrame.tsx` | Shared figure, legend, axes, gridlines, focus layer, tooltip and data table |
| `packages/react/src/charts/BarChart.tsx`, `LineChart.tsx`, `Sparkline.tsx` | The three components |
| `packages/react/test/chart-geometry.test.ts`, `charts.test.tsx` | Unit tests |
| `packages/css/src/components/chart.css` | The CSS contract for both routes |
| `apps/docs/src/demos/bar-chart/`, `line-chart/`, `sparkline/` | Demos and generated native HTML |
| `apps/docs/test/chart-html.test.tsx` | Keeps each native example equal to the React rendering |
| `apps/docs/src/content/components/bar-chart.mdx`, `line-chart.mdx`, `sparkline.mdx` | Pages in the Display group, orders 16–18 |
| `apps/docs/src/pages/foundations/colour.astro` | One usage line about chart colours |
| `apps/docs/e2e/keyboard.spec.ts`, `parity.spec.ts`, `forced-colors.spec.ts` | Browser tests |

## The markup contract

Both routes produce this markup. React adds the parts marked "React only".

```html
<figure class="sw-chart" data-chart="bar" data-orientation="vertical">
  <figcaption class="sw-chart-caption">Projects by year</figcaption>
  <ul class="sw-chart-legend">                      <!-- two or more series only -->
    <li class="sw-chart-legend-item" data-series="1"><span class="sw-chart-swatch" aria-hidden="true"></span>Built</li>
  </ul>
  <div class="sw-chart-frame">
    <div class="sw-chart-axis" data-axis="y" aria-hidden="true">
      <span class="sw-chart-tick" style="--at:100%">0</span>          <!-- --at from the top -->
    </div>
    <div class="sw-chart-plot">
      <div class="sw-chart-gridline" data-zero="" style="--at:100%"></div>
      <svg class="sw-chart-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <rect class="sw-chart-bar" data-series="1" x="5" y="33.3333" width="20" height="66.6667"></rect>
        <!-- lines: <g data-series="1"><path class="sw-chart-area" d="…"/><path class="sw-chart-line" d="…"/></g> -->
      </svg>
      <!-- lines: <span class="sw-chart-point" data-series="1" style="--x:0%;--y:100%"></span> -->
      <!-- React only: -->
      <div class="sw-chart-targets" role="group" aria-labelledby="…">
        <span class="sw-chart-target" role="img" aria-label="Built, 2023: 4" tabindex="0" style="--x:5%;--y:33.3333%;--w:20%;--h:66.6667%"></span>
      </div>
      <div class="sw-chart-tooltip" aria-hidden="true" data-align="center" style="--x:15%;--y:33.3333%">…</div>
    </div>
    <div class="sw-chart-ends" aria-hidden="true">…</div>       <!-- lines with 2–4 series -->
    <div class="sw-chart-axis" data-axis="x" aria-hidden="true">
      <span class="sw-chart-tick" style="--at:25%">2023</span>       <!-- --at from the inline start -->
    </div>
  </div>
  <details class="sw-chart-data">
    <summary>Show data</summary>
    <div class="sw-table-wrap"><table class="sw-table">…</table></div>
  </details>
</figure>
```

Horizontal bars swap the axes: categories go down the `y` axis (`--at` from the top), and values run along the `x` axis (`--at` from the inline start). Their gridlines are vertical.

---

### Task 1: Chart colour roles and their check

**Files:**
- Create: `packages/tokens/src/chart-palette.ts`, `packages/tokens/test/chart-palette.test.ts`
- Modify: `packages/tokens/src/themes.ts`, `packages/tokens/src/index.ts`, `packages/tokens/test/emit-css.test.ts`

- [ ] **Step 1: Write the failing test.** Create `packages/tokens/test/chart-palette.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CHART_SLOTS, checkChartPalette, deltaE, oklch } from "../src/chart-palette";
import { alpine, ROLES, type Theme, themes } from "../src/themes";

describe("chart roles", () => {
  it("add six series slots and a muted role", () => {
    expect(CHART_SLOTS).toEqual(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"]);
    for (const role of [...CHART_SLOTS, "chart-muted"]) expect(ROLES).toContain(role);
  });

  it("take Alpine's blue for slot 1 and Zürich's cobalt", () => {
    expect(alpine.colors["chart-1"]).toEqual(["#2E6DB4", "#4A8AD4"]);
    expect(themes.find((t) => t.name === "zurich")?.colors["chart-1"]).toEqual(["#2F4BD8", "#7086F0"]);
  });
});

describe("colour maths", () => {
  it("measures OKLCH lightness and chroma", () => {
    const { lightness, chroma } = oklch("#2E6DB4");
    expect(lightness).toBeCloseTo(0.5299, 3);
    expect(chroma).toBeCloseTo(0.1291, 3);
  });

  it("measures distance in OKLab ×100, with and without simulated colour blindness", () => {
    // Plum and teal, Alpine's closest neighbours: 9.0 for colour-blind readers, 22.9 otherwise.
    expect(Math.min(deltaE("#8E4FA6", "#00897B", "protan"), deltaE("#8E4FA6", "#00897B", "deutan"))).toBeCloseTo(8.95, 1);
    expect(deltaE("#8E4FA6", "#00897B")).toBeCloseTo(22.89, 1);
    expect(deltaE("#2E6DB4", "#2E6DB4")).toBe(0);
  });
});

describe("checkChartPalette", () => {
  it.each(themes.map((t) => [t.name, t] as const))("%s passes every limit in both modes", (_name, theme) => {
    expect(checkChartPalette(theme)).toEqual([]);
  });

  it("reports grey slots, repeated slots and close neighbours", () => {
    const light = ["#2E6DB4", "#2E6DB4", "#00897B", "#8E4FA6", "#808080", "#C2457A"];
    const colors = { ...alpine.colors };
    light.forEach((hex, i) => {
      colors[CHART_SLOTS[i]] = [hex, alpine.colors[CHART_SLOTS[i]][1]];
    });
    const issues = checkChartPalette({ ...alpine, colors } as Theme);
    expect(issues.every((i) => i.mode === "light")).toBe(true);
    expect(issues.map((i) => `${i.check}: ${i.detail}`)).toEqual([
      "chroma: chart-5 #808080 C 0.000",
      "colour-blind: chart-1 and chart-2 ΔE 0.0",
      "normal: chart-1 and chart-2 ΔE 0.0",
      "normal: chart-2 and chart-3 ΔE 14.1",
      "colour-blind: chart-5 and chart-6 ΔE 1.7",
    ]);
  });
});
```

- [ ] **Step 2: Run it to see it fail.** Run `cd packages/tokens && npx vitest run test/chart-palette.test.ts`. Expected: FAIL, because `../src/chart-palette` cannot be resolved.

- [ ] **Step 3: Add the roles.** In `packages/tokens/src/themes.ts`, extend `ROLES` after `"brand-signal"`:

```ts
  "brand-signal",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-muted",
] as const;
```

Add these entries at the end of Alpine's `colors`, after `"brand-signal"`:

```ts
    // Charts (spec §16): series slots in a fixed order, checked by chart-palette.ts.
    "chart-1": ["#2E6DB4", "#4A8AD4"],
    "chart-2": ["#C8661A", "#D07A35"],
    "chart-3": ["#00897B", "#1A9E8F"],
    "chart-4": ["#8E4FA6", "#A26BC0"],
    "chart-5": ["#9A8A10", "#A39418"],
    "chart-6": ["#C2457A", "#D2638F"],
    "chart-muted": ["#B4BFC8", "#4A5763"],
```

Add these entries at the end of Zürich's `colors`. Slot 1 is cobalt; the other slots are shared with Alpine; muted is warm grey 300 and 700:

```ts
    "chart-1": ["#2F4BD8", "#7086F0"],
    "chart-2": ["#C8661A", "#D07A35"],
    "chart-3": ["#00897B", "#1A9E8F"],
    "chart-4": ["#8E4FA6", "#A26BC0"],
    "chart-5": ["#9A8A10", "#A39418"],
    "chart-6": ["#C2457A", "#D2638F"],
    "chart-muted": ["#BDB7AA", "#55524C"],
```

- [ ] **Step 4: Write the check.** Create `packages/tokens/src/chart-palette.ts`:

```ts
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
```

Add to `packages/tokens/src/index.ts`:

```ts
export { CHART_LIMITS, CHART_SLOTS, type ChartIssue, checkChartPalette, deltaE, oklch } from "./chart-palette";
```

- [ ] **Step 5: Pin the emitted CSS.** Add one line to the Zürich expectations in `packages/tokens/test/emit-css.test.ts`, next to the `--brand-signal` assertion:

```ts
    expect(css).toContain("  --chart-1: light-dark(#2F4BD8, #7086F0);\n");
```

- [ ] **Step 6: Run the tokens tests.** Run `cd packages/tokens && npx vitest run && npx tsc --noEmit`. Expected: all pass. The existing contrast tests are unchanged, because chart roles are not text.

- [ ] **Step 7: Build and commit.** Run `pnpm --filter @raster/tokens build`, then:

```bash
git add packages/tokens
git commit -m "feat(tokens): chart colour roles, held to colour-blindness and contrast limits"
```

---

### Task 2: Chart geometry

**Files:**
- Create: `packages/react/src/charts/geometry.ts`, `packages/react/test/chart-geometry.test.ts`
- Modify: `packages/react/package.json` (dependencies)

- [ ] **Step 1: Add d3-scale.** Run `pnpm --filter @raster/react add d3-scale@4.0.2 && pnpm --filter @raster/react add -D @types/d3-scale@4.0.9`.

- [ ] **Step 2: Write the failing tests.** Create `packages/react/test/chart-geometry.test.ts`. Every number below came from running this geometry.

```ts
import { describe, expect, it } from "vitest";
import {
  barLayout,
  lineLayout,
  nearestPoint,
  nearestRect,
  numberFormatter,
  sparklineLayout,
  sparklineSummary,
  spreadLabels,
  stackSpans,
  stepMark,
  valueAxis,
} from "../src/charts/geometry";

const DATA = [
  { year: "2023", built: 4, planned: 2 },
  { year: "2024", built: 6, planned: 3 },
];
const SERIES = [
  { key: "built", label: "Built" },
  { key: "planned", label: "Planned" },
];
const MONTHS = [
  { m: "Jan", a: 10, b: 30 },
  { m: "Feb", a: 20, b: 25 },
  { m: "Mar", a: 15, b: 40 },
];
const AB = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
];

describe("valueAxis", () => {
  it("puts nice ticks on an upward axis, measured from the top", () => {
    const axis = valueAxis([-3, 12], { upward: true });
    expect(axis.ticks.map((t) => t.value)).toEqual([-5, 0, 5, 10, 15]);
    expect(axis.ticks.map((t) => t.at)).toEqual([100, 75, 50, 25, 0]);
    expect(axis.zero).toBe(75);
  });

  it("measures a horizontal axis from the inline start", () => {
    expect(valueAxis([-3, 12], { upward: false }).ticks.map((t) => t.at)).toEqual([0, 25, 50, 75, 100]);
  });

  it("keeps an exact domain exact, and widens an empty one", () => {
    expect(valueAxis([0, 25], { upward: true, nice: false }).ticks.map((t) => t.value)).toEqual([0, 5, 10, 15, 20, 25]);
    expect(valueAxis([3, 3], { upward: true }).ticks[0].value).toBe(2);
  });

  it("has no zero when the domain leaves it out", () => {
    expect(valueAxis([10, 40], { upward: true }).zero).toBeNull();
  });
});

describe("barLayout", () => {
  it("groups series side by side inside each category's band, from zero", () => {
    const layout = barLayout({ data: DATA, x: "year", series: SERIES });
    expect(layout.categories).toEqual([
      { index: 0, label: "2023", at: 25, minor: false },
      { index: 1, label: "2024", at: 75, minor: false },
    ]);
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(layout.bars).toEqual([
      { series: 0, category: 0, value: 4, x: 5, y: 33.3333, width: 20, height: 66.6667 },
      { series: 1, category: 0, value: 2, x: 25, y: 66.6667, width: 20, height: 33.3333 },
      { series: 0, category: 1, value: 6, x: 55, y: 0, width: 20, height: 100 },
      { series: 1, category: 1, value: 3, x: 75, y: 50, width: 20, height: 50 },
    ]);
  });

  it("stacks horizontal bars along the value axis, categories from the top", () => {
    const layout = barLayout({ data: DATA, x: "year", series: SERIES, stacked: true, orientation: "horizontal" });
    expect(layout.axis.ticks.map((t) => [t.value, t.at])).toEqual([[0, 0], [2, 20], [4, 40], [6, 60], [8, 80], [10, 100]]);
    expect(layout.bars).toEqual([
      { series: 0, category: 0, value: 4, x: 0, y: 5, width: 40, height: 40 },
      { series: 1, category: 0, value: 2, x: 40, y: 5, width: 20, height: 40 },
      { series: 0, category: 1, value: 6, x: 0, y: 55, width: 60, height: 40 },
      { series: 1, category: 1, value: 3, x: 60, y: 55, width: 30, height: 40 },
    ]);
  });

  it("hangs negative bars below the zero line", () => {
    const layout = barLayout({ data: [{ k: "a", v: -5 }, { k: "b", v: 10 }], x: "k", series: [{ key: "v", label: "V" }] });
    expect(layout.axis.zero).toBe(50);
    expect(layout.bars[0]).toMatchObject({ y: 50, height: 25 });
    expect(layout.bars[1]).toMatchObject({ y: 0, height: 50 });
  });

  it("marks every other category label minor past six vertical categories", () => {
    const data = Array.from({ length: 8 }, (_, i) => ({ k: String(i), v: i }));
    const layout = barLayout({ data, x: "k", series: [{ key: "v", label: "V" }] });
    expect(layout.categories.map((c) => c.minor)).toEqual([false, true, false, true, false, true, false, true]);
    const horizontal = barLayout({ data, x: "k", series: [{ key: "v", label: "V" }], orientation: "horizontal" });
    expect(horizontal.categories.some((c) => c.minor)).toBe(false);
  });

  it("refuses a seventh series and a missing number", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ key: `s${i}`, label: `S${i}` }));
    expect(() => barLayout({ data: DATA, x: "year", series: seven })).toThrow(/at most 6 series/);
    expect(() => barLayout({ data: [{ year: "2023" }], x: "year", series: SERIES })).toThrow(/"built" must be a finite number/);
  });
});

describe("stackSpans", () => {
  it("stacks positives up and negatives down, separately", () => {
    expect(stackSpans([[3, -2, 4, -1]])).toEqual([[[0, 3], [0, -2], [3, 7], [-2, -3]]]);
  });
});

describe("lineLayout", () => {
  it("spaces categories edge to edge and draws each series as a path", () => {
    const layout = lineLayout({ data: MONTHS, x: "m", series: AB, area: true });
    expect(layout.categories.map((c) => c.at)).toEqual([0, 50, 100]);
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([10, 15, 20, 25, 30, 35, 40]);
    expect(layout.axis.zero).toBeNull();
    expect(layout.lines[0].path).toBe("M0,100L50,66.6667L100,83.3333");
    // Without zero in the domain, the area closes at the plot's foot.
    expect(layout.lines[0].area).toBe("M0,100L0,100L50,66.6667L100,83.3333L100,100Z");
    expect(layout.lines[0].end).toBe(83.3333);
  });

  it("takes an exact domain and leaves the area off unless asked", () => {
    const layout = lineLayout({ data: MONTHS, x: "m", series: AB, domain: [0, 50] });
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(layout.lines[0].area).toBeNull();
  });
});

describe("spreadLabels", () => {
  it("pushes close labels apart by the gap, keeping their order", () => {
    expect(spreadLabels([50, 52, 51], 8)).toEqual([50, 66, 58]);
  });

  it("keeps labels inside the plot", () => {
    expect(spreadLabels([98, 99], 8)).toEqual([92, 100]);
    expect(spreadLabels([], 8)).toEqual([]);
  });
});

describe("hit testing", () => {
  it("picks the bar under the pointer, or the nearest one", () => {
    const { bars } = barLayout({ data: DATA, x: "year", series: SERIES });
    expect(nearestRect(bars, 30, 90)).toBe(1);
    expect(nearestRect(bars, 70, 10)).toBe(2);
    expect(nearestRect([], 0, 0)).toBe(-1);
  });

  it("picks the nearest category, then the nearest series in it", () => {
    const points = lineLayout({ data: MONTHS, x: "m", series: AB }).lines.flatMap((l) => l.points);
    // Feb is nearest to x 48; B (y 50) is nearer to y 20 than A (y 66.7).
    expect(nearestPoint(points, 48, 20)).toBe(4);
  });
});

describe("stepMark", () => {
  const { bars } = barLayout({ data: DATA, x: "year", series: SERIES });

  it("moves along categories with Left and Right and across series with Up and Down", () => {
    expect(["ArrowRight", "ArrowDown", "End", "Home", "ArrowLeft"].map((k) => stepMark(bars, 0, k, "vertical"))).toEqual([
      2, 1, 2, 0, 0,
    ]);
  });

  it("swaps the pairs for horizontal bars", () => {
    expect(["ArrowDown", "ArrowRight", "ArrowUp"].map((k) => stepMark(bars, 0, k, "horizontal"))).toEqual([2, 1, 0]);
  });

  it("ignores keys it doesn't use", () => {
    expect(stepMark(bars, 0, "Tab", "vertical")).toBeNull();
  });
});

describe("sparklines", () => {
  it("fill their box from the lowest value to the highest", () => {
    expect(sparklineLayout([4.1, 3.8, 5, 6.3])).toEqual({
      path: "M0,88L33.3333,100L66.6667,52L100,0",
      area: "M0,100L0,88L33.3333,100L66.6667,52L100,0L100,100Z",
      last: { x: 100, y: 0 },
    });
    expect(sparklineLayout([2, 2]).path).toBe("M0,50L100,50");
    expect(sparklineLayout([]).last).toBeNull();
  });

  it("summarise the trend in a sentence", () => {
    const format = numberFormatter("en-US");
    expect(sparklineSummary("Revenue, 12 months", [4.1, 3.8, 5, 6.3], format)).toBe(
      "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3",
    );
    expect(sparklineSummary("Revenue", [], format)).toBe("Revenue: no data");
  });
});

describe("numberFormatter", () => {
  it("formats in the given locale with at most two decimals", () => {
    expect(numberFormatter("en-US")(12345.678)).toBe("12,345.68");
    expect(numberFormatter("de-DE")(12345.678)).toBe("12.345,68");
  });
});
```

- [ ] **Step 3: Run them to see them fail.** Run `cd packages/react && npx vitest run test/chart-geometry.test.ts`. Expected: FAIL, because `../src/charts/geometry` cannot be resolved.

- [ ] **Step 4: Write the geometry.** Create `packages/react/src/charts/geometry.ts`:

```ts
import { scaleBand, scaleLinear, scalePoint } from "d3-scale";

/** One row of chart data: the category under the chart's `x` key, and a number per series key. */
export type ChartDatum = Readonly<Record<string, string | number>>;

/** A series: the data key it reads and the label people see. */
export interface ChartSeries {
  key: string;
  label: string;
}

/** Colours are assigned in a fixed order and never cycled, so a chart holds at most six series. */
export const MAX_SERIES = 6;

/** A rectangle in plot percentages, measured from the top-left of the plot. */
export interface HitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rounds a percentage to four decimals, so server and client markup match exactly. */
export const pct = (n: number): number => Math.round(n * 1e4) / 1e4;

export function checkSeries(series: readonly ChartSeries[]): void {
  if (series.length === 0) throw new RangeError("A chart needs at least one series.");
  if (series.length > MAX_SERIES) {
    throw new RangeError(`Charts show at most ${MAX_SERIES} series; fold the rest into "Other".`);
  }
}

export function valueOf(datum: ChartDatum, key: string): number {
  const value = datum[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`"${key}" must be a finite number in every datum.`);
  }
  return value;
}

export interface Tick {
  value: number;
  /** Plot percentage: from the top when the axis runs upward, from the inline start otherwise. */
  at: number;
}

export interface ValueAxis {
  ticks: Tick[];
  /** Where zero sits, or null when the domain doesn't include it. */
  zero: number | null;
  position: (value: number) => number;
}

/**
 * A value axis over the plot. Upward axes (vertical bars, lines) measure from the top, as SVG does;
 * horizontal bars measure from the inline start. About five ticks, on nice numbers unless the
 * domain was given exactly.
 */
export function valueAxis(
  domain: readonly [number, number],
  { upward, nice = true }: { upward: boolean; nice?: boolean },
): ValueAxis {
  let [lo, hi] = domain;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const scale = scaleLinear().domain([lo, hi]).range(upward ? [100, 0] : [0, 100]);
  if (nice) scale.nice(5);
  const position = (value: number) => pct(scale(value));
  const [d0, d1] = scale.domain();
  return {
    ticks: scale.ticks(5).map((value) => ({ value, at: position(value) })),
    zero: d0 <= 0 && 0 <= d1 ? position(0) : null,
    position,
  };
}

export interface Category {
  index: number;
  label: string;
  /** Plot percentage of the category's centre along its axis. */
  at: number;
  /** Every other label, past six categories: CSS hides these when the chart is narrow. */
  minor: boolean;
}

const isMinor = (index: number, count: number) => count > 6 && index % 2 === 1;

/** Stacks each category's values: positives upward from zero, negatives downward. */
export function stackSpans(rows: readonly (readonly number[])[]): [number, number][][] {
  return rows.map((row) => {
    let up = 0;
    let down = 0;
    return row.map((value): [number, number] => {
      if (value >= 0) {
        up += value;
        return [up - value, up];
      }
      down += value;
      return [down - value, down];
    });
  });
}

export interface Bar extends HitRect {
  series: number;
  category: number;
  value: number;
}

export interface BarLayout {
  categories: Category[];
  axis: ValueAxis;
  bars: Bar[];
}

export function barLayout({
  data,
  x,
  series,
  orientation = "vertical",
  stacked = false,
}: {
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  orientation?: "vertical" | "horizontal";
  stacked?: boolean;
}): BarLayout {
  checkSeries(series);
  const vertical = orientation === "vertical";
  const values = data.map((datum) => series.map((s) => valueOf(datum, s.key)));
  const spans = stacked ? stackSpans(values) : values.map((row) => row.map((v): [number, number] => [0, v]));
  const ends = spans.flat(2);
  const lo = Math.min(0, ...ends);
  const hi = Math.max(0, ...ends);
  const axis = valueAxis([lo, hi === lo ? lo + 1 : hi], { upward: vertical });
  const band = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([0, 100])
    .paddingInner(0.2)
    .paddingOuter(0.1);
  const inner = scaleBand<number>()
    .domain(series.map((_, i) => i))
    .range([0, band.bandwidth()]);
  const categories = data.map((datum, i) => ({
    index: i,
    label: String(datum[x]),
    at: pct((band(i) ?? 0) + band.bandwidth() / 2),
    minor: vertical && isMinor(i, data.length),
  }));
  const bars: Bar[] = [];
  spans.forEach((row, category) =>
    row.forEach(([from, to], s) => {
      const start = (band(category) ?? 0) + (stacked ? 0 : (inner(s) ?? 0));
      const size = stacked ? band.bandwidth() : inner.bandwidth();
      const a = axis.position(from);
      const b = axis.position(to);
      const near = Math.min(a, b);
      const length = Math.abs(b - a);
      const value = values[category][s];
      bars.push(
        vertical
          ? { series: s, category, value, x: pct(start), y: pct(near), width: pct(size), height: pct(length) }
          : { series: s, category, value, x: pct(near), y: pct(start), width: pct(length), height: pct(size) },
      );
    }),
  );
  return { categories, axis, bars };
}

export interface LinePoint {
  series: number;
  category: number;
  value: number;
  x: number;
  y: number;
}

export interface Line {
  series: number;
  /** SVG path data in plot percentages. */
  path: string;
  /** The area under the line down to zero (or the plot's foot), when asked for. */
  area: string | null;
  points: LinePoint[];
  /** Where the line ends, for its end label. */
  end: number;
}

export interface LineLayout {
  categories: Category[];
  axis: ValueAxis;
  lines: Line[];
}

const pathOf = (points: readonly { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join("");

const areaOf = (points: readonly { x: number; y: number }[], base: number) =>
  points.length === 0
    ? ""
    : `M${points[0].x},${base}${points.map((p) => `L${p.x},${p.y}`).join("")}L${points[points.length - 1].x},${base}Z`;

export function lineLayout({
  data,
  x,
  series,
  domain,
  area = false,
}: {
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  domain?: readonly [number, number];
  area?: boolean;
}): LineLayout {
  checkSeries(series);
  const values = data.map((datum) => series.map((s) => valueOf(datum, s.key)));
  const all = values.flat();
  const axis = domain
    ? valueAxis(domain, { upward: true, nice: false })
    : valueAxis(all.length ? [Math.min(...all), Math.max(...all)] : [0, 1], { upward: true });
  const xs = scalePoint<number>()
    .domain(data.map((_, i) => i))
    .range([0, 100]);
  const categories = data.map((datum, i) => ({
    index: i,
    label: String(datum[x]),
    at: pct(xs(i) ?? 50),
    minor: isMinor(i, data.length),
  }));
  const base = axis.zero ?? 100;
  const lines = series.map((_, s) => {
    const points = values.map((row, category) => ({
      series: s,
      category,
      value: row[s],
      x: categories[category].at,
      y: axis.position(row[s]),
    }));
    return {
      series: s,
      path: pathOf(points),
      area: area ? areaOf(points, base) : null,
      points,
      end: points.length ? points[points.length - 1].y : base,
    };
  });
  return { categories, axis, lines };
}

/** Moves end labels apart so no two sit closer than `gap` plot percent, keeping them inside 0–100. */
export function spreadLabels(positions: readonly number[], gap: number): number[] {
  const order = positions.map((at, index) => ({ at, index })).sort((a, b) => a.at - b.at || a.index - b.index);
  for (let k = 1; k < order.length; k++) order[k].at = Math.max(order[k].at, order[k - 1].at + gap);
  const last = order.length - 1;
  if (last >= 0 && order[last].at > 100) {
    order[last].at = 100;
    for (let k = last - 1; k >= 0; k--) order[k].at = Math.min(order[k].at, order[k + 1].at - gap);
  }
  const out: number[] = [];
  for (const o of order) out[o.index] = pct(o.at);
  return out;
}

/** The index of the rectangle nearest the point (distance 0 inside it), or -1 when there are none. */
export function nearestRect(rects: readonly HitRect[], px: number, py: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  rects.forEach((r, i) => {
    const dx = Math.max(r.x - px, 0, px - (r.x + r.width));
    const dy = Math.max(r.y - py, 0, py - (r.y + r.height));
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

/** The point in the category nearest the pointer, then the series nearest it in that category. */
export function nearestPoint(points: readonly { x: number; y: number }[], px: number, py: number): number {
  let best = -1;
  points.forEach((p, i) => {
    if (best < 0) {
      best = i;
      return;
    }
    const b = points[best];
    const dx = Math.abs(p.x - px) - Math.abs(b.x - px);
    if (dx < 0 || (dx === 0 && Math.abs(p.y - py) < Math.abs(b.y - py))) best = i;
  });
  return best;
}

/**
 * Where the keyboard goes from a mark. Along the category axis: Left/Right on upward charts,
 * Up/Down on horizontal bars. Across series: the other pair. Home and End jump to the first and
 * last category. Moves stop at the edges. Null for keys the chart doesn't use.
 */
export function stepMark(
  marks: readonly { series: number; category: number }[],
  from: number,
  key: string,
  orientation: "vertical" | "horizontal",
): number | null {
  const mark = marks[from];
  if (!mark) return null;
  const lastCategory = Math.max(...marks.map((m) => m.category));
  const lastSeries = Math.max(...marks.map((m) => m.series));
  const find = (category: number, s: number) => {
    const i = marks.findIndex((m) => m.category === category && m.series === s);
    return i < 0 ? from : i;
  };
  if (key === "Home") return find(0, mark.series);
  if (key === "End") return find(lastCategory, mark.series);
  const moves: Record<string, readonly [number, number]> =
    orientation === "vertical"
      ? { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      : { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const move = moves[key];
  if (!move) return null;
  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));
  return find(clamp(mark.category + move[0], lastCategory), clamp(mark.series + move[1], lastSeries));
}

export interface SparklineLayout {
  path: string;
  area: string;
  last: { x: number; y: number } | null;
}

/** A sparkline fills its box: the lowest value at the foot, the highest at the top. */
export function sparklineLayout(values: readonly number[]): SparklineLayout {
  if (values.length === 0) return { path: "", area: "", last: null };
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const xs = scalePoint<number>()
    .domain(values.map((_, i) => i))
    .range([0, 100]);
  const ys = scaleLinear().domain([lo, hi]).range([100, 0]);
  const points = values.map((v, i) => ({ x: pct(xs(i) ?? 50), y: pct(ys(v)) }));
  return { path: pathOf(points), area: areaOf(points, 100), last: points[points.length - 1] };
}

/** The sentence a screen reader hears for a sparkline. */
export function sparklineSummary(label: string, values: readonly number[], format: (value: number) => string): string {
  if (values.length === 0) return `${label}: no data`;
  const first = format(values[0]);
  const last = format(values[values.length - 1]);
  return `${label}: from ${first} to ${last}, low ${format(Math.min(...values))}, high ${format(Math.max(...values))}`;
}

/** Plain numbers in the reader's locale, at most two decimals. */
export function numberFormatter(locale: string): (value: number) => string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (value) => nf.format(value);
}
```

- [ ] **Step 5: Run the tests.** Run `cd packages/react && npx vitest run test/chart-geometry.test.ts && npx tsc --noEmit`. Expected: all pass.

- [ ] **Step 6: Commit.**

```bash
git add packages/react/package.json packages/react/src/charts/geometry.ts packages/react/test/chart-geometry.test.ts pnpm-lock.yaml
git commit -m "feat(charts): geometry for bars, lines and sparklines"
```

---

### Task 3: Chart CSS

**Files:**
- Create: `packages/css/src/components/chart.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("charts", () => {
  it("assigns series colours by slot, and the muted colour to de-emphasised series", () => {
    for (let n = 1; n <= 6; n++) {
      expect(rule(`.sw-chart [data-series="${n}"]`)).toMatch(new RegExp(`--series:\\s*var\\(--chart-${n}\\)`));
    }
    expect(rule(".sw-chart [data-muted]")).toMatch(/--series:\s*var\(--chart-muted\)/);
  });

  it("lays the frame out as axis, plot and end labels, left to right, at the chart height", () => {
    const r = rule(".sw-chart-frame");
    expect(r).toMatch(/display:\s*grid/);
    expect(r).toMatch(/grid-template-rows:\s*var\(--chart-height,\s*16rem\) auto/);
    expect(r).toMatch(/direction:\s*ltr/);
  });

  it("positions ticks by percentage within their axis", () => {
    expect(rule('.sw-chart-axis[data-axis="y"] .sw-chart-tick')).toMatch(/inset-block-start:\s*var\(--at\)/);
    expect(rule('.sw-chart-axis[data-axis="x"] .sw-chart-tick')).toMatch(/inset-inline-start:\s*var\(--at\)/);
    expect(rule(".sw-chart-axis")).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("hides minor category labels when the chart is narrow", () => {
    expect(css).toMatch(/@container \(inline-size < 32rem\)\s*\{\s*\.sw-chart-tick\[data-minor\]\s*\{[^}]*visibility:\s*hidden/);
  });

  it("draws gridlines as hairlines and the zero line in the text colour", () => {
    expect(rule(".sw-chart-gridline")).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
    expect(rule(".sw-chart-gridline[data-zero]")).toMatch(/border-block-start-color:\s*var\(--text-primary\)/);
    expect(rule('.sw-chart[data-orientation="horizontal"] .sw-chart-gridline')).toMatch(
      /border-inline-start:\s*1px solid var\(--border\)/,
    );
  });

  it("stretches the marks over the plot", () => {
    const r = rule(".sw-chart-marks");
    expect(r).toMatch(/position:\s*absolute/);
    expect(r).toMatch(/overflow:\s*visible/);
  });

  it("separates bars with a 2px surface stroke that doesn't scale", () => {
    const r = rule(".sw-chart-bar");
    expect(r).toMatch(/fill:\s*var\(--series\)/);
    expect(r).toMatch(/stroke:\s*var\(--chart-surface,\s*var\(--surface-page\)\)/);
    expect(r).toMatch(/stroke-width:\s*2px/);
    expect(r).toMatch(/vector-effect:\s*non-scaling-stroke/);
  });

  it("draws lines 2px and areas at 12%", () => {
    const line = rule(".sw-chart-line");
    expect(line).toMatch(/stroke-width:\s*2px/);
    expect(line).toMatch(/fill:\s*none/);
    expect(line).toMatch(/vector-effect:\s*non-scaling-stroke/);
    expect(rule(".sw-chart-area")).toMatch(/fill-opacity:\s*\.?0?\.12/);
  });

  it("draws markers as 8px HTML squares", () => {
    const r = rule(".sw-chart-point");
    expect(r).toMatch(/inline-size:\s*\.5rem/);
    expect(r).toMatch(/background-color:\s*var\(--series\)/);
  });

  it("rings a focused mark's hit area", () => {
    expect(rule(".sw-chart-target:focus-visible")).toMatch(/outline:\s*var\(--focus-width\) solid var\(--accent\)/);
    expect(rule(".sw-chart-target[data-point]")).toMatch(/inline-size:\s*1\.5rem/);
  });

  it("raises the tooltip on a hairline-bordered surface, out of the pointer's way", () => {
    const r = rule(".sw-chart-tooltip");
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(r).toMatch(/pointer-events:\s*none/);
    expect(rule(".sw-chart-tooltip-row[data-current]")).toMatch(/font-weight:\s*500/);
  });

  it("toggles the data table with a plus and a minus", () => {
    expect(rule(".sw-chart-data > summary:before")).toMatch(/content:\s*"\+"/);
    expect(rule(".sw-chart-data[open] > summary:before")).toMatch(/content:\s*"−"/);
  });

  it("sizes a sparkline to sit in a line of text", () => {
    const r = rule(".sw-sparkline");
    expect(r).toMatch(/inline-size:\s*6rem/);
    expect(r).toMatch(/block-size:\s*1\.5rem/);
    expect(r).toMatch(/--series:\s*var\(--chart-1\)/);
  });

  it("keeps series colours in forced colours, with gaps in the system background", () => {
    expect(css).toMatch(/\.sw-chart-marks[^{]*\{[^}]*forced-color-adjust:\s*none/);
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-chart-bar\s*\{[^}]*stroke:\s*canvas/i,
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail.** Run `cd packages/css && npx vitest run test/components.test.ts -t charts`. Expected: FAIL with "No rule for .sw-chart [data-series="1"]".

- [ ] **Step 3: Write the stylesheet.** Create `packages/css/src/components/chart.css`:

```css
/*
 * Charts: BarChart, LineChart and Sparkline.
 * SVG draws the marks, stretched over the plot (viewBox 0 0 100 100, preserveAspectRatio none).
 * HTML draws every word, placed by percentages in custom properties (--at, --x, --y, --w, --h),
 * so a chart reflows to any width without script and its text never scales.
 * --chart-height sets the plot's height (16rem); --chart-surface is the colour behind the chart,
 * used for the gaps between bars (the page surface by default).
 */
.sw-chart {
  display: grid;
  gap: var(--space-3);
  min-inline-size: 0;
  margin: 0;
  container-type: inline-size;
}

/* Series colours, by slot (spec §16). They are never cycled: a chart holds at most six. */
.sw-chart [data-series="1"] { --series: var(--chart-1); }
.sw-chart [data-series="2"] { --series: var(--chart-2); }
.sw-chart [data-series="3"] { --series: var(--chart-3); }
.sw-chart [data-series="4"] { --series: var(--chart-4); }
.sw-chart [data-series="5"] { --series: var(--chart-5); }
.sw-chart [data-series="6"] { --series: var(--chart-6); }
.sw-chart [data-muted] { --series: var(--chart-muted); }

.sw-chart-caption {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

/* Legend: square swatches in the series colour; the words stay in the text colour. */
.sw-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text-secondary);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
}

.sw-chart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.sw-chart-swatch {
  flex: none;
  inline-size: 0.625rem;
  block-size: 0.625rem;
  background-color: var(--series);
}

/*
 * The frame: the y axis, the plot and the end labels on the first row; the x axis below the plot.
 * Charts lay out left to right in every writing direction, because their SVG never mirrors.
 */
.sw-chart-frame {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: var(--chart-height, 16rem) auto;
  column-gap: var(--space-3);
  row-gap: var(--space-2);
  direction: ltr;
}

/*
 * Axis labels share one grid cell, so the axis is as wide or tall as its longest label, and are
 * moved into place by relative offsets, which resolve against the cell (the plot's height or width).
 */
.sw-chart-axis {
  display: grid;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  line-height: var(--text-label-leading);
  font-variant-numeric: tabular-nums;
}

.sw-chart-axis[data-axis="y"] {
  grid-column: 1;
  grid-row: 1;
  justify-items: end;
}

.sw-chart-axis[data-axis="x"] {
  grid-column: 2;
  grid-row: 2;
}

.sw-chart-tick {
  grid-area: 1 / 1;
  position: relative;
  white-space: nowrap;
}

.sw-chart-axis[data-axis="y"] .sw-chart-tick {
  align-self: start;
  inset-block-start: var(--at);
  translate: 0 -50%;
}

.sw-chart-axis[data-axis="x"] .sw-chart-tick {
  justify-self: start;
  inset-inline-start: var(--at);
  translate: -50% 0;
}

@container (inline-size < 32rem) {
  .sw-chart-tick[data-minor] {
    visibility: hidden;
  }
}

.sw-chart-plot {
  position: relative;
  grid-column: 2;
  grid-row: 1;
}

.sw-chart-gridline {
  position: absolute;
  inset-inline: 0;
  inset-block-start: var(--at);
  border-block-start: 1px solid var(--border);
}

/* The zero line sits above the bars it starts. */
.sw-chart-gridline[data-zero] {
  z-index: 1;
  border-block-start-color: var(--text-primary);
}

.sw-chart[data-orientation="horizontal"] .sw-chart-gridline {
  inset-block: 0;
  inset-inline: auto;
  inset-inline-start: var(--at);
  border-block-start: 0;
  border-inline-start: 1px solid var(--border);
}

.sw-chart[data-orientation="horizontal"] .sw-chart-gridline[data-zero] {
  border-inline-start-color: var(--text-primary);
}

.sw-chart-marks {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
}

/* Flat bars with square ends, separated by a 2px gap in the surface colour. */
.sw-chart-bar {
  fill: var(--series);
  stroke: var(--chart-surface, var(--surface-page));
  stroke-width: 2px;
  vector-effect: non-scaling-stroke;
}

.sw-chart-line {
  fill: none;
  stroke: var(--series);
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.sw-chart-area {
  fill: var(--series);
  fill-opacity: 0.12;
}

/* Markers are HTML, so they stay square however the plot stretches. */
.sw-chart-point {
  position: absolute;
  inset-inline-start: var(--x);
  inset-block-start: var(--y);
  inline-size: 0.5rem;
  block-size: 0.5rem;
  translate: -50% -50%;
  background-color: var(--series);
  box-shadow: 0 0 0 2px var(--chart-surface, var(--surface-page));
}

.sw-chart-point[data-active] {
  inline-size: 0.75rem;
  block-size: 0.75rem;
}

.sw-chart-crosshair {
  position: absolute;
  inset-block: 0;
  inset-inline-start: var(--x);
  border-inline-start: 1px solid var(--border-strong);
  pointer-events: none;
}

/* End labels for lines with two to four series, with a short stroke of the series colour. */
.sw-chart-ends {
  display: grid;
  grid-column: 3;
  grid-row: 1;
  color: var(--text-secondary);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
}

.sw-chart-end {
  display: inline-flex;
  grid-area: 1 / 1;
  position: relative;
  align-self: start;
  align-items: center;
  gap: var(--space-2);
  inset-block-start: var(--at);
  translate: 0 -50%;
  white-space: nowrap;
}

.sw-chart-end::before {
  content: "";
  inline-size: 0.75rem;
  border-block-start: 2px solid var(--series);
}

/* The focus layer (React): one hit area per mark; the plot itself takes pointer events. */
.sw-chart-targets {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sw-chart-target {
  position: absolute;
  inset-inline-start: var(--x);
  inset-block-start: var(--y);
  inline-size: var(--w);
  block-size: var(--h);
  outline: none;
}

.sw-chart-target[data-point] {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  translate: -50% -50%;
}

.sw-chart-target:focus-visible {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-chart-tooltip {
  position: absolute;
  z-index: 2;
  inset-inline-start: var(--x);
  inset-block-start: var(--y);
  translate: -50% calc(-100% - var(--space-2));
  display: grid;
  gap: var(--space-1);
  min-inline-size: 8rem;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
  color: var(--text-primary);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
  white-space: nowrap;
  pointer-events: none;
}

.sw-chart-tooltip[data-align="start"] {
  translate: 0 calc(-100% - var(--space-2));
}

.sw-chart-tooltip[data-align="end"] {
  translate: -100% calc(-100% - var(--space-2));
}

@media (prefers-reduced-motion: no-preference) {
  .sw-chart-tooltip {
    animation: sw-chart-fade var(--dur-fast) var(--ease-standard);
  }
}

@keyframes sw-chart-fade {
  from {
    opacity: 0;
  }
}

.sw-chart-tooltip-title {
  margin: 0;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  text-transform: uppercase;
}

.sw-chart-tooltip-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
}

.sw-chart-tooltip-row[data-current] {
  font-weight: 500;
}

.sw-chart-tooltip-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: end;
}

/* The data table, behind "Show data". */
.sw-chart-data > summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  inline-size: fit-content;
  min-block-size: var(--target-min);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  text-transform: uppercase;
  list-style: none;
  cursor: pointer;
}

.sw-chart-data > summary::-webkit-details-marker {
  display: none;
}

.sw-chart-data > summary::before {
  content: "+";
}

.sw-chart-data[open] > summary::before {
  content: "−";
}

.sw-chart-data > summary:focus-visible {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

/* Sparkline: a trend in a line of text, a 2px line with a square on its last point. */
.sw-sparkline {
  --series: var(--chart-1);
  position: relative;
  display: inline-block;
  inline-size: 6rem;
  block-size: 1.5rem;
  vertical-align: middle;
  direction: ltr;
}

.sw-sparkline svg {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
}

.sw-sparkline-line {
  fill: none;
  stroke: var(--series);
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.sw-sparkline-area {
  fill: var(--series);
  fill-opacity: 0.12;
}

.sw-sparkline-point {
  position: absolute;
  inset-inline-start: var(--x);
  inset-block-start: var(--y);
  inline-size: 0.5rem;
  block-size: 0.5rem;
  translate: -50% -50%;
  background-color: var(--series);
}

/*
 * Forced colours forces SVG fill and stroke and drops backgrounds, which would erase which series
 * is which. Marks, swatches, markers and sparklines keep their colours; text, gridlines and the
 * tooltip follow the system colours. The data table carries the values either way.
 */
.sw-chart-marks,
.sw-chart-swatch,
.sw-chart-point,
.sw-chart-end::before,
.sw-sparkline {
  forced-color-adjust: none;
}

@media (forced-colors: active) {
  .sw-chart-bar {
    stroke: Canvas;
  }

  .sw-chart-point {
    box-shadow: 0 0 0 2px Canvas;
  }
}
```

Add after the `data-grid.css` import in `packages/css/src/index.css`:

```css
@import "./components/chart.css" layer(raster.components);
```

- [ ] **Step 4: Run the tests and lint.** Run `cd packages/css && npx vitest run && npx stylelint "src/**/*.css"`. Expected: all pass.
  - If the single-line series rules are printed differently, the `rule()` helper still finds them by selector.
  - If the `::-webkit-details-marker` rule fails to build, delete it and use `summary { display: flex }` alone. A flex summary already hides the marker in Chromium and Firefox. Note why.

- [ ] **Step 5: Commit.**

```bash
git add packages/css
git commit -m "feat(css): chart contract: frame, axes, marks, focus layer, tooltip, data table and sparkline"
```

---

### Task 4: The chart frame and BarChart

**Files:**
- Create: `packages/react/src/charts/ChartFrame.tsx`, `packages/react/src/charts/BarChart.tsx`, `packages/react/test/charts.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing tests.** Create `packages/react/test/charts.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { BarChart, type BarChartProps } from "../src";
import { expectAccessible } from "./axe";

beforeAll(() => {
  // jsdom has no PointerEvent; without one, fireEvent drops clientX and clientY.
  if (!("PointerEvent" in window)) Object.assign(window, { PointerEvent: MouseEvent });
});

const DATA = [
  { year: "2023", built: 4, planned: 2 },
  { year: "2024", built: 6, planned: 3 },
];
const SERIES = [
  { key: "built", label: "Built" },
  { key: "planned", label: "Planned" },
];

function bar(props: Partial<BarChartProps> = {}) {
  return render(
    <BarChart caption="Projects by year" data={DATA} x="year" xLabel="Year" series={SERIES} {...props} />,
  );
}

const ticks = (container: HTMLElement, axis: "x" | "y") =>
  [...container.querySelectorAll(`.sw-chart-axis[data-axis="${axis}"] .sw-chart-tick`)].map((t) => t.textContent);

describe("BarChart", () => {
  it("draws a captioned figure with a legend and one bar per value", () => {
    const { container } = bar();
    const figure = container.querySelector("figure.sw-chart") as HTMLElement;
    expect(figure).toHaveAttribute("data-chart", "bar");
    expect(figure).toHaveAttribute("data-orientation", "vertical");
    expect(figure.querySelector("figcaption.sw-chart-caption")).toHaveTextContent("Projects by year");
    const legend = [...figure.querySelectorAll(".sw-chart-legend-item")];
    expect(legend.map((li) => [li.textContent, li.getAttribute("data-series")])).toEqual([
      ["Built", "1"],
      ["Planned", "2"],
    ]);
    const bars = figure.querySelectorAll("rect.sw-chart-bar");
    expect(bars).toHaveLength(4);
    expect(bars[0]).toHaveAttribute("data-series", "1");
    expect([...bars].map((b) => b.getAttribute("height"))).toEqual(["66.6667", "33.3333", "100", "50"]);
    expect(figure.querySelector("svg.sw-chart-marks")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no legend for one series", () => {
    const { container } = bar({ series: [SERIES[0]] });
    expect(container.querySelector(".sw-chart-legend")).toBeNull();
  });

  it("labels values up the y axis and categories along the x axis, with a zero line", () => {
    const { container } = bar();
    expect(ticks(container, "y")).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    expect(ticks(container, "x")).toEqual(["2023", "2024"]);
    expect(container.querySelectorAll(".sw-chart-gridline")).toHaveLength(7);
    expect(container.querySelectorAll(".sw-chart-gridline[data-zero]")).toHaveLength(1);
  });

  it("swaps the axes for horizontal bars", () => {
    const { container } = bar({ orientation: "horizontal" });
    expect(ticks(container, "y")).toEqual(["2023", "2024"]);
    expect(ticks(container, "x")[0]).toBe("0");
  });

  it("puts the values in a table behind Show data", () => {
    const { container } = bar();
    const details = container.querySelector("details.sw-chart-data") as HTMLElement;
    expect(within(details).getByText("Show data").tagName).toBe("SUMMARY");
    const table = within(details).getByRole("table", { hidden: true });
    expect(within(table).getAllByRole("columnheader", { hidden: true }).map((th) => th.textContent)).toEqual([
      "Year",
      "Built",
      "Planned",
    ]);
    const row = within(table).getByRole("rowheader", { name: "2024", hidden: true }).closest("tr") as HTMLElement;
    expect([...row.querySelectorAll("td")].map((td) => td.textContent)).toEqual(["6", "3"]);
  });

  it("names every mark and is one tab stop", () => {
    bar();
    const group = screen.getByRole("group", { name: "Projects by year" });
    const marks = within(group).getAllByRole("img");
    expect(marks.map((m) => m.getAttribute("aria-label"))).toEqual([
      "Built, 2023: 4",
      "Planned, 2023: 2",
      "Built, 2024: 6",
      "Planned, 2024: 3",
    ]);
    expect(marks.map((m) => m.getAttribute("tabindex"))).toEqual(["0", "-1", "-1", "-1"]);
  });

  it("moves between categories with Left and Right, series with Up and Down, ends with Home and End", async () => {
    const user = userEvent.setup();
    bar();
    await user.tab();
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2023: 4");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
    await user.keyboard("{Home}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2023: 2");
    expect(document.activeElement).toHaveAttribute("tabindex", "0");
    await user.keyboard("{End}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
  });

  it("moves along categories with Up and Down on horizontal bars", async () => {
    const user = userEvent.setup();
    bar({ orientation: "horizontal" });
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Built, 2024: 6");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Planned, 2024: 3");
  });

  it("shows a tooltip for the focused mark, hidden from assistive technology", async () => {
    const user = userEvent.setup();
    const { container } = bar();
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
    await user.tab();
    const tooltip = container.querySelector(".sw-chart-tooltip") as HTMLElement;
    expect(tooltip).toHaveAttribute("aria-hidden", "true");
    expect(tooltip.querySelector(".sw-chart-tooltip-title")).toHaveTextContent("2023");
    const rows = [...tooltip.querySelectorAll(".sw-chart-tooltip-row")];
    expect(rows.map((r) => r.textContent)).toEqual(["Built4", "Planned2"]);
    expect(rows[0]).toHaveAttribute("data-current");
    expect(rows[1]).not.toHaveAttribute("data-current");
    await user.tab();
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
  });

  it("shows the tooltip for the bar nearest the pointer, and hides it when the pointer leaves", () => {
    const { container } = bar();
    const plot = container.querySelector(".sw-chart-plot") as HTMLElement;
    vi.spyOn(plot, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
    });
    // (60, 90) is 30% across and 90% down: inside Planned 2023 (x 25–45, y 66.7–100).
    fireEvent.pointerMove(plot, { clientX: 60, clientY: 90 });
    const tooltip = container.querySelector(".sw-chart-tooltip") as HTMLElement;
    expect(tooltip.querySelector(".sw-chart-tooltip-row[data-current]")).toHaveTextContent("Planned2");
    fireEvent.pointerLeave(plot);
    expect(container.querySelector(".sw-chart-tooltip")).toBeNull();
  });

  it("draws without the focus layer when not interactive", () => {
    const { container } = bar({ interactive: false });
    expect(container.querySelector(".sw-chart-targets")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.querySelector("figcaption")).not.toHaveAttribute("id");
  });

  it("mutes every series but the highlighted one", () => {
    const { container } = bar({ highlight: "built" });
    const bars = [...container.querySelectorAll("rect.sw-chart-bar")];
    expect(bars.map((b) => b.hasAttribute("data-muted"))).toEqual([false, true, false, true]);
  });

  it("formats ticks, names and the table with the given format", () => {
    const { container } = bar({ format: (v) => `${v} p.` });
    expect(ticks(container, "y").at(-1)).toBe("6 p.");
    expect(screen.getByRole("img", { name: "Built, 2023: 4 p." })).toBeInTheDocument();
    expect(container.querySelector("tbody td")).toHaveTextContent("4 p.");
  });

  it("refuses a seventh series", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const seven = Array.from({ length: 7 }, (_, i) => ({ key: "built", label: `S${i}` }));
    expect(() => bar({ series: seven })).toThrow(/at most 6 series/);
  });

  it("forwards ref, merges className and passes other props to the figure", () => {
    const ref = createRef<HTMLElement>();
    const { container } = bar({ ref, className: "extra", id: "projects" });
    expect(ref.current).toBe(container.querySelector("figure"));
    expect(ref.current).toHaveClass("sw-chart", "extra");
    expect(ref.current).toHaveAttribute("id", "projects");
  });

  it("passes the structural accessibility check", async () => {
    const { container } = bar();
    await expectAccessible(container);
  });
});
```

- [ ] **Step 2: Run them to see them fail.** Run `cd packages/react && npx vitest run test/charts.test.tsx`. Expected: FAIL, because `BarChart` is not exported.

- [ ] **Step 3: Write the frame.** Create `packages/react/src/charts/ChartFrame.tsx`:

```tsx
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale } from "react-aria-components";
import { cx } from "../utils/cx";
import { type ChartDatum, type ChartSeries, type HitRect, numberFormatter, pct, stepMark, valueOf } from "./geometry";

export type Orientation = "vertical" | "horizontal";

/** One drawn value: its hit area in plot percentages, and which series and category it is. */
export interface Mark extends HitRect {
  series: number;
  category: number;
  value: number;
}

export interface AxisLabel {
  at: number;
  label: string;
  minor?: boolean;
}

/** Props every chart shares. */
export type ChartProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  /** Names the chart: shown above it, and names its marks' group. */
  caption: ReactNode;
  data: readonly ChartDatum[];
  /** The key in each datum that holds its category, such as "year". */
  x: string;
  /** Heads the category column of the data table, such as "Year". */
  xLabel: string;
  /** Up to six, in the order their colours are assigned. */
  series: readonly ChartSeries[];
  /** A series key: that series keeps its colour and the rest turn muted. */
  highlight?: string;
  /** Formats values in ticks, names, the tooltip and the table. Defaults to the locale's numbers. */
  format?: (value: number) => string;
  /** Draws the focus layer: one tab stop, arrow keys, named marks and a tooltip. Default true. */
  interactive?: boolean;
};

export const at = (value: number): CSSProperties => ({ "--at": `${value}%` }) as CSSProperties;

export const place = (r: HitRect): CSSProperties =>
  ({ "--x": `${r.x}%`, "--y": `${r.y}%`, "--w": `${r.width}%`, "--h": `${r.height}%` }) as CSSProperties;

/** data-series (1-based) and data-muted for a series' elements. */
export function seriesAttributes(series: readonly ChartSeries[], index: number, highlight?: string) {
  const muted = highlight !== undefined && series[index].key !== highlight;
  return { "data-series": index + 1, "data-muted": muted ? "" : undefined };
}

export function useChartFormat(format?: (value: number) => string): (value: number) => string {
  const { locale } = useLocale();
  return useMemo(() => format ?? numberFormatter(locale), [format, locale]);
}

type FrameProps = Omit<ChartProps, "format" | "interactive"> & {
  kind: "bar" | "line";
  orientation: Orientation;
  format: (value: number) => string;
  interactive: boolean;
  /** Labels down the start edge, placed from the top. */
  yLabels: AxisLabel[];
  /** Labels along the foot, placed from the inline start. */
  xLabels: AxisLabel[];
  gridlines: { at: number; zero: boolean }[];
  endLabels?: { at: number; series: number }[];
  marks: Mark[];
  /** True for line points: hit areas are 24px squares centred on them. */
  points: boolean;
  /** The SVG marks. */
  svg: ReactNode;
  /** HTML over the SVG, given the active mark (always null when not interactive). */
  overlay?: (active: Mark | null) => ReactNode;
  /** The mark nearest a pointer at plot percentages, or -1. */
  pick: (x: number, y: number) => number;
};

/** The figure every chart shares: caption, legend, axes, gridlines, marks, focus layer and data table. */
export function ChartFrame({
  kind,
  orientation,
  caption,
  data,
  x,
  xLabel,
  series,
  highlight,
  format,
  interactive,
  yLabels,
  xLabels,
  gridlines,
  endLabels,
  marks,
  points,
  svg,
  overlay,
  pick,
  className,
  ...rest
}: FrameProps) {
  const captionId = useId();
  const [focusIndex, setFocusIndex] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const targets = useRef<(HTMLSpanElement | null)[]>([]);
  const current = Math.min(focusIndex, Math.max(0, marks.length - 1));
  const activeMark = interactive && active !== null ? (marks[active] ?? null) : null;
  const name = (m: Mark) => `${series[m.series].label}, ${String(data[m.category][x])}: ${format(m.value)}`;

  function onKeyDown(event: KeyboardEvent) {
    const next = stepMark(marks, current, event.key, orientation);
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    setActive(next);
    targets.current[next]?.focus();
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const i = pick(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
    setActive(i < 0 ? null : i);
  }

  function onPointerLeave() {
    const focused = targets.current.some((t) => t !== null && t === document.activeElement);
    setActive(focused ? current : null);
  }

  function onBlur(event: FocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Element && targets.current.includes(next as HTMLSpanElement))) setActive(null);
  }

  return (
    <figure className={cx("sw-chart", className)} data-chart={kind} data-orientation={orientation} {...rest}>
      <figcaption className="sw-chart-caption" id={interactive ? captionId : undefined}>
        {caption}
      </figcaption>
      {series.length > 1 && (
        <ul className="sw-chart-legend">
          {series.map((s, i) => (
            <li key={s.key} className="sw-chart-legend-item" {...seriesAttributes(series, i, highlight)}>
              <span className="sw-chart-swatch" aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className="sw-chart-frame">
        <div className="sw-chart-axis" data-axis="y" aria-hidden="true">
          {yLabels.map((l) => (
            <span key={`${l.at}-${l.label}`} className="sw-chart-tick" data-minor={l.minor ? "" : undefined} style={at(l.at)}>
              {l.label}
            </span>
          ))}
        </div>
        <div
          className="sw-chart-plot"
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerLeave={interactive ? onPointerLeave : undefined}
        >
          {gridlines.map((g) => (
            <div key={g.at} className="sw-chart-gridline" data-zero={g.zero ? "" : undefined} style={at(g.at)} />
          ))}
          <svg className="sw-chart-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {svg}
          </svg>
          {overlay?.(activeMark)}
          {interactive && (
            <div className="sw-chart-targets" role="group" aria-labelledby={captionId} onKeyDown={onKeyDown}>
              {marks.map((m, i) => (
                <span
                  key={`${m.series}-${m.category}`}
                  ref={(el) => {
                    targets.current[i] = el;
                  }}
                  className="sw-chart-target"
                  role="img"
                  aria-label={name(m)}
                  tabIndex={i === current ? 0 : -1}
                  data-point={points ? "" : undefined}
                  data-active={i === active ? "" : undefined}
                  style={place(m)}
                  onFocus={() => {
                    setFocusIndex(i);
                    setActive(i);
                  }}
                  onBlur={onBlur}
                />
              ))}
            </div>
          )}
          {activeMark && (
            <ChartTooltip
              mark={activeMark}
              orientation={orientation}
              data={data}
              x={x}
              series={series}
              highlight={highlight}
              format={format}
            />
          )}
        </div>
        {endLabels && endLabels.length > 0 && (
          <div className="sw-chart-ends" aria-hidden="true">
            {endLabels.map((e) => (
              <span key={e.series} className="sw-chart-end" {...seriesAttributes(series, e.series, highlight)} style={at(e.at)}>
                {series[e.series].label}
              </span>
            ))}
          </div>
        )}
        <div className="sw-chart-axis" data-axis="x" aria-hidden="true">
          {xLabels.map((l) => (
            <span key={`${l.at}-${l.label}`} className="sw-chart-tick" data-minor={l.minor ? "" : undefined} style={at(l.at)}>
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <ChartTable data={data} x={x} xLabel={xLabel} series={series} format={format} />
    </figure>
  );
}

function ChartTooltip({
  mark,
  orientation,
  data,
  x,
  series,
  highlight,
  format,
}: {
  mark: Mark;
  orientation: Orientation;
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  highlight?: string;
  format: (value: number) => string;
}) {
  // Above the bar's top or the point; for horizontal bars, above the bar's end.
  const tipX = orientation === "horizontal" ? mark.x + mark.width : mark.x + mark.width / 2;
  const align = tipX < 25 ? "start" : tipX > 75 ? "end" : "center";
  const datum = data[mark.category];
  return (
    <div
      className="sw-chart-tooltip"
      aria-hidden="true"
      data-align={align}
      style={{ "--x": `${pct(tipX)}%`, "--y": `${mark.y}%` } as CSSProperties}
    >
      <p className="sw-chart-tooltip-title">{String(datum[x])}</p>
      {series.map((s, i) => (
        <div
          key={s.key}
          className="sw-chart-tooltip-row"
          {...seriesAttributes(series, i, highlight)}
          data-current={i === mark.series ? "" : undefined}
        >
          <span className="sw-chart-swatch" />
          <span>{s.label}</span>
          <span className="sw-chart-tooltip-value">{format(valueOf(datum, s.key))}</span>
        </div>
      ))}
    </div>
  );
}

function ChartTable({
  data,
  x,
  xLabel,
  series,
  format,
}: {
  data: readonly ChartDatum[];
  x: string;
  xLabel: string;
  series: readonly ChartSeries[];
  format: (value: number) => string;
}) {
  return (
    <details className="sw-chart-data">
      <summary>Show data</summary>
      <div className="sw-table-wrap">
        <table className="sw-table">
          <thead>
            <tr>
              <th scope="col">{xLabel}</th>
              {series.map((s) => (
                <th key={s.key} scope="col" data-numeric="">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((datum, i) => (
              <tr key={`${i}-${String(datum[x])}`}>
                <th scope="row">{String(datum[x])}</th>
                {series.map((s) => (
                  <td key={s.key} data-numeric="">
                    {format(valueOf(datum, s.key))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Write BarChart.** Create `packages/react/src/charts/BarChart.tsx`:

```tsx
import { ChartFrame, type ChartProps, seriesAttributes, useChartFormat } from "./ChartFrame";
import { barLayout, nearestRect } from "./geometry";

export type BarChartProps = ChartProps & {
  /** Vertical bars rise from the x axis; horizontal bars run from the y axis. Default vertical. */
  orientation?: "vertical" | "horizontal";
  /** Stacks series in one bar per category instead of setting them side by side. */
  stacked?: boolean;
};

/** Bars from zero, grouped or stacked, vertical or horizontal. */
export function BarChart({
  data,
  x,
  series,
  orientation = "vertical",
  stacked = false,
  highlight,
  format,
  interactive = true,
  ...rest
}: BarChartProps) {
  const fmt = useChartFormat(format);
  const layout = barLayout({ data, x, series, orientation, stacked });
  const vertical = orientation === "vertical";
  const values = layout.axis.ticks.map((t) => ({ at: t.at, label: fmt(t.value) }));
  const categories = layout.categories.map((c) => ({ at: c.at, label: c.label, minor: c.minor }));
  return (
    <ChartFrame
      {...rest}
      kind="bar"
      orientation={orientation}
      data={data}
      x={x}
      series={series}
      highlight={highlight}
      format={fmt}
      interactive={interactive}
      yLabels={vertical ? values : categories}
      xLabels={vertical ? categories : values}
      gridlines={layout.axis.ticks.map((t) => ({ at: t.at, zero: t.value === 0 }))}
      marks={layout.bars}
      points={false}
      pick={(px, py) => nearestRect(layout.bars, px, py)}
      svg={layout.bars.map((b) => (
        <rect
          key={`${b.series}-${b.category}`}
          className="sw-chart-bar"
          {...seriesAttributes(series, b.series, highlight)}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
        />
      ))}
    />
  );
}
```

- [ ] **Step 5: Export it.** Add to `packages/react/src/index.ts`, after the DataGrid export:

```ts
export { BarChart, type BarChartProps } from "./charts/BarChart";
export type { ChartProps } from "./charts/ChartFrame";
export {
  barLayout,
  type ChartDatum,
  type ChartSeries,
  lineLayout,
  MAX_SERIES,
  numberFormatter,
  sparklineLayout,
  sparklineSummary,
  valueAxis,
} from "./charts/geometry";
```

Add to `expected` in `packages/react/test/exports.test.ts`, after the DataGrid line:

```ts
      "BarChart", "barLayout", "lineLayout", "numberFormatter", "sparklineLayout", "sparklineSummary", "valueAxis",
```

- [ ] **Step 6: Run the tests.** Run `cd packages/react && npx vitest run test/charts.test.tsx test/exports.test.ts && npx tsc --noEmit`. Expected: all pass.
  - **Data-table queries:** they pass `{ hidden: true }` because a closed `<details>` hides its content from the accessibility tree in jsdom. If jsdom exposes it anyway, the option is harmless.
  - **If `expectAccessible` reports `aria-allowed-role` for `role="img"` with `tabindex`:** read the rule's message. If axe wants a widget role, use `role="graphics-symbol"`, which axe accepts as an image role, and update the tests' `getAllByRole("img")` calls to match. Do not drop the role.

- [ ] **Step 7: Commit.**

```bash
git add packages/react
git commit -m "feat(charts): BarChart, with one tab stop, named marks, a tooltip and a data table"
```

---

### Task 5: LineChart and Sparkline

**Files:**
- Create: `packages/react/src/charts/LineChart.tsx`, `packages/react/src/charts/Sparkline.tsx`
- Modify: `packages/react/test/charts.test.tsx`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing tests.** In `packages/react/test/charts.test.tsx`, change the import to `import { BarChart, type BarChartProps, LineChart, type LineChartProps, Sparkline } from "../src";`. Then append:

```tsx
const MONTHS = [
  { m: "Jan", a: 10, b: 30 },
  { m: "Feb", a: 20, b: 25 },
  { m: "Mar", a: 15, b: 40 },
];
const AB = [
  { key: "a", label: "Zürich" },
  { key: "b", label: "Basel" },
];

function line(props: Partial<LineChartProps> = {}) {
  return render(<LineChart caption="Visitors" data={MONTHS} x="m" xLabel="Month" series={AB} {...props} />);
}

describe("LineChart", () => {
  it("draws a 2px path per series, a marker per value, and no area unless asked", () => {
    const { container } = line();
    expect(container.querySelector("figure")).toHaveAttribute("data-chart", "line");
    const paths = container.querySelectorAll("path.sw-chart-line");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("d", "M0,100L50,66.6667L100,83.3333");
    expect(paths[0].closest("g")).toHaveAttribute("data-series", "1");
    expect(container.querySelectorAll(".sw-chart-point")).toHaveLength(6);
    expect(container.querySelector("path.sw-chart-area")).toBeNull();
    const { container: filled } = line({ area: true });
    expect(filled.querySelectorAll("path.sw-chart-area")).toHaveLength(2);
  });

  it("labels the ends of two to four lines, and not one or five", () => {
    const { container } = line();
    expect([...container.querySelectorAll(".sw-chart-end")].map((e) => e.textContent)).toEqual(["Zürich", "Basel"]);
    const { container: one } = line({ series: [AB[0]] });
    expect(one.querySelector(".sw-chart-ends")).toBeNull();
    const keys = ["a", "b", "c", "d", "e"];
    const wide = MONTHS.map((d) => ({ ...d, c: 1, d: 2, e: 3 }));
    const { container: many } = line({ data: wide, series: keys.map((key) => ({ key, label: key })) });
    expect(many.querySelector(".sw-chart-ends")).toBeNull();
  });

  it("takes an exact domain", () => {
    const { container } = line({ domain: [0, 50] });
    expect(ticks(container, "y")).toEqual(["0", "10", "20", "30", "40", "50"]);
  });

  it("names points and moves between them; the focused point grows and a crosshair marks it", async () => {
    const user = userEvent.setup();
    const { container } = line();
    await user.tab();
    expect(document.activeElement).toHaveAttribute("aria-label", "Zürich, Jan: 10");
    expect(document.activeElement).toHaveAttribute("data-point");
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toHaveAttribute("aria-label", "Basel, Feb: 25");
    expect(container.querySelectorAll(".sw-chart-point[data-active]")).toHaveLength(1);
    expect(container.querySelector(".sw-chart-crosshair")).toHaveStyle({ "--x": "50%" });
  });

  it("draws the highlighted series last, on top", () => {
    const { container } = line({ highlight: "a" });
    const groups = [...container.querySelectorAll("svg g")];
    expect(groups.map((g) => g.getAttribute("data-series"))).toEqual(["2", "1"]);
    expect(groups[0]).toHaveAttribute("data-muted");
  });

  it("forwards ref and merges className", () => {
    const ref = createRef<HTMLElement>();
    line({ ref, className: "extra" });
    expect(ref.current).toHaveClass("sw-chart", "extra");
  });
});

describe("Sparkline", () => {
  it("is one image named with a summary of the trend", () => {
    render(<Sparkline data={[4.1, 3.8, 5, 6.3]} label="Revenue, 12 months" />);
    const spark = screen.getByRole("img", { name: "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3" });
    expect(spark).toHaveClass("sw-sparkline");
    expect(spark.querySelector("path.sw-sparkline-line")).toHaveAttribute("d", "M0,88L33.3333,100L66.6667,52L100,0");
    expect(spark.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(spark.querySelector(".sw-sparkline-point")).toHaveStyle({ "--x": "100%", "--y": "0%" });
    expect(spark.querySelector(".sw-sparkline-area")).toBeNull();
  });

  it("fills the area when asked, and says when there is no data", () => {
    const { container } = render(<Sparkline data={[1, 2]} label="Visits" area />);
    expect(container.querySelector(".sw-sparkline-area")).not.toBeNull();
    render(<Sparkline data={[]} label="Revenue" />);
    expect(screen.getByRole("img", { name: "Revenue: no data" }).querySelector(".sw-sparkline-point")).toBeNull();
  });

  it("formats the summary, forwards ref and merges className", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Sparkline ref={ref} className="extra" data={[1, 2]} label="Cost" format={(v) => `CHF ${v}`} />);
    expect(ref.current).toHaveClass("sw-sparkline", "extra");
    expect(ref.current).toHaveAttribute("aria-label", "Cost: from CHF 1 to CHF 2, low CHF 1, high CHF 2");
  });
});
```

- [ ] **Step 2: Run them to see them fail.** Run `cd packages/react && npx vitest run test/charts.test.tsx`. Expected: FAIL, because `LineChart` is not exported.

- [ ] **Step 3: Write LineChart.** Create `packages/react/src/charts/LineChart.tsx`:

```tsx
import type { CSSProperties } from "react";
import { ChartFrame, type ChartProps, type Mark, seriesAttributes, useChartFormat } from "./ChartFrame";
import { lineLayout, nearestPoint, spreadLabels } from "./geometry";

/** End labels sit at least this far apart, in plot percent (about a label's height at 16rem). */
const END_LABEL_GAP = 8;

export type LineChartProps = ChartProps & {
  /** Fills under each line in its colour at 12%. */
  area?: boolean;
  /** An exact value range, such as [0, 100]. By default the data's range on nice numbers. */
  domain?: readonly [number, number];
};

/** Lines over categories, such as months, with markers, end labels for two to four series, and an optional area. */
export function LineChart({
  data,
  x,
  series,
  area = false,
  domain,
  highlight,
  format,
  interactive = true,
  ...rest
}: LineChartProps) {
  const fmt = useChartFormat(format);
  const layout = lineLayout({ data, x, series, domain, area });
  const marks: Mark[] = layout.lines.flatMap((l) => l.points.map((p) => ({ ...p, width: 0, height: 0 })));
  const labelled = series.length >= 2 && series.length <= 4;
  const ends = labelled
    ? spreadLabels(
        layout.lines.map((l) => l.end),
        END_LABEL_GAP,
      ).map((at, s) => ({ at, series: s }))
    : [];
  // The highlighted series is drawn last, so muted lines pass beneath it.
  const isHighlight = (s: number) => Number(series[s].key === highlight);
  const drawn = [...layout.lines].sort((a, b) => isHighlight(a.series) - isHighlight(b.series));
  return (
    <ChartFrame
      {...rest}
      kind="line"
      orientation="vertical"
      data={data}
      x={x}
      series={series}
      highlight={highlight}
      format={fmt}
      interactive={interactive}
      yLabels={layout.axis.ticks.map((t) => ({ at: t.at, label: fmt(t.value) }))}
      xLabels={layout.categories.map((c) => ({ at: c.at, label: c.label, minor: c.minor }))}
      gridlines={layout.axis.ticks.map((t) => ({ at: t.at, zero: t.value === 0 }))}
      endLabels={ends}
      marks={marks}
      points
      pick={(px, py) => nearestPoint(marks, px, py)}
      svg={drawn.map((l) => (
        <g key={l.series} {...seriesAttributes(series, l.series, highlight)}>
          {l.area && <path className="sw-chart-area" d={l.area} />}
          <path className="sw-chart-line" d={l.path} />
        </g>
      ))}
      overlay={(active) => (
        <>
          {active && <div className="sw-chart-crosshair" style={{ "--x": `${active.x}%` } as CSSProperties} />}
          {drawn.flatMap((l) =>
            l.points.map((p) => (
              <span
                key={`${p.series}-${p.category}`}
                className="sw-chart-point"
                {...seriesAttributes(series, p.series, highlight)}
                data-active={active?.series === p.series && active.category === p.category ? "" : undefined}
                style={{ "--x": `${p.x}%`, "--y": `${p.y}%` } as CSSProperties}
              />
            )),
          )}
        </>
      )}
    />
  );
}
```

`marks` stays in layout order (series-major), so `stepMark` and the names match the bar chart's behaviour. Only the drawing order follows `drawn`.

- [ ] **Step 4: Write Sparkline.** Create `packages/react/src/charts/Sparkline.tsx`:

```tsx
import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cx } from "../utils/cx";
import { useChartFormat } from "./ChartFrame";
import { sparklineLayout, sparklineSummary } from "./geometry";

export type SparklineProps = Omit<ComponentPropsWithRef<"span">, "children" | "aria-label"> & {
  data: readonly number[];
  /** What the values are, such as "Revenue, 12 months". The image is named with this and a summary. */
  label: string;
  /** Fills under the line at 12%. */
  area?: boolean;
  /** Formats the values in the summary. Defaults to the locale's numbers. */
  format?: (value: number) => string;
};

/** A small trend that sits in a line of text, a Stat or a table cell. One image, named with a summary. */
export function Sparkline({ data, label, area = false, format, className, ...rest }: SparklineProps) {
  const fmt = useChartFormat(format);
  const layout = sparklineLayout(data);
  return (
    <span className={cx("sw-sparkline", className)} role="img" aria-label={sparklineSummary(label, data, fmt)} {...rest}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {area && <path className="sw-sparkline-area" d={layout.area} />}
        <path className="sw-sparkline-line" d={layout.path} />
      </svg>
      {layout.last && (
        <span
          className="sw-sparkline-point"
          style={{ "--x": `${layout.last.x}%`, "--y": `${layout.last.y}%` } as CSSProperties}
        />
      )}
    </span>
  );
}
```

- [ ] **Step 5: Export them.** Add to `packages/react/src/index.ts`, after the BarChart export:

```ts
export { LineChart, type LineChartProps } from "./charts/LineChart";
export { Sparkline, type SparklineProps } from "./charts/Sparkline";
```

Add `"LineChart", "Sparkline",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 6: Run all React tests.** Run `cd packages/react && npx vitest run && npx tsc --noEmit`. Expected: all pass. The `toHaveStyle` checks on custom properties work in jsdom because React writes them through `style.setProperty`. If one fails, compare `getAttribute("style")` against the expected text instead.

- [ ] **Step 7: Commit.**

```bash
git add packages/react
git commit -m "feat(charts): LineChart with markers, end labels and areas; Sparkline"
```

---

### Task 6: The docs pages

**Files:**
- Create:
  - `apps/docs/src/demos/bar-chart/ProjectsByYear.tsx`, `BudgetByDiscipline.tsx`, `HoursByPhase.tsx`, `projects-by-year.html`
  - `apps/docs/src/demos/line-chart/Visitors.tsx`, `EnergyUse.tsx`, `Highlighted.tsx`, `visitors.html`
  - `apps/docs/src/demos/sparkline/InAStat.tsx`, `InATable.tsx`, `revenue.html`
  - `apps/docs/src/content/components/bar-chart.mdx`, `line-chart.mdx`, `sparkline.mdx`
  - `apps/docs/test/chart-html.test.tsx`
- Modify: `apps/docs/src/pages/foundations/colour.astro`

- [ ] **Step 1: Write the bar chart demos.**
  - Each demo whose native twin is generated exports its props, so the test in Step 4 renders exactly what the page shows.
  - `apps/docs/src/demos/bar-chart/ProjectsByYear.tsx`:

```tsx
import { BarChart, type BarChartProps } from "@raster/react";

export const projectsByYear = {
  caption: "Projects by year",
  data: [
    { year: "2019", built: 3, planned: 1 },
    { year: "2020", built: 2, planned: 3 },
    { year: "2021", built: 4, planned: 2 },
    { year: "2022", built: 5, planned: 4 },
    { year: "2023", built: 4, planned: 6 },
    { year: "2024", built: 6, planned: 5 },
    { year: "2025", built: 7, planned: 3 },
  ],
  x: "year",
  xLabel: "Year",
  series: [
    { key: "built", label: "Built" },
    { key: "planned", label: "Planned" },
  ],
} satisfies BarChartProps;

export default function ProjectsByYear() {
  return <BarChart {...projectsByYear} />;
}
```

`apps/docs/src/demos/bar-chart/BudgetByDiscipline.tsx`:

```tsx
import { BarChart } from "@raster/react";

const data = [
  { discipline: "Wayfinding", budget: 420 },
  { discipline: "Identity", budget: 310 },
  { discipline: "Exhibition", budget: 260 },
  { discipline: "Digital", budget: 180 },
  { discipline: "Print", budget: 95 },
];

export default function BudgetByDiscipline() {
  return (
    <BarChart
      caption="Budget by discipline, CHF thousands"
      data={data}
      x="discipline"
      xLabel="Discipline"
      series={[{ key: "budget", label: "Budget" }]}
      orientation="horizontal"
      format={(value) => `${value}k`}
    />
  );
}
```

`apps/docs/src/demos/bar-chart/HoursByPhase.tsx`:

```tsx
import { BarChart } from "@raster/react";

const data = [
  { project: "Linie 7", research: 120, design: 340, production: 210 },
  { project: "Seebad", research: 80, design: 190, production: 260 },
  { project: "Parkleitsystem", research: 150, design: 280, production: 120 },
  { project: "Archiv", research: 60, design: 140, production: 90 },
];

export default function HoursByPhase() {
  return (
    <BarChart
      caption="Hours by phase"
      data={data}
      x="project"
      xLabel="Project"
      series={[
        { key: "research", label: "Research" },
        { key: "design", label: "Design" },
        { key: "production", label: "Production" },
      ]}
      stacked
    />
  );
}
```

- [ ] **Step 2: Write the line chart demos.** `apps/docs/src/demos/line-chart/Visitors.tsx`:

```tsx
import { LineChart, type LineChartProps } from "@raster/react";

export const visitors = {
  caption: "Exhibition visitors, thousands",
  data: [
    { month: "Jan", zurich: 12, basel: 8, bern: 5 },
    { month: "Feb", zurich: 14, basel: 9, bern: 6 },
    { month: "Mar", zurich: 18, basel: 11, bern: 6 },
    { month: "Apr", zurich: 21, basel: 15, bern: 8 },
    { month: "May", zurich: 25, basel: 17, bern: 11 },
    { month: "Jun", zurich: 28, basel: 16, bern: 13 },
    { month: "Jul", zurich: 31, basel: 19, bern: 12 },
    { month: "Aug", zurich: 30, basel: 21, bern: 14 },
    { month: "Sep", zurich: 24, basel: 18, bern: 12 },
    { month: "Oct", zurich: 20, basel: 14, bern: 9 },
    { month: "Nov", zurich: 16, basel: 10, bern: 7 },
    { month: "Dec", zurich: 13, basel: 9, bern: 6 },
  ],
  x: "month",
  xLabel: "Month",
  series: [
    { key: "zurich", label: "Zürich" },
    { key: "basel", label: "Basel" },
    { key: "bern", label: "Bern" },
  ],
} satisfies LineChartProps;

export default function Visitors() {
  return <LineChart {...visitors} />;
}
```

`apps/docs/src/demos/line-chart/EnergyUse.tsx`:

```tsx
import { LineChart } from "@raster/react";

const data = [
  { week: "W1", kwh: 412 },
  { week: "W2", kwh: 398 },
  { week: "W3", kwh: 455 },
  { week: "W4", kwh: 430 },
  { week: "W5", kwh: 380 },
  { week: "W6", kwh: 362 },
];

export default function EnergyUse() {
  return (
    <LineChart
      caption="Studio energy use, kWh per week"
      data={data}
      x="week"
      xLabel="Week"
      series={[{ key: "kwh", label: "Energy" }]}
      domain={[0, 500]}
      area
    />
  );
}
```

`apps/docs/src/demos/line-chart/Highlighted.tsx`:

```tsx
import { LineChart } from "@raster/react";
import { visitors } from "./Visitors";

export default function Highlighted() {
  return <LineChart {...visitors} caption="Zürich against the other venues" highlight="zurich" />;
}
```

- [ ] **Step 3: Write the sparkline demos.** `apps/docs/src/demos/sparkline/InAStat.tsx`:

```tsx
import { Sparkline, Stack, Stat } from "@raster/react";

export const revenue = { data: [4.1, 3.8, 4.4, 4.9, 5, 5.6, 5.2, 5.9, 6.3], label: "Revenue, last 9 months, CHF millions" };

export default function InAStat() {
  return (
    <Stack gap={3}>
      <Stat value="6.3M" label="Revenue this month" change="+54% since January" trend="up" />
      <Sparkline {...revenue} />
    </Stack>
  );
}
```

`apps/docs/src/demos/sparkline/InATable.tsx`:

```tsx
import { Sparkline, Table } from "@raster/react";

const rows = [
  { project: "Linie 7", hours: [32, 40, 38, 45, 50, 47] },
  { project: "Seebad", hours: [20, 18, 25, 22, 30, 34] },
  { project: "Parkleitsystem", hours: [44, 41, 36, 30, 28, 22] },
];

export default function InATable() {
  return (
    <Table caption="Hours per week, last six weeks">
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Trend</th>
          <th scope="col" data-numeric="">
            This week
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.project}>
            <th scope="row">{row.project}</th>
            <td>
              <Sparkline data={row.hours} label={`${row.project}, hours per week`} />
            </td>
            <td data-numeric="">{row.hours.at(-1)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

Check `Stack`'s props in `packages/react/src/layout/` before relying on `gap={3}`. The html-snippet test uses `<Stack direction="row" gap={3}>`, so `gap` takes a step number.

- [ ] **Step 4: Write the native-HTML test, generating the files on first run.** Create `apps/docs/test/chart-html.test.tsx`:

```tsx
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BarChart, LineChart, numberFormatter, Sparkline } from "@raster/react";
import { describe, expect, it } from "vitest";
import { projectsByYear } from "../src/demos/bar-chart/ProjectsByYear";
import { visitors } from "../src/demos/line-chart/Visitors";
import { revenue } from "../src/demos/sparkline/InAStat";
import { htmlSnippet } from "../src/lib/html-snippet";

// en-US, as Playwright's browser is, so the parity screenshots compare like with like.
const format = numberFormatter("en-US");

/**
 * The native examples are what a server would write. They are the React components drawn without
 * the focus layer, so this test keeps each committed file equal to that rendering. After changing a
 * demo or the components, regenerate with: UPDATE_CHART_HTML=1 npx vitest run test/chart-html.test.tsx
 */
const CASES = [
  {
    file: "../src/demos/bar-chart/projects-by-year.html",
    Demo: () => <BarChart {...projectsByYear} format={format} interactive={false} />,
  },
  { file: "../src/demos/line-chart/visitors.html", Demo: () => <LineChart {...visitors} format={format} interactive={false} /> },
  { file: "../src/demos/sparkline/revenue.html", Demo: () => <Sparkline {...revenue} format={format} /> },
];

describe("native chart examples", () => {
  it.each(CASES)("$file is the React rendering without the focus layer", async ({ file, Demo }) => {
    const path = fileURLToPath(new URL(file, import.meta.url));
    const html = `${await htmlSnippet(Demo)}\n`;
    if (process.env.UPDATE_CHART_HTML) writeFileSync(path, html);
    expect(readFileSync(path, "utf8")).toBe(html);
  });
});
```

Run `cd apps/docs && UPDATE_CHART_HTML=1 npx vitest run test/chart-html.test.tsx`, then `npx vitest run test/chart-html.test.tsx`. Expected: the first run writes the three `.html` files; the second passes. Open each file and check four things:
  - No `tabindex`, `role="group"` or `id` appears.
  - The `style="--at:…"` attributes survived prettier.
  - The SVG keeps `preserveAspectRatio` in that exact case.
  - No whitespace was added inside `.sw-chart-tick` or `.sw-chart-legend-item` text.

  If prettier mangles any of these, read `apps/docs/src/lib/html-snippet.ts` and fix it there with a unit test in `apps/docs/test/html-snippet.test.tsx`, not here.

- [ ] **Step 5: Write the pages.** `apps/docs/src/content/components/bar-chart.mdx`:

````mdx
---
title: BarChart
group: Display
order: 16
summary: Bars from zero, grouped or stacked, vertical or horizontal, with the data one click away.
interactive: true
props:
  - name: caption
    type: ReactNode
    description: Required. Shown above the chart; names its marks.
  - name: data / x / xLabel
    type: "Record<string, string | number>[] / string / string"
    description: One object per category. x is the key holding the category; xLabel heads that column in the data table.
  - name: series
    type: "{ key, label }[]"
    description: Up to six, coloured in this order. Fold the rest into "Other".
  - name: orientation
    type: '"vertical" | "horizontal"'
    default: '"vertical"'
    description: Horizontal bars suit long category names and ranked lists.
  - name: stacked
    type: boolean
    default: "false"
    description: One bar per category, its series stacked; negative values stack downward.
  - name: highlight
    type: string
    description: A series key. That series keeps its colour; the rest turn muted.
  - name: format
    type: "(value: number) => string"
    description: Formats ticks, names, the tooltip and the table. Defaults to the reader's locale.
  - name: interactive
    type: boolean
    default: "true"
    description: The focus layer. Turn it off for print, email or server-only output.
a11y:
  - The chart is one tab stop. Left and Right move between categories, Up and Down between series (the other way round for horizontal bars), and Home and End jump to the ends.
  - Each bar is named with its series, category and value, such as "Built, 2023: 4"; a tooltip shows the same to sighted keyboard and pointer users.
  - Show data opens a real table of every value, on both routes.
  - Series colours are checked for colour-blind readers and contrast, and a legend names them, so colour never carries identity alone.
  - Without React, the server writes the same markup; there are no tooltips, and the table carries the values.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import BudgetByDiscipline from "../../demos/bar-chart/BudgetByDiscipline";
import budgetSource from "../../demos/bar-chart/BudgetByDiscipline.tsx?raw";
import HoursByPhase from "../../demos/bar-chart/HoursByPhase";
import hoursSource from "../../demos/bar-chart/HoursByPhase.tsx?raw";
import ProjectsByYear from "../../demos/bar-chart/ProjectsByYear";
import projectsSource from "../../demos/bar-chart/ProjectsByYear.tsx?raw";
import projectsHtml from "../../demos/bar-chart/projects-by-year.html?raw";

<Example title="Projects by year" source={projectsSource}>
  <ProjectsByYear client:load />
</Example>

<Example title="Budget by discipline" source={budgetSource}>
  <BudgetByDiscipline client:load />
</Example>

<Example title="Hours by phase" source={hoursSource}>
  <HoursByPhase client:load />
</Example>

<NativeExample title="Projects by year without React" html={projectsHtml} />

The native chart is the markup above, written by your server. The geometry the components use is exported (`barLayout`, `valueAxis`) for servers that run JavaScript.

Bars always start at zero, and a chart has one value axis. For two measures on different scales, draw two charts. For a single headline figure, use Stat.
````

`apps/docs/src/content/components/line-chart.mdx`:

````mdx
---
title: LineChart
group: Display
order: 17
summary: Lines over ordered categories such as months, with markers, end labels and an optional area.
interactive: true
props:
  - name: caption / data / x / xLabel / series
    type: as BarChart
    description: The same data shape as BarChart. Categories are spaced evenly, first to last edge to edge.
  - name: area
    type: boolean
    default: "false"
    description: Fills under each line in its colour at 12%. Best with one series.
  - name: domain
    type: "[number, number]"
    description: An exact value range. By default, the data's range on nice numbers; lines need not start at zero.
  - name: highlight / format / interactive
    type: as BarChart
    description: One series in colour and the rest muted; value formatting; the focus layer.
a11y:
  - The chart is one tab stop. Left and Right move along the line, Up and Down between series, and Home and End jump to the ends.
  - Each point is named with its series, category and value; a crosshair and tooltip follow focus and the pointer.
  - Two to four lines are labelled at their ends, as well as in the legend, so no line is identified by colour alone.
  - Show data opens a table of every value, on both routes.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import EnergyUse from "../../demos/line-chart/EnergyUse";
import energySource from "../../demos/line-chart/EnergyUse.tsx?raw";
import Highlighted from "../../demos/line-chart/Highlighted";
import highlightedSource from "../../demos/line-chart/Highlighted.tsx?raw";
import Visitors from "../../demos/line-chart/Visitors";
import visitorsSource from "../../demos/line-chart/Visitors.tsx?raw";
import visitorsHtml from "../../demos/line-chart/visitors.html?raw";

<Example title="Visitors" source={visitorsSource}>
  <Visitors client:load />
</Example>

<Example title="Energy use" source={energySource}>
  <EnergyUse client:load />
</Example>

<Example title="Highlighted" source={highlightedSource}>
  <Highlighted client:load />
</Example>

<NativeExample title="Visitors without React" html={visitorsHtml} />

On narrow screens every other month label is hidden; the table and the tooltip still give each one.
````

`apps/docs/src/content/components/sparkline.mdx`:

````mdx
---
title: Sparkline
group: Display
order: 18
summary: A small trend that sits in a line of text, beside a Stat or in a table cell.
props:
  - name: data
    type: number[]
    description: The values, oldest first.
  - name: label
    type: string
    description: Required. What the values are; the image is named with it and a summary.
  - name: area
    type: boolean
    default: "false"
    description: Fills under the line.
  - name: format
    type: "(value: number) => string"
    description: Formats the values in the summary.
a11y:
  - A sparkline is one image, named with its label, its first and last values and its range, such as "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3".
  - It has no axes or table. When the exact values matter, use LineChart.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import InAStat from "../../demos/sparkline/InAStat";
import statSource from "../../demos/sparkline/InAStat.tsx?raw";
import InATable from "../../demos/sparkline/InATable";
import tableSource from "../../demos/sparkline/InATable.tsx?raw";
import revenueHtml from "../../demos/sparkline/revenue.html?raw";

<Example title="In a stat" source={statSource}>
  <InAStat />
</Example>

<Example title="In a table" source={tableSource}>
  <InATable />
</Example>

<NativeExample title="Revenue without React" html={revenueHtml} />
````

Before writing these pages, check whether `Example.astro` takes any other required props by reading `apps/docs/src/components/Example.astro`. Match what `data-grid.mdx` passes.

- [ ] **Step 6: Note chart colours on the colour page.** In `apps/docs/src/pages/foundations/colour.astro`, add to the Usage list, after the "State is never shown by colour alone" item:

```html
    <li>Charts take <code>--chart-1</code> to <code>--chart-6</code> in that order, never cycled; <code>--chart-muted</code> recedes the series a chart isn't about.</li>
```

- [ ] **Step 7: Build and check.** Run `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build && cd apps/docs && npx vitest run && npx tsc --noEmit`. Expected: the build succeeds and all docs unit tests pass. If `apps/docs/test/components.test.ts` counts pages or components, update its expected count from 58 to 61.

- [ ] **Step 8: Look at the pages.** Start the docs preview with `preview_start` (or `pnpm --filter @raster/docs preview`). Open `/components/bar-chart/`, `/components/line-chart/` and `/components/sparkline/` at 1440px and 360px, in Alpine light and Zürich dark. Check each of these:
  - The bars sit on the zero line, with 2px gaps between them.
  - Axis labels are centred on their bands and points.
  - At 360px, the minor month labels are hidden and nothing scrolls sideways.
  - End labels don't collide.
  - Tabbing into a chart shows the ring and a tooltip that stays inside the page.
  - Show data opens the table.

  Fix what's wrong in the CSS with a test first, as in Task 3.

- [ ] **Step 9: Commit.**

```bash
git add apps/docs packages
git commit -m "docs: BarChart, LineChart and Sparkline pages, with native examples kept equal to React"
```

---

### Task 7: Browser tests

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`, `apps/docs/e2e/parity.spec.ts`, `apps/docs/e2e/forced-colors.spec.ts`

- [ ] **Step 1: Keyboard walkthroughs.** Append to `apps/docs/e2e/keyboard.spec.ts`, using its existing imports (`example`, `waitForIslands`, `tabTo`). Add them to the import list if any are missing.

```ts
test("bar chart, React: one tab stop, arrows move between bars, the tooltip follows", async ({ page }) => {
  await page.goto("/components/bar-chart/");
  await waitForIslands(page);
  const chart = example(page, "Projects by year");
  const marks = chart.getByRole("group", { name: "Projects by year" });
  const first = marks.getByRole("img", { name: "Built, 2019: 3" });
  await tabTo(page, first);
  const tooltip = chart.locator(".sw-chart-tooltip");
  await expect(tooltip).toContainText("2019");
  await page.keyboard.press("ArrowRight");
  await expect(marks.getByRole("img", { name: "Built, 2020: 2" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(marks.getByRole("img", { name: "Planned, 2020: 3" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(marks.getByRole("img", { name: "Planned, 2025: 3" })).toBeFocused();
  await expect(tooltip).toContainText("2025");
  // One tab stop: Tab leaves the chart for the Show data toggle.
  await page.keyboard.press("Tab");
  await expect(chart.locator("summary")).toBeFocused();
  await expect(tooltip).toHaveCount(0);
});

test("bar chart: Show data opens the table, natively on both routes", async ({ page }) => {
  await page.goto("/components/bar-chart/");
  await waitForIslands(page);
  for (const title of ["Projects by year", "Projects by year without React"]) {
    const chart = example(page, title);
    await chart.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(chart.getByRole("table")).toBeVisible();
    await expect(chart.getByRole("rowheader", { name: "2025" })).toBeVisible();
  }
});

test("line chart, React: arrows move along a line and between lines; the crosshair follows", async ({ page }) => {
  await page.goto("/components/line-chart/");
  await waitForIslands(page);
  const chart = example(page, "Visitors");
  const marks = chart.getByRole("group", { name: "Exhibition visitors, thousands" });
  await tabTo(page, marks.getByRole("img", { name: "Zürich, Jan: 12" }));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(marks.getByRole("img", { name: "Basel, Feb: 9" })).toBeFocused();
  await expect(chart.locator(".sw-chart-crosshair")).toHaveCount(1);
  await expect(chart.locator(".sw-chart-point[data-active]")).toHaveCount(1);
});

test("bar chart, React: hovering a bar shows its tooltip; leaving hides it", async ({ page }) => {
  await page.goto("/components/bar-chart/");
  await waitForIslands(page);
  const chart = example(page, "Projects by year");
  const bar = chart.locator("rect.sw-chart-bar").nth(12); // Built, 2025: the tallest bar.
  await bar.hover();
  await expect(chart.locator(".sw-chart-tooltip-row[data-current]")).toContainText("Built");
  await expect(chart.locator(".sw-chart-tooltip-title")).toHaveText("2025");
  await page.mouse.move(0, 0);
  await expect(chart.locator(".sw-chart-tooltip")).toHaveCount(0);
});
```

Projects by year draws `[built, planned]` per year, series-major within each category. Index 12 is therefore 2025's Built bar, at value 7, the tallest. If `hover()` lands on the plot's targets layer, that's fine: it ignores pointer events, so the plot still gets the move.

- [ ] **Step 2: Parity.** Inside the `for (const combo of COMBOS)` block in `apps/docs/e2e/parity.spec.ts`, after the slider test, add:

```ts
    test("bar chart renders alike", async ({ page }) => {
      await open(page, "/components/bar-chart/");
      await expectSameRendering(
        page,
        `bar-chart-${variant}`,
        demo(page, "Projects by year"),
        demo(page, "Projects by year without React"),
      );
    });

    test("line chart renders alike", async ({ page }) => {
      await open(page, "/components/line-chart/");
      await expectSameRendering(page, `line-chart-${variant}`, demo(page, "Visitors"), demo(page, "Visitors without React"));
    });
```

- [ ] **Step 3: Forced colours.** Add to `CASES` in `apps/docs/e2e/forced-colors.spec.ts`:

```ts
  { path: "/components/bar-chart/", title: "Hours by phase", name: "bar-chart-stacked" },
  { path: "/components/line-chart/", title: "Visitors", name: "line-chart" },
  { path: "/components/sparkline/", title: "In a table", name: "sparkline" },
```

- [ ] **Step 4: Run them, creating the new baselines.** Rebuild as in the conventions, then run `cd apps/docs && npx playwright test --project chromium keyboard.spec.ts parity.spec.ts forced-colors.spec.ts a11y.spec.ts --update-snapshots`.
  - The new parity and forced-colours baselines are written. The existing ones are unchanged; confirm with `git status apps/docs/e2e/__screenshots__`.
  - If a parity pair differs, open both images and find the cause. Likely causes: a text node prettier added, or a React-only attribute that changes layout. Fix the cause, not the tolerance.
  - The a11y sweep covers the three new pages automatically. Fix any finding in the component and add a unit test.

- [ ] **Step 5: Run them again without updating.** Run `npx playwright test --project chromium keyboard.spec.ts parity.spec.ts forced-colors.spec.ts a11y.spec.ts`. Expected: all pass twice in a row.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/e2e
git commit -m "test(docs): chart keyboard walkthroughs, parity and forced-colours screenshots"
```

---

### Task 8: Visual baselines and a look at them

**Files:**
- Create: `apps/docs/e2e/__screenshots__/bar-chart-*`, `line-chart-*`, `sparkline-*` (generated)

- [ ] **Step 1: Generate the new pages' baselines.** Run `cd apps/docs && npx playwright test --project visual -g "examples on (bar-chart|line-chart|sparkline)" --update-snapshots`. That writes 4 combinations × 3 widths for each example: 4 + 3 + 3 = 10 examples, 120 images.

- [ ] **Step 2: Run the whole visual project.** Run `npx playwright test --project visual`. Expected: every other page's baselines still pass. Charts change no shared CSS, so a failure elsewhere is a regression to find, not a baseline to refresh.

- [ ] **Step 3: Look at the screenshots.** Open these with the Read tool and check them by eye:
  - `bar-chart-1-alpine-light-1440-darwin.png` and `bar-chart-1-zurich-dark-360-darwin.png`: gaps between bars, the zero line over the bars, legend swatches, and tick labels centred on gridlines.
  - `bar-chart-2-alpine-light-768-darwin.png` (horizontal): category labels end-aligned beside their bars, and vertical gridlines.
  - `bar-chart-3-zurich-light-1440-darwin.png` (stacked): three colours told apart, with 2px gaps between segments.
  - `line-chart-1-alpine-dark-1440-darwin.png` and `line-chart-1-alpine-light-360-darwin.png`:
    - square markers;
    - end labels apart and not clipped;
    - minor months hidden at 360px;
    - nothing outside the figure.
  - `line-chart-2-zurich-dark-768-darwin.png` (area): a faint fill down to zero.
  - `line-chart-3-alpine-light-1440-darwin.png` (highlight): muted lines beneath the Zürich line.
  - `sparkline-2-alpine-light-360-darwin.png`: sparklines vertically centred in their cells.
  - `forced-line-chart-darwin.png`, `forced-bar-chart-stacked-darwin.png`: series still coloured, and gaps in the system background.

  Fix any defect in the CSS with a test first. Then delete the affected baselines and regenerate them; don't rely on `--update-snapshots` noticing a small change.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/e2e/__screenshots__ packages apps
git commit -m "test(docs): chart visual baselines"
```

---

### Task 9: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what was settled.** Append a section `## 17. Settled in Plan 7f` to the spec.
  - Write it from what actually happened, in the style of §15. One bullet per decision that a later reader would need.
  - It must cover:
    - the markup contract and why words are HTML;
    - generated native examples and their test;
    - the token check;
    - `interactive={false}`;
    - the keyboard model;
    - `role="img"` (or what replaced it);
    - anything learned from screenshots.
  - End with a **Known** bullet for open items. That includes that screen-reader announcement of chart marks has not been checked by hand with VoiceOver or NVDA, unless it was.

- [ ] **Step 2: Run everything.** Run `pnpm verify`. Expected: build, lint, typecheck, unit tests and all browser tests pass. If anything fails, fix the cause and rerun the whole command.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7f's outcomes"
```

---

## Self-review notes

- **Spec coverage (§16):**
  - Three components: Tasks 4 and 5.
  - SVG marks and HTML words: Tasks 3 and 4.
  - Geometry exported for servers: Tasks 2 and 4.
  - Colour roles and their limits: Task 1.
  - `highlight`: Tasks 4 and 5.
  - Visual rules: Task 3, checked by eye in Tasks 6 and 8.
  - Focus layer, names and tooltip: Task 4.
  - Data table: Task 4.
  - Sparkline summary: Task 5.
  - Forced colours: Tasks 3 and 7.
  - The generated native examples test: Task 6.
  - Keyboard, parity, forced colours, axe and reflow: Task 7.
  - Visual baselines: Task 8.
- **Not covered by automated tests:** screen-reader announcements, and RTL pages. Charts force left to right.
- **Type names used across tasks:**
  - `ChartDatum`, `ChartSeries`, `HitRect`, `Mark`, `ChartProps`.
  - `seriesAttributes`, `useChartFormat`, `at`, `place`.
  - `barLayout`, `lineLayout`, `sparklineLayout`, `sparklineSummary`, `valueAxis`, `numberFormatter`.
  - `nearestRect`, `nearestPoint`, `stepMark`, `spreadLabels`, `stackSpans`, `pct`, `valueOf`, `checkSeries`, `MAX_SERIES`.
