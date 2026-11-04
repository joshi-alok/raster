# Raster Plan 1: Tokens and CSS Foundations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Raster monorepo with a contrast-checked token package (`@raster/tokens`) and a themable CSS foundation (`@raster/css`: reset, base, fluid grid, type, layout primitives, utilities), plus a playground page to verify it in a browser.

**Architecture:** Tokens live in TypeScript modules. A `tsx` build script checks every colour pairing against WCAG thresholds, then emits `dist/tokens.css` and `dist/tokens.json`. Colour roles are emitted as `light-dark()` values, so `color-scheme` controls the mode. `@raster/css` is plain CSS in cascade layers, bundled by Lightning CSS. It imports the token CSS into the `raster.tokens` layer. Stylelint forbids raw colour literals in component CSS.

**Tech Stack:** pnpm 10 workspaces, Node 22, TypeScript 5.9, tsx 4, Vitest 3, Lightning CSS 1.33, Stylelint 16, Fontsource Geist / Geist Mono.

**Spec:** `docs/superpowers/specs/2026-11-04-raster-design-system-design.md`

## Plan series

The spec is delivered in four plans. Each one produces working, tested software.

1. **This plan.** Monorepo, tokens and CSS foundations (spec sections 2, 3, 4, 5, and the reduced-motion duration tokens from 7).
2. **Static components.** CSS and React for the layout, type, action, form and display components.
3. **Interactive components.** React Aria overlays and navigation, plus the expressive motion tier.
4. **Docs site and quality gates.** The Astro docs site and the Playwright visual and accessibility checks.

---

## File structure

```
package.json                     root scripts (build/test/lint/typecheck across workspace)
pnpm-workspace.yaml              workspace globs
tsconfig.base.json               shared strict TS settings
.gitignore, .nvmrc

packages/tokens/
  package.json, tsconfig.json
  src/color.ts                   hex → relative luminance, contrast ratio
  src/foundation.ts              fluid()/rem() helpers, type scale, spacing, layout, motion → flat token map
  src/themes.ts                  role list, Theme type, alpine + zurich role values
  src/contrast.ts                which pairs must pass, checkTheme(), formatViolations()
  src/emit-css.ts                foundationCss(), themeCss(), tokensCss()
  src/emit-json.ts               tokensJson() in W3C DTCG shape
  src/build.ts                   CLI: check → write dist/tokens.css + dist/tokens.json
  src/index.ts                   public re-exports
  test/*.test.ts                 one test file per src module

packages/css/
  package.json, .stylelintrc.json, build.mjs
  src/index.css                  layer order + imports
  src/reset.css                  raster.reset
  src/base.css                   raster.base: root colours, element type, links, focus, reduced motion
  src/layout/container.css       .sw-container, .sw-section, .sw-bleed
  src/layout/grid.css            .sw-grid, .sw-col, layout presets, rules + debug overlay
  src/layout/stack.css           .sw-stack
  src/layout/rule.css            .sw-rule
  src/utilities.css              type styles, measure, text colours, sr-only, block margins
  test/lint.test.ts              stylelint guard behaves + all sources pass
  test/build.test.ts             bundle shape: layer order, tokens, grid, presets, utilities
  playground/index.html          manual visual check page
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`

- [ ] **Step 1: Create root files**

`package.json`:

```json
{
  "name": "raster",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck"
  },
  "pnpm": { "onlyBuiltDependencies": ["esbuild"] }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  }
}
```

`.gitignore`:

```
node_modules/
dist/
.DS_Store
*.log
```

`.nvmrc`:

```
22
```

- [ ] **Step 2: Verify pnpm sees the workspace**

Run: `pnpm install`
Expected: completes with "Already up to date" or "Done" and no errors (no packages yet).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .nvmrc pnpm-lock.yaml
git commit -m "chore: scaffold raster pnpm workspace"
```

(If `pnpm-lock.yaml` was not created, omit it from `git add`.)

---

### Task 2: Tokens package and contrast maths

**Files:**
- Create: `packages/tokens/package.json`, `packages/tokens/tsconfig.json`, `packages/tokens/src/color.ts`
- Test: `packages/tokens/test/color.test.ts`

- [ ] **Step 1: Create the package**

`packages/tokens/package.json`:

```json
{
  "name": "@raster/tokens",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./dist/tokens.css",
    "./tokens.json": "./dist/tokens.json"
  },
  "scripts": {
    "build": "tsx src/build.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "4.23.15",
    "typescript": "5.9.3",
    "vitest": "3.2.7"
  }
}
```

`packages/tokens/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "test"]
}
```

Run: `pnpm install`
Expected: installs tsx, typescript, vitest and @types/node with no errors.

- [ ] **Step 2: Write the failing test**

`packages/tokens/test/color.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "../src/color";

describe("relativeLuminance", () => {
  it("is 1 for white and 0 for black", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("rejects anything that is not a 6-digit hex", () => {
    expect(() => relativeLuminance("#FFF")).toThrow("Invalid hex colour: #FFF");
    expect(() => relativeLuminance("white")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("matches the known WCAG value for #777777 on white", () => {
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#2F5F8A", "#FFFFFF")).toBeCloseTo(contrastRatio("#FFFFFF", "#2F5F8A"), 10);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL — `Failed to resolve import "../src/color"`.

- [ ] **Step 4: Write the implementation**

`packages/tokens/src/color.ts`:

```ts
const HEX = /^#[0-9a-fA-F]{6}$/;

/** WCAG 2.x relative luminance of a #RRGGBB colour. */
export function relativeLuminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`Invalid hex colour: ${hex}`);
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #RRGGBB colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @raster/tokens test`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens pnpm-lock.yaml
git commit -m "feat(tokens): add WCAG contrast maths"
```

---

### Task 3: Foundation tokens (fluid type, spacing, layout, motion)

**Files:**
- Create: `packages/tokens/src/foundation.ts`
- Test: `packages/tokens/test/foundation.test.ts`

Fluid values interpolate linearly between a 360px and a 1440px viewport. A rem term is kept so browser zoom still scales text.

- [ ] **Step 1: Write the failing test**

`packages/tokens/test/foundation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fluid, foundationTokens, rem, TYPE_STEPS } from "../src/foundation";

describe("rem", () => {
  it("converts px to rem at a 16px root", () => {
    expect(rem(4)).toBe("0.25rem");
    expect(rem(44)).toBe("2.75rem");
    expect(rem(17)).toBe("1.0625rem");
  });
});

describe("fluid", () => {
  it("returns a plain rem value when min equals max", () => {
    expect(fluid(12, 12)).toBe("0.75rem");
  });

  it("interpolates between 360px and 1440px viewports", () => {
    expect(fluid(16, 17)).toBe("clamp(1rem, 0.9792rem + 0.0926vw, 1.0625rem)");
    expect(fluid(40, 52)).toBe("clamp(2.5rem, 2.25rem + 1.1111vw, 3.25rem)");
  });
});

describe("foundationTokens", () => {
  const t = foundationTokens();

  it("emits every type step with size, weight, tracking and leading", () => {
    for (const step of Object.keys(TYPE_STEPS)) {
      expect(t[`text-${step}-size`]).toBeDefined();
      expect(t[`text-${step}-weight`]).toBeDefined();
      expect(t[`text-${step}-tracking`]).toBeDefined();
      expect(t[`text-${step}-leading`]).toBeDefined();
    }
    expect(t["text-h1-size"]).toBe(fluid(33, 42));
    expect(t["text-display-weight"]).toBe("300");
    expect(t["text-label-tracking"]).toBe("0.04em");
  });

  it("never uses a weight above 500", () => {
    for (const step of Object.values(TYPE_STEPS)) expect(step.weight).toBeLessThanOrEqual(500);
  });

  it("emits a nine-step spacing scale on a 4px base", () => {
    expect(t["space-1"]).toBe("0.25rem");
    expect(t["space-6"]).toBe("2rem");
    expect(t["space-9"]).toBe(fluid(64, 96));
    expect(t["space-10"]).toBeUndefined();
  });

  it("emits grid, control, focus and motion tokens", () => {
    expect(t["grid-gutter"]).toBe("clamp(1rem, 2vw, 2rem)");
    expect(t["page-margin"]).toBe("clamp(1rem, 5vw, 6rem)");
    expect(t["content-max"]).toBe("90rem");
    expect(t["control-height"]).toBe("2.5rem");
    expect(t["target-min"]).toBe("2.75rem");
    expect(t["focus-width"]).toBe("2px");
    expect(t["dur-fast"]).toBe("120ms");
    expect(t["ease-standard"]).toBe("cubic-bezier(0.2, 0, 0, 1)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL — `Failed to resolve import "../src/foundation"`.

- [ ] **Step 3: Write the implementation**

`packages/tokens/src/foundation.ts`:

```ts
const ROOT_PX = 16;
const VIEWPORT_MIN = 360;
const VIEWPORT_MAX = 1440;

const fmt = (n: number): string => String(Number(n.toFixed(4)));

export const rem = (px: number): string => `${fmt(px / ROOT_PX)}rem`;

/** A clamp() that grows linearly from minPx at a 360px viewport to maxPx at 1440px. */
export function fluid(minPx: number, maxPx: number): string {
  if (minPx === maxPx) return rem(minPx);
  const slope = (maxPx - minPx) / (VIEWPORT_MAX - VIEWPORT_MIN);
  const intercept = minPx - slope * VIEWPORT_MIN;
  return `clamp(${rem(minPx)}, ${fmt(intercept / ROOT_PX)}rem + ${fmt(slope * 100)}vw, ${rem(maxPx)})`;
}

export interface TypeStep {
  min: number;
  max: number;
  weight: 300 | 400 | 500;
  tracking: string;
  leading: number;
}

export const TYPE_STEPS = {
  display: { min: 40, max: 52, weight: 300, tracking: "-0.025em", leading: 1.1 },
  h1: { min: 33, max: 42, weight: 400, tracking: "-0.02em", leading: 1.15 },
  h2: { min: 28, max: 33, weight: 400, tracking: "-0.015em", leading: 1.15 },
  h3: { min: 23, max: 27, weight: 400, tracking: "-0.01em", leading: 1.2 },
  h4: { min: 19, max: 21, weight: 500, tracking: "0", leading: 1.3 },
  body: { min: 16, max: 17, weight: 400, tracking: "0", leading: 1.5 },
  caption: { min: 13, max: 14, weight: 400, tracking: "0", leading: 1.4 },
  label: { min: 12, max: 12, weight: 400, tracking: "0.04em", leading: 1.3 },
} as const satisfies Record<string, TypeStep>;

/** [minPx, maxPx] per spacing step; steps 7–9 grow with the viewport. */
const SPACE: ReadonlyArray<readonly [number, number]> = [
  [4, 4], [8, 8], [12, 12], [16, 16], [24, 24], [32, 32], [40, 48], [48, 64], [64, 96],
];

/** Theme-independent tokens, keyed by custom property name without the leading "--". */
export function foundationTokens(): Record<string, string> {
  const t: Record<string, string> = {
    "font-sans": '"Geist Variable", "Geist", "Noto Sans", system-ui, sans-serif',
    "font-mono": '"Geist Mono Variable", "Geist Mono", ui-monospace, Menlo, monospace',
  };

  for (const [name, step] of Object.entries(TYPE_STEPS)) {
    t[`text-${name}-size`] = fluid(step.min, step.max);
    t[`text-${name}-weight`] = String(step.weight);
    t[`text-${name}-tracking`] = step.tracking;
    t[`text-${name}-leading`] = String(step.leading);
  }

  SPACE.forEach(([min, max], i) => {
    t[`space-${i + 1}`] = fluid(min, max);
  });

  Object.assign(t, {
    "grid-gutter": "clamp(1rem, 2vw, 2rem)",
    "page-margin": "clamp(1rem, 5vw, 6rem)",
    "content-max": "90rem",
    "control-height": rem(40),
    "target-min": rem(44),
    "focus-width": "2px",
    "focus-offset": "2px",
    "radius-full": "9999px",
    "shadow-overlay":
      "0 8px 24px light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.48)), 0 2px 6px light-dark(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.32))",
    "dur-fast": "120ms",
    "dur-base": "200ms",
    "dur-slow": "320ms",
    "dur-layout": "480ms",
    "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
    "ease-linear": "linear",
  });

  return t;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @raster/tokens test`
Expected: PASS, all tests in `color.test.ts` and `foundation.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): add fluid type, spacing, layout and motion tokens"
```

---

### Task 4: Themes and contrast checking

**Files:**
- Create: `packages/tokens/src/themes.ts`, `packages/tokens/src/contrast.ts`
- Test: `packages/tokens/test/contrast.test.ts`

Each role holds a `[light, dark]` pair. The values come from spec section 5. Every pair has already been checked by hand, so the real themes must produce zero violations.

- [ ] **Step 1: Write the failing test**

`packages/tokens/test/contrast.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL — `Failed to resolve import "../src/contrast"`.

- [ ] **Step 3: Write themes**

`packages/tokens/src/themes.ts`:

```ts
export const ROLES = [
  "surface-page", "surface-raised", "surface-subtle",
  "text-primary", "text-secondary", "text-muted",
  "border", "border-strong",
  "accent", "on-accent", "accent-subtle", "on-accent-subtle",
  "success", "on-success", "success-subtle", "on-success-subtle",
  "warning", "on-warning", "warning-subtle", "on-warning-subtle",
  "danger", "on-danger", "danger-subtle", "on-danger-subtle",
  "brand-signal",
] as const;

export type Role = (typeof ROLES)[number];

/** [light, dark] */
export type ModePair = readonly [string, string];

export interface Theme {
  name: "alpine" | "zurich";
  radius: string;
  colors: Record<Role, ModePair>;
}

export const alpine: Theme = {
  name: "alpine",
  radius: "4px",
  colors: {
    "surface-page": ["#FFFFFF", "#12181D"],
    "surface-raised": ["#FFFFFF", "#1A2229"],
    "surface-subtle": ["#F2F5F7", "#222C34"],
    "text-primary": ["#1B242C", "#E6ECF0"],
    "text-secondary": ["#4A5763", "#A3AFB9"],
    "text-muted": ["#63707C", "#8794A0"],
    border: ["#E3E8EC", "#2E3943"],
    "border-strong": ["#7D8A96", "#74818D"],
    accent: ["#2F5F8A", "#9DC0DE"],
    "on-accent": ["#FFFFFF", "#12181D"],
    "accent-subtle": ["#E3EDF5", "#183652"],
    "on-accent-subtle": ["#183652", "#9DC0DE"],
    success: ["#476445", "#A3BFA0"],
    "on-success": ["#FFFFFF", "#12181D"],
    "success-subtle": ["#E6EEE5", "#2A3D29"],
    "on-success-subtle": ["#2A3D29", "#A3BFA0"],
    warning: ["#7F5C14", "#E2B85C"],
    "on-warning": ["#FFFFFF", "#12181D"],
    "warning-subtle": ["#F7EED9", "#4A360C"],
    "on-warning-subtle": ["#4A360C", "#E2B85C"],
    danger: ["#B23422", "#F08A78"],
    "on-danger": ["#FFFFFF", "#12181D"],
    "danger-subtle": ["#FBE7E4", "#6E1F14"],
    "on-danger-subtle": ["#6E1F14", "#F08A78"],
    "brand-signal": ["#7FA7C9", "#9DC0DE"],
  },
};

export const zurich: Theme = {
  name: "zurich",
  radius: "0",
  colors: {
    "surface-page": ["#FCFBF8", "#161513"],
    "surface-raised": ["#FFFFFF", "#1F1E1B"],
    "surface-subtle": ["#F4F1EA", "#282622"],
    "text-primary": ["#1C1C1E", "#EDEAE3"],
    "text-secondary": ["#55524C", "#B3AEA4"],
    "text-muted": ["#6B665D", "#918C82"],
    border: ["#E8E4DA", "#34322D"],
    "border-strong": ["#8A847A", "#7E796F"],
    accent: ["#2F4BD8", "#9DAAF0"],
    "on-accent": ["#FFFFFF", "#161513"],
    "accent-subtle": ["#E4E8FB", "#1A2A80"],
    "on-accent-subtle": ["#1A2A80", "#9DAAF0"],
    success: ["#4F6450", "#A8BBA6"],
    "on-success": ["#FFFFFF", "#161513"],
    "success-subtle": ["#E8EEE7", "#2C3A2D"],
    "on-success-subtle": ["#2C3A2D", "#A8BBA6"],
    warning: ["#7F5C14", "#E2B85C"],
    "on-warning": ["#FFFFFF", "#161513"],
    "warning-subtle": ["#F7EED9", "#4A360C"],
    "on-warning-subtle": ["#4A360C", "#E2B85C"],
    danger: ["#C02A17", "#F2836F"],
    "on-danger": ["#FFFFFF", "#161513"],
    "danger-subtle": ["#FBE5E1", "#6F180D"],
    "on-danger-subtle": ["#6F180D", "#F2836F"],
    "brand-signal": ["#E5341D", "#F2836F"],
  },
};

/** Order matters: Alpine is emitted first so `[data-theme="zurich"]` on :root overrides it. */
export const themes: readonly Theme[] = [alpine, zurich];
```

- [ ] **Step 4: Write contrast checking**

`packages/tokens/src/contrast.ts`:

```ts
import { contrastRatio } from "./color";
import type { Role, Theme } from "./themes";

export interface Pair {
  foreground: Role;
  background: Role;
  minimum: number;
}

export interface Violation extends Pair {
  theme: string;
  mode: "light" | "dark";
  ratio: number;
}

const SURFACES = ["surface-page", "surface-raised", "surface-subtle"] as const;
const TEXT = ["text-primary", "text-secondary", "text-muted", "accent", "success", "warning", "danger"] as const;
const STATUSES = ["accent", "success", "warning", "danger"] as const;

/** Every foreground/background pairing the system promises is legible. */
export function contrastPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const foreground of TEXT) {
    for (const background of SURFACES) pairs.push({ foreground, background, minimum: 4.5 });
  }
  for (const background of SURFACES) pairs.push({ foreground: "border-strong", background, minimum: 3 });
  for (const s of STATUSES) {
    pairs.push({ foreground: `on-${s}` as Role, background: s, minimum: 4.5 });
    pairs.push({ foreground: `on-${s}-subtle` as Role, background: `${s}-subtle` as Role, minimum: 4.5 });
  }
  return pairs;
}

export function checkTheme(theme: Theme): Violation[] {
  const violations: Violation[] = [];
  (["light", "dark"] as const).forEach((mode, i) => {
    for (const pair of contrastPairs()) {
      const ratio = contrastRatio(theme.colors[pair.foreground][i], theme.colors[pair.background][i]);
      if (ratio < pair.minimum) violations.push({ ...pair, theme: theme.name, mode, ratio });
    }
  });
  return violations;
}

export function formatViolations(violations: Violation[]): string {
  return violations
    .map(
      (v) =>
        `${v.theme}/${v.mode}: ${v.foreground} on ${v.background} = ${v.ratio.toFixed(2)}:1 (needs ${v.minimum}:1)`,
    )
    .join("\n");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @raster/tokens test`
Expected: PASS. Both `checkTheme` cases for real themes return `[]`, and the broken theme reports 3 violations.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): add Alpine and Zurich themes with contrast checking"
```

---

### Task 5: Emit CSS

**Files:**
- Create: `packages/tokens/src/emit-css.ts`
- Test: `packages/tokens/test/emit-css.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/tokens/test/emit-css.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL — `Failed to resolve import "../src/emit-css"`.

- [ ] **Step 3: Write the implementation**

`packages/tokens/src/emit-css.ts`:

```ts
import { foundationTokens } from "./foundation";
import { ROLES, type Theme, themes } from "./themes";

const block = (selector: string, decls: Array<[string, string]>): string =>
  `${selector} {\n${decls.map(([k, v]) => `  ${k}: ${v};\n`).join("")}}\n`;

export function foundationCss(): string {
  const decls: Array<[string, string]> = [["color-scheme", "light dark"]];
  for (const [name, value] of Object.entries(foundationTokens())) decls.push([`--${name}`, value]);
  return [
    block(":root", decls),
    block('[data-mode="light"]', [["color-scheme", "light"]]),
    block('[data-mode="dark"]', [["color-scheme", "dark"]]),
  ].join("\n");
}

export function themeCss(theme: Theme, isDefault: boolean): string {
  const selector = `${isDefault ? ":root, " : ""}[data-theme="${theme.name}"]`;
  const decls: Array<[string, string]> = [["--radius", theme.radius]];
  for (const role of ROLES) {
    const [light, dark] = theme.colors[role];
    decls.push([`--${role}`, `light-dark(${light}, ${dark})`]);
  }
  return block(selector, decls);
}

export function tokensCss(): string {
  const header = "/* Generated by @raster/tokens. Do not edit by hand. */\n";
  return [header + foundationCss(), ...themes.map((t, i) => themeCss(t, i === 0))].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @raster/tokens test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): emit token CSS with light-dark() colour roles"
```

---

### Task 6: Emit JSON and build CLI

**Files:**
- Create: `packages/tokens/src/emit-json.ts`, `packages/tokens/src/build.ts`, `packages/tokens/src/index.ts`
- Test: `packages/tokens/test/emit-json.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/tokens/test/emit-json.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tokensJson } from "../src/emit-json";

describe("tokensJson", () => {
  const json = tokensJson();

  it("exposes foundation tokens as DTCG values", () => {
    expect(json.foundation["space-1"]).toEqual({ $value: "0.25rem" });
  });

  it("exposes each theme's colours per mode with $type color", () => {
    expect(json.themes.zurich.dark.danger).toEqual({ $type: "color", $value: "#F2836F" });
    expect(json.themes.alpine.light["surface-page"]).toEqual({ $type: "color", $value: "#FFFFFF" });
    expect(json.themes.alpine.radius).toEqual({ $type: "dimension", $value: "4px" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL — `Failed to resolve import "../src/emit-json"`.

- [ ] **Step 3: Write the implementation**

`packages/tokens/src/emit-json.ts`:

```ts
import { foundationTokens } from "./foundation";
import { ROLES, type Theme, themes } from "./themes";

type ColorToken = { $type: "color"; $value: string };

function modeGroup(theme: Theme, index: 0 | 1): Record<string, ColorToken> {
  return Object.fromEntries(
    ROLES.map((role): [string, ColorToken] => [role, { $type: "color", $value: theme.colors[role][index] }]),
  );
}

/** W3C Design Tokens Community Group format, for Figma and other tools. */
export function tokensJson() {
  return {
    foundation: Object.fromEntries(
      Object.entries(foundationTokens()).map(([name, value]) => [name, { $value: value }]),
    ) as Record<string, { $value: string }>,
    themes: Object.fromEntries(
      themes.map((t) => [
        t.name,
        { light: modeGroup(t, 0), dark: modeGroup(t, 1), radius: { $type: "dimension", $value: t.radius } },
      ]),
    ) as Record<
      Theme["name"],
      { light: Record<string, ColorToken>; dark: Record<string, ColorToken>; radius: { $type: "dimension"; $value: string } }
    >,
  };
}
```

`packages/tokens/src/build.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTheme, formatViolations } from "./contrast";
import { tokensCss } from "./emit-css";
import { tokensJson } from "./emit-json";
import { themes } from "./themes";

const violations = themes.flatMap(checkTheme);
if (violations.length > 0) {
  console.error(`Contrast check failed:\n${formatViolations(violations)}`);
  process.exit(1);
}

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
mkdirSync(dist, { recursive: true });
writeFileSync(resolve(dist, "tokens.css"), tokensCss());
writeFileSync(resolve(dist, "tokens.json"), `${JSON.stringify(tokensJson(), null, 2)}\n`);
console.log(`Wrote dist/tokens.css and dist/tokens.json (${themes.length} themes, 0 contrast violations)`);
```

`packages/tokens/src/index.ts`:

```ts
export { contrastRatio, relativeLuminance } from "./color";
export { checkTheme, contrastPairs, formatViolations, type Pair, type Violation } from "./contrast";
export { foundationCss, themeCss, tokensCss } from "./emit-css";
export { tokensJson } from "./emit-json";
export { fluid, foundationTokens, rem, TYPE_STEPS, type TypeStep } from "./foundation";
export { alpine, ROLES, themes, zurich, type ModePair, type Role, type Theme } from "./themes";
```

- [ ] **Step 4: Run tests, typecheck and build**

Run: `pnpm --filter @raster/tokens test && pnpm --filter @raster/tokens typecheck && pnpm --filter @raster/tokens build`
Expected: tests PASS; typecheck prints nothing; build prints `Wrote dist/tokens.css and dist/tokens.json (2 themes, 0 contrast violations)`.

- [ ] **Step 5: Prove the gate works**

Temporarily change Alpine's `"text-muted"` light value in `src/themes.ts` to `"#AAAAAA"`, then run `pnpm --filter @raster/tokens build`.
Expected: exit code 1 and output beginning `Contrast check failed:` followed by `alpine/light: text-muted on surface-page = 2.32:1 (needs 4.5:1)`. Revert the change with `git checkout packages/tokens/src/themes.ts`, then rebuild and confirm success.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): add DTCG JSON export and contrast-gated build"
```

---

### Task 7: CSS package and the no-raw-colour lint guard

**Files:**
- Create: `packages/css/package.json`, `packages/css/.stylelintrc.json`, `packages/css/src/index.css` (placeholder layer statement only)
- Test: `packages/css/test/lint.test.ts`

- [ ] **Step 1: Create the package**

`packages/css/package.json`:

```json
{
  "name": "@raster/css",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./dist/raster.css",
    "./raster.css": "./dist/raster.css"
  },
  "scripts": {
    "build": "node build.mjs",
    "test": "pnpm --filter @raster/tokens run build && vitest run",
    "lint": "stylelint \"src/**/*.css\""
  },
  "dependencies": {
    "@raster/tokens": "workspace:*"
  },
  "devDependencies": {
    "@fontsource-variable/geist": "5.3.0",
    "@fontsource-variable/geist-mono": "5.3.0",
    "lightningcss": "1.33.0",
    "stylelint": "16.26.1",
    "vitest": "3.2.7"
  }
}
```

`packages/css/.stylelintrc.json`:

```json
{
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch"]
  }
}
```

`packages/css/src/index.css`:

```css
@layer raster.reset, raster.tokens, raster.base, raster.layout, raster.components, raster.utilities;
```

Run: `pnpm install`
Expected: installs with no errors; `packages/css/node_modules/@raster/tokens` is a symlink to `packages/tokens`.

- [ ] **Step 2: Write the failing test**

`packages/css/test/lint.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(pkg, ".stylelintrc.json"), "utf8"));
const lint = async (code: string) => (await stylelint.lint({ code, config })).errored;

describe("raw colour guard", () => {
  it("rejects hex colours", async () => expect(await lint(".a { color: #fff; }")).toBe(true));
  it("rejects colour functions", async () => expect(await lint(".a { color: rgb(0 0 0); }")).toBe(true));
  it("rejects named colours", async () => expect(await lint(".a { color: red; }")).toBe(true));
  it("accepts token references", async () => expect(await lint(".a { color: var(--text-primary); }")).toBe(false));
  it("accepts transparent and color-mix of tokens", async () =>
    expect(await lint(".a { background: color-mix(in srgb, var(--accent) 10%, transparent); }")).toBe(false));

  it("passes for every source file", async () => {
    const result = await stylelint.lint({ files: "src/**/*.css", cwd: pkg, config });
    expect(result.errored).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify the guard behaves**

Run: `pnpm --filter @raster/css test`
Expected: PASS for all 6 tests. These tests confirm the config rather than new code, so if any fail, fix `.stylelintrc.json` before continuing. (`transparent` is not a named colour to stylelint's `color-named` rule.)

- [ ] **Step 4: Commit**

```bash
git add packages/css pnpm-lock.yaml
git commit -m "feat(css): add css package with raw-colour lint guard"
```

---

### Task 8: Bundle build, reset and base

**Files:**
- Create: `packages/css/build.mjs`, `packages/css/src/reset.css`, `packages/css/src/base.css`
- Modify: `packages/css/src/index.css`
- Test: `packages/css/test/build.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/css/test/build.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../build.mjs";

let css = "";
beforeAll(async () => {
  css = await buildCss();
});

describe("raster.css bundle", () => {
  it("declares the layer order before anything else", () => {
    expect(css.trimStart()).toMatch(
      /^@layer raster\.reset,\s*raster\.tokens,\s*raster\.base,\s*raster\.layout,\s*raster\.components,\s*raster\.utilities;/,
    );
  });

  it("includes the generated tokens inside the tokens layer", () => {
    expect(css).toMatch(/@layer raster\.tokens\s*\{[\s\S]*--surface-page:/);
  });

  it("sets page colours and font from tokens in the base layer", () => {
    expect(css).toMatch(/@layer raster\.base\s*\{[\s\S]*background-color: var\(--surface-page\)/);
    expect(css).toContain("font-family: var(--font-sans)");
  });

  it("caps durations when reduced motion is requested", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*--dur-layout: 0ms/);
    expect(css).toMatch(/\[data-motion="?reduce"?\][\s\S]*--dur-layout: 0ms/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `Failed to resolve import "../build.mjs"`.

- [ ] **Step 3: Write the build script**

`packages/css/build.mjs`:

```js
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleAsync } from "lightningcss";

const root = dirname(fileURLToPath(import.meta.url));

/** Bundle src/index.css (resolving package imports such as @raster/tokens) into one string. */
export async function buildCss({ minify = false } = {}) {
  const { code } = await bundleAsync({
    filename: resolve(root, "src/index.css"),
    minify,
    resolver: {
      resolve(specifier, from) {
        if (specifier.startsWith(".")) return resolve(dirname(from), specifier);
        return createRequire(from).resolve(specifier);
      },
    },
  });
  return code.toString();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(resolve(root, "dist"), { recursive: true });
  writeFileSync(resolve(root, "dist/raster.css"), await buildCss());
  writeFileSync(resolve(root, "dist/raster.min.css"), await buildCss({ minify: true }));
  console.log("Wrote dist/raster.css and dist/raster.min.css");
}
```

- [ ] **Step 4: Write reset and base**

`packages/css/src/reset.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-inline-size: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

table {
  border-collapse: collapse;
}
```

`packages/css/src/base.css`:

```css
:root {
  font-family: var(--font-sans);
  background-color: var(--surface-page);
  color: var(--text-primary);
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  container-type: inline-size;
  min-block-size: 100dvh;
}

/* Each text element picks a step from the type scale through four private custom properties. */
:where(body) {
  --_size: var(--text-body-size);
  --_leading: var(--text-body-leading);
  --_weight: var(--text-body-weight);
  --_tracking: var(--text-body-tracking);
}

:where(h1) {
  --_size: var(--text-h1-size);
  --_leading: var(--text-h1-leading);
  --_weight: var(--text-h1-weight);
  --_tracking: var(--text-h1-tracking);
}

:where(h2) {
  --_size: var(--text-h2-size);
  --_leading: var(--text-h2-leading);
  --_weight: var(--text-h2-weight);
  --_tracking: var(--text-h2-tracking);
}

:where(h3) {
  --_size: var(--text-h3-size);
  --_leading: var(--text-h3-leading);
  --_weight: var(--text-h3-weight);
  --_tracking: var(--text-h3-tracking);
}

:where(h4) {
  --_size: var(--text-h4-size);
  --_leading: var(--text-h4-leading);
  --_weight: var(--text-h4-weight);
  --_tracking: var(--text-h4-tracking);
}

:where(body, p, li, dd, dt, figcaption, blockquote, h1, h2, h3, h4) {
  font-size: var(--_size);
  line-height: var(--_leading);
  font-weight: var(--_weight);
  letter-spacing: var(--_tracking);
}

/* Snap block text to the 4px baseline where round() is supported. Body stays unitless so it inherits safely. */
@supports (line-height: round(up, 1px, 4px)) {
  :where(p, li, dd, dt, figcaption, blockquote, h1, h2, h3, h4) {
    line-height: round(nearest, calc(var(--_size) * var(--_leading)), 4px);
  }
}

:where(h1, h2, h3, h4) {
  text-wrap: balance;
}

:where(p, li, dd, figcaption, blockquote) {
  text-wrap: pretty;
  hyphens: auto;
}

:where(a) {
  color: var(--accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

:where(a:hover) {
  text-decoration-thickness: 2px;
}

:where(code, kbd, samp, pre) {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

:focus-visible {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

::selection {
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-base: 120ms;
    --dur-slow: 120ms;
    --dur-layout: 0ms;
  }
}

[data-motion="reduce"] {
  --dur-base: 120ms;
  --dur-slow: 120ms;
  --dur-layout: 0ms;
}
```

`packages/css/src/index.css` (replace the whole file):

```css
@layer raster.reset, raster.tokens, raster.base, raster.layout, raster.components, raster.utilities;

@import "./reset.css" layer(raster.reset);
@import "@raster/tokens/tokens.css" layer(raster.tokens);
@import "./base.css" layer(raster.base);
```

- [ ] **Step 5: Run tests and lint**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: all build and lint tests PASS; stylelint prints nothing.

If the layer-order test fails because Lightning CSS reorders or merges the `@layer` statement, print the first 300 characters with `node -e "import('./packages/css/build.mjs').then(async m => console.log((await m.buildCss()).slice(0, 300)))"`. Keep the source as written and adjust only the regex whitespace to match.

- [ ] **Step 6: Commit**

```bash
git add packages/css
git commit -m "feat(css): add bundle build, reset and token-driven base styles"
```

---

### Task 9: Fluid grid, container and presets

**Files:**
- Create: `packages/css/src/layout/container.css`, `packages/css/src/layout/grid.css`
- Modify: `packages/css/src/index.css`
- Test: `packages/css/test/build.test.ts` (append)

**API this task establishes (used by Plans 2–4):**
- **`.sw-container`:** a centred, max-width wrapper with fluid page margins. It is a size container named `raster`.
- **`.sw-section`:** vertical rhythm; also a size container.
- **`.sw-bleed`:** cancels page margins inside `.sw-container`.
- **`.sw-grid`:** 4, 8 or 12 columns depending on the nearest container's width (under 600px, 600–1024px, over 1024px). `--grid-row-gap` overrides the row gap.
- **`.sw-col`:** spans the full width by default. Set `--span-4`, `--span-8` and `--span-12`, and optionally `--start-4`, `--start-8` and `--start-12`, as inline custom properties, one per column count. It is also a size container, so nested grids re-flow.
- **`.sw-grid[data-layout="hanging" | "split-5-7" | "split-1-2"]`:** odd children take the narrow column and even children the wide one. Children stack at 4 columns.
- **`.sw-grid[data-grid-rules]`:** hairline at every column start.
- **`.sw-grid[data-grid-debug]`:** tinted columns overlay.

- [ ] **Step 1: Write the failing tests**

Append to `packages/css/test/build.test.ts`:

```ts
describe("layout: container and grid", () => {
  it("makes the container a named size container with fluid margins", () => {
    expect(css).toMatch(/\.sw-container\s*\{[^}]*container:\s*raster\s*\/\s*inline-size/);
    expect(css).toMatch(/\.sw-container\s*\{[^}]*padding-inline:\s*var\(--page-margin\)/);
  });

  it("starts the grid at 4 columns and switches to 8 and 12 by container width", () => {
    expect(css).toMatch(/\.sw-grid\s*\{[^}]*--_cols:\s*4/);
    expect(css).toMatch(/@container[^{]*600px[^{]*\{\s*\.sw-grid\s*\{\s*--_cols:\s*8/);
    expect(css).toMatch(/@container[^{]*1024px[^{]*\{\s*\.sw-grid\s*\{\s*--_cols:\s*12/);
  });

  it("lets columns set a span per column count", () => {
    expect(css).toContain("span var(--span-4, 4)");
    expect(css).toContain("span var(--span-8, 8)");
    expect(css).toContain("span var(--span-12, 12)");
  });

  it("ships the hanging and asymmetric split presets", () => {
    // Lightning CSS may drop the quotes around attribute values, so match either form.
    expect(css).toMatch(/\.sw-grid\[data-layout="?hanging"?\]/);
    expect(css).toMatch(/\.sw-grid\[data-layout="?split-5-7"?\]/);
    expect(css).toMatch(/\.sw-grid\[data-layout="?split-1-2"?\]/);
  });

  it("ships visible grid rules and the debug overlay", () => {
    expect(css).toContain(".sw-grid[data-grid-rules]");
    expect(css).toContain(".sw-grid[data-grid-debug]");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @raster/css test`
Expected: FAIL — the five new layout tests fail; earlier tests still pass.

- [ ] **Step 3: Write the layout CSS**

`packages/css/src/layout/container.css`:

```css
.sw-container {
  container: raster / inline-size;
  inline-size: 100%;
  max-inline-size: calc(var(--content-max) + 2 * var(--page-margin));
  margin-inline: auto;
  padding-inline: var(--page-margin);
}

.sw-section {
  container-type: inline-size;
  padding-block: var(--space-8);
}

.sw-bleed {
  margin-inline: calc(-1 * var(--page-margin));
}
```

`packages/css/src/layout/grid.css`:

```css
.sw-grid {
  --_cols: 4;
  --_colw: calc((100% - (var(--_cols) - 1) * var(--grid-gutter)) / var(--_cols));
  display: grid;
  grid-template-columns: repeat(var(--_cols), minmax(0, 1fr));
  column-gap: var(--grid-gutter);
  row-gap: var(--grid-row-gap, var(--space-6));
}

@container (min-width: 600px) {
  .sw-grid {
    --_cols: 8;
  }
}

@container (min-width: 1024px) {
  .sw-grid {
    --_cols: 12;
  }
}

/* Columns: full width unless a span is set for the current column count. */
.sw-col {
  container-type: inline-size;
  grid-column: var(--start-4, auto) / span var(--span-4, 4);
}

@container (min-width: 600px) {
  .sw-col {
    grid-column: var(--start-8, auto) / span var(--span-8, 8);
  }
}

@container (min-width: 1024px) {
  .sw-col {
    grid-column: var(--start-12, auto) / span var(--span-12, 12);
  }
}

/* Presets: children alternate narrow / wide and stack at 4 columns. */
.sw-grid[data-layout] > * {
  grid-column: 1 / -1;
}

@container (min-width: 600px) {
  .sw-grid[data-layout="hanging"] > :nth-child(odd) {
    grid-column: 1 / span 2;
  }

  .sw-grid[data-layout="hanging"] > :nth-child(even) {
    grid-column: 3 / -1;
  }

  .sw-grid[data-layout="split-5-7"] > :nth-child(odd),
  .sw-grid[data-layout="split-1-2"] > :nth-child(odd) {
    grid-column: 1 / span 3;
  }

  .sw-grid[data-layout="split-5-7"] > :nth-child(even),
  .sw-grid[data-layout="split-1-2"] > :nth-child(even) {
    grid-column: 4 / -1;
  }
}

@container (min-width: 1024px) {
  .sw-grid[data-layout="hanging"] > :nth-child(odd) {
    grid-column: 1 / span 3;
  }

  .sw-grid[data-layout="hanging"] > :nth-child(even) {
    grid-column: 4 / -1;
  }

  .sw-grid[data-layout="split-5-7"] > :nth-child(odd) {
    grid-column: 1 / span 5;
  }

  .sw-grid[data-layout="split-5-7"] > :nth-child(even) {
    grid-column: 6 / -1;
  }

  .sw-grid[data-layout="split-1-2"] > :nth-child(odd) {
    grid-column: 1 / span 4;
  }

  .sw-grid[data-layout="split-1-2"] > :nth-child(even) {
    grid-column: 5 / -1;
  }
}

/* Visible grid: a hairline at every column start. */
.sw-grid[data-grid-rules] {
  background-image: repeating-linear-gradient(
    to right,
    var(--border) 0 1px,
    transparent 1px calc(var(--_colw) + var(--grid-gutter))
  );
}

/* Debug overlay: tinted columns. */
.sw-grid[data-grid-debug] {
  background-image: repeating-linear-gradient(
    to right,
    color-mix(in srgb, var(--accent) 10%, transparent) 0 var(--_colw),
    transparent var(--_colw) calc(var(--_colw) + var(--grid-gutter))
  );
}
```

Append to `packages/css/src/index.css`:

```css
@import "./layout/container.css" layer(raster.layout);
@import "./layout/grid.css" layer(raster.layout);
```

- [ ] **Step 4: Run tests and lint**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS, no lint output.

- [ ] **Step 5: Commit**

```bash
git add packages/css
git commit -m "feat(css): add fluid container-query grid with Swiss layout presets"
```

---

### Task 10: Stack, rule and utilities

**Files:**
- Create: `packages/css/src/layout/stack.css`, `packages/css/src/layout/rule.css`, `packages/css/src/utilities.css`
- Modify: `packages/css/src/index.css`
- Test: `packages/css/test/build.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `packages/css/test/build.test.ts`:

```ts
describe("layout: stack and rule", () => {
  it("stacks with a token gap that data-gap can change", () => {
    expect(css).toMatch(/\.sw-stack\s*\{[^}]*gap:\s*var\(--stack-gap,\s*var\(--space-4\)\)/);
    expect(css).toMatch(/\.sw-stack\[data-gap="?9"?\]\s*\{\s*--stack-gap:\s*var\(--space-9\)/);
  });

  it("draws hairline rules with strong and signal variants", () => {
    expect(css).toMatch(/\.sw-rule\s*\{[^}]*border-block-start:\s*1px solid var\(--border\)/);
    expect(css).toMatch(/\.sw-rule\[data-variant="?signal"?\][^{]*\{[^}]*var\(--brand-signal\)/);
  });
});

describe("utilities", () => {
  it("lives in the last layer", () => {
    expect(css).toMatch(/@layer raster\.utilities\s*\{[\s\S]*\.sw-type-h1/);
  });

  it("offers every type step as a class", () => {
    for (const step of ["display", "h1", "h2", "h3", "h4", "body", "caption", "label"]) {
      expect(css).toContain(`.sw-type-${step}`);
    }
  });

  it("caps the reading measure and offers screen-reader-only text", () => {
    expect(css).toMatch(/\.sw-measure\s*\{[^}]*max-inline-size:\s*66ch/);
    expect(css).toContain(".sw-sr-only");
  });

  it("offers block margin utilities for all nine spacing steps", () => {
    expect(css).toMatch(/\.sw-mbs-1\s*\{\s*margin-block-start:\s*var\(--space-1\)/);
    expect(css).toMatch(/\.sw-mbe-9\s*\{\s*margin-block-end:\s*var\(--space-9\)/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @raster/css test`
Expected: FAIL — the six new tests fail.

- [ ] **Step 3: Write the CSS**

`packages/css/src/layout/stack.css`:

```css
.sw-stack {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap, var(--space-4));
}

.sw-stack[data-direction="row"] {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

.sw-stack[data-gap="1"] { --stack-gap: var(--space-1); }
.sw-stack[data-gap="2"] { --stack-gap: var(--space-2); }
.sw-stack[data-gap="3"] { --stack-gap: var(--space-3); }
.sw-stack[data-gap="4"] { --stack-gap: var(--space-4); }
.sw-stack[data-gap="5"] { --stack-gap: var(--space-5); }
.sw-stack[data-gap="6"] { --stack-gap: var(--space-6); }
.sw-stack[data-gap="7"] { --stack-gap: var(--space-7); }
.sw-stack[data-gap="8"] { --stack-gap: var(--space-8); }
.sw-stack[data-gap="9"] { --stack-gap: var(--space-9); }
```

`packages/css/src/layout/rule.css`:

```css
.sw-rule {
  border: 0;
  border-block-start: 1px solid var(--border);
  margin-block: var(--space-6);
}

.sw-rule[data-variant="strong"] {
  border-block-start-color: var(--text-primary);
}

.sw-rule[data-variant="signal"] {
  border-block-start: 2px solid var(--brand-signal);
  inline-size: var(--space-8);
}
```

`packages/css/src/utilities.css`:

```css
.sw-type-display {
  --_size: var(--text-display-size);
  --_leading: var(--text-display-leading);
  --_weight: var(--text-display-weight);
  --_tracking: var(--text-display-tracking);
}

.sw-type-h1 {
  --_size: var(--text-h1-size);
  --_leading: var(--text-h1-leading);
  --_weight: var(--text-h1-weight);
  --_tracking: var(--text-h1-tracking);
}

.sw-type-h2 {
  --_size: var(--text-h2-size);
  --_leading: var(--text-h2-leading);
  --_weight: var(--text-h2-weight);
  --_tracking: var(--text-h2-tracking);
}

.sw-type-h3 {
  --_size: var(--text-h3-size);
  --_leading: var(--text-h3-leading);
  --_weight: var(--text-h3-weight);
  --_tracking: var(--text-h3-tracking);
}

.sw-type-h4 {
  --_size: var(--text-h4-size);
  --_leading: var(--text-h4-leading);
  --_weight: var(--text-h4-weight);
  --_tracking: var(--text-h4-tracking);
}

.sw-type-body {
  --_size: var(--text-body-size);
  --_leading: var(--text-body-leading);
  --_weight: var(--text-body-weight);
  --_tracking: var(--text-body-tracking);
}

.sw-type-caption {
  --_size: var(--text-caption-size);
  --_leading: var(--text-caption-leading);
  --_weight: var(--text-caption-weight);
  --_tracking: var(--text-caption-tracking);
}

.sw-type-label {
  --_size: var(--text-label-size);
  --_leading: var(--text-label-leading);
  --_weight: var(--text-label-weight);
  --_tracking: var(--text-label-tracking);
  font-family: var(--font-mono);
  text-transform: uppercase;
}

:is(.sw-type-display, .sw-type-h1, .sw-type-h2, .sw-type-h3, .sw-type-h4, .sw-type-body, .sw-type-caption, .sw-type-label) {
  font-size: var(--_size);
  line-height: var(--_leading);
  font-weight: var(--_weight);
  letter-spacing: var(--_tracking);
}

@supports (line-height: round(up, 1px, 4px)) {
  :is(.sw-type-display, .sw-type-h1, .sw-type-h2, .sw-type-h3, .sw-type-h4, .sw-type-body, .sw-type-caption, .sw-type-label) {
    line-height: round(nearest, calc(var(--_size) * var(--_leading)), 4px);
  }
}

.sw-mono { font-family: var(--font-mono); }
.sw-measure { max-inline-size: 66ch; }
.sw-text-secondary { color: var(--text-secondary); }
.sw-text-muted { color: var(--text-muted); }

.sw-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.sw-mbs-1 { margin-block-start: var(--space-1); }
.sw-mbs-2 { margin-block-start: var(--space-2); }
.sw-mbs-3 { margin-block-start: var(--space-3); }
.sw-mbs-4 { margin-block-start: var(--space-4); }
.sw-mbs-5 { margin-block-start: var(--space-5); }
.sw-mbs-6 { margin-block-start: var(--space-6); }
.sw-mbs-7 { margin-block-start: var(--space-7); }
.sw-mbs-8 { margin-block-start: var(--space-8); }
.sw-mbs-9 { margin-block-start: var(--space-9); }

.sw-mbe-1 { margin-block-end: var(--space-1); }
.sw-mbe-2 { margin-block-end: var(--space-2); }
.sw-mbe-3 { margin-block-end: var(--space-3); }
.sw-mbe-4 { margin-block-end: var(--space-4); }
.sw-mbe-5 { margin-block-end: var(--space-5); }
.sw-mbe-6 { margin-block-end: var(--space-6); }
.sw-mbe-7 { margin-block-end: var(--space-7); }
.sw-mbe-8 { margin-block-end: var(--space-8); }
.sw-mbe-9 { margin-block-end: var(--space-9); }
```

Append to `packages/css/src/index.css`:

```css
@import "./layout/stack.css" layer(raster.layout);
@import "./layout/rule.css" layer(raster.layout);
@import "./utilities.css" layer(raster.utilities);
```

- [ ] **Step 4: Run tests and lint**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS, no lint output.

- [ ] **Step 5: Commit**

```bash
git add packages/css
git commit -m "feat(css): add stack, rule and utility classes"
```

---

### Task 11: Playground and visual verification

**Files:**
- Create: `packages/css/playground/index.html`

- [ ] **Step 1: Write the playground**

`packages/css/playground/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Raster playground</title>
    <link rel="stylesheet" href="../node_modules/@fontsource-variable/geist/index.css" />
    <link rel="stylesheet" href="../node_modules/@fontsource-variable/geist-mono/index.css" />
    <link rel="stylesheet" href="../dist/raster.css" />
  </head>
  <body>
    <main class="sw-container sw-section">
      <div class="sw-stack" data-direction="row" data-gap="3">
        <span class="sw-type-label sw-text-secondary">Theme</span>
        <button type="button" data-set-theme="alpine">Alpine</button>
        <button type="button" data-set-theme="zurich">Zürich</button>
        <span class="sw-type-label sw-text-secondary">Mode</span>
        <button type="button" data-set-mode="">System</button>
        <button type="button" data-set-mode="light">Light</button>
        <button type="button" data-set-mode="dark">Dark</button>
        <span class="sw-type-label sw-text-secondary">Grid</span>
        <button type="button" data-toggle-debug>Toggle overlay</button>
      </div>

      <hr class="sw-rule" data-variant="signal" />

      <div class="sw-grid" data-layout="hanging" data-grid-rules>
        <p class="sw-type-label sw-text-secondary">01 / Type</p>
        <div class="sw-stack" data-gap="5">
          <p class="sw-type-display">Raster und Raum</p>
          <h1>Form follows grid</h1>
          <h2>Columns, gutters, rhythm</h2>
          <h3>A calmer hierarchy</h3>
          <h4>Section label</h4>
          <p class="sw-measure">
            Flush left, ragged right. Body copy holds a 66-character measure so lines stay readable at
            any width, and <a href="#">links use the accent colour</a>.
          </p>
          <p class="sw-type-caption sw-text-secondary">Figure 03 — Supporting text and metadata</p>
        </div>

        <p class="sw-type-label sw-text-secondary">02 / Grid</p>
        <div class="sw-grid" id="demo-grid">
          <div class="sw-col" style="--span-8: 4; --span-12: 4"><p>Span 4 of 12</p></div>
          <div class="sw-col" style="--span-8: 4; --span-12: 8"><p>Span 8 of 12</p></div>
          <div class="sw-col" style="--span-4: 2; --span-8: 2; --span-12: 3"><p>3</p></div>
          <div class="sw-col" style="--span-4: 2; --span-8: 6; --span-12: 9"><p>9</p></div>
        </div>

        <p class="sw-type-label sw-text-secondary">03 / Split 5 / 7</p>
        <div class="sw-grid" data-layout="split-5-7">
          <p>Narrow column. Stacks below 600px of container width.</p>
          <p class="sw-text-secondary">Wide column. Resize the window to see 4, 8 and 12 columns.</p>
        </div>

        <p class="sw-type-label sw-text-secondary">04 / Surfaces</p>
        <div class="sw-stack" data-direction="row" data-gap="3">
          <p class="sw-type-caption" style="background: var(--surface-subtle); padding: var(--space-4)">surface-subtle</p>
          <p class="sw-type-caption" style="background: var(--accent-subtle); color: var(--on-accent-subtle); padding: var(--space-4)">accent-subtle</p>
          <p class="sw-type-caption" style="background: var(--danger-subtle); color: var(--on-danger-subtle); padding: var(--space-4)">danger-subtle</p>
          <p class="sw-type-caption" style="background: var(--accent); color: var(--on-accent); padding: var(--space-4)">accent</p>
        </div>
      </div>
    </main>

    <script>
      const root = document.documentElement;
      document.querySelectorAll("[data-set-theme]").forEach((b) =>
        b.addEventListener("click", () => (root.dataset.theme = b.dataset.setTheme)),
      );
      document.querySelectorAll("[data-set-mode]").forEach((b) =>
        b.addEventListener("click", () => {
          if (b.dataset.setMode) root.dataset.mode = b.dataset.setMode;
          else delete root.dataset.mode;
        }),
      );
      document.querySelector("[data-toggle-debug]").addEventListener("click", () => {
        document.getElementById("demo-grid").toggleAttribute("data-grid-debug");
      });
    </script>
  </body>
</html>
```

(The inline `style` attributes are playground-only and are not linted; stylelint only checks `src/**/*.css`.)

- [ ] **Step 2: Build and serve**

Run: `pnpm build`
Expected: tokens build prints `Wrote dist/tokens.css and dist/tokens.json (2 themes, 0 contrast violations)`, then the css build prints `Wrote dist/raster.css and dist/raster.min.css`.

Run (leave it running): `python3 -m http.server 4321 --directory packages/css`
Open: `http://localhost:4321/playground/`

- [ ] **Step 3: Verify in the browser**

Check each item and fix the CSS if one fails:

1. **Type:** text renders in Geist (not a system font), and labels are uppercase Geist Mono.
2. **Heading sizes:** at a 1440px-wide window, the H1 is about 42px; at 375px it is about 33px.
3. **Grid columns:** with the overlay toggled on, the demo grid shows 12 tinted columns when wide, 8 at a medium width and 4 when narrow.
4. **Hanging layout:** labels sit in a narrow left column on wide screens and stack above content when narrow.
5. **Themes:** "Zürich" turns the page an almost-white warm tone (#FCFBF8) and the short signal rule red. "Alpine" turns the page pure white and the rule pale blue. Corner radius has no visible effect until Plan 2 adds components.
6. **Modes:** "Dark" switches every colour, and "System" follows the OS setting.
7. **Focus:** pressing Tab shows a 2px accent ring with a gap on each button.

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add packages/css/playground
git commit -m "feat(css): add foundations playground"
```

---

### Task 12: Whole-workspace verification

**Files:** none

- [ ] **Step 1: Run every gate from the root**

Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`
Expected: all succeed. Tokens: 5 test files PASS. CSS: 2 test files PASS. Lint: no output. Typecheck: no output.

- [ ] **Step 2: Confirm a clean tree**

Run: `git status --short`
Expected: no output (`dist/` and `node_modules/` are ignored).

---

## Spec coverage for this plan

| Spec section | Covered by |
|---|---|
| 2 Architecture (tokens → css, build script, DTCG JSON) | Tasks 1, 2, 6, 7, 8 |
| 3 Grid, spacing, presets, visible grid, baseline rounding | Tasks 3, 8, 9 |
| 4 Typography scale, weights, measure, hyphenation, mono labels | Tasks 3, 8, 10 |
| 5 Colour roles, themes, light-dark modes, radius, shadow, focus, contrast gate | Tasks 3, 4, 5, 6, 8 |
| 7 Motion tokens and reduced-motion durations | Tasks 3, 8 |
| 8 Zoom-safe fluid type, logical properties | Tasks 3, 8–10 (all CSS uses logical properties) |
| 10 Tokens contrast test, stylelint raw-colour guard | Tasks 4, 6, 7 |

Deferred to later plans: components (6), expressive motion (7), docs (9), React and Playwright tests (10).
