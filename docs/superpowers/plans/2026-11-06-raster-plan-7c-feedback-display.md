# Raster Plan 7c: Feedback and display

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ProgressBar, Meter, Skeleton, Banner, EmptyState, Media, Avatar, Badge, DescriptionList and Stat to Raster, with docs pages, a forced-colours screenshot suite and visual baselines.

**Architecture:** These components are static, so each React component renders plain HTML that is also the HTML route: the docs show the rendered markup as the HTML snippet, and the two routes are the same markup by construction. ProgressBar and Meter render the browser's own `<progress>` and `<meter>` elements on both routes (a change from the spec, which named React Aria's: native elements give one markup and their own semantics). Only Banner's dismiss button has behaviour.

**Tech stack:** Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1 (Button only), lucide-react, Vitest 3.2 + jsdom, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2: components for real products](../specs/2026-11-06-raster-v2-components-design.md), section 3 rows 12–21, sections 4–7.

**Branch:** `raster/plan-7c-feedback-display` (created from main after Plan 7b merged).

---

## Lessons carried from Plans 7a and 7b

- **Lightning CSS printing:** it drops default values (`currentColor` in borders), prints `transparent` as `#0000`, lower-cases system colours (`Highlight` → `highlight`; use the `i` flag), prints `:has(> .x)` as `:has( > .x)`, puts grouped selectors on one line, and may drop quotes. When a CSS test fails only because of printing, adjust the regex minimally with a comment; never weaken it.
- **React Aria types:** take `Key` and prop types from `react-aria-components`.
- **Focus timing:** React Aria restores focus a frame late; use `waitFor` / polling.
- **Forced colours removes backgrounds.** Any element drawn only with `background-color` (bars, thumbs, fills) disappears in forced-colours mode unless it gets `forced-color-adjust: none` and a system colour, or a border. Every bar in this plan has a forced-colours rule, and Task 8 proves it with screenshots.
- **Native form-control pseudo-elements** (`::-webkit-progress-value`, `::-moz-meter-bar`, etc.) survive Lightning CSS unchanged. Avoid vendor pseudo-classes such as `:-moz-meter-optimum`; style meter states through a `data-state` attribute instead.
- **YAML frontmatter:** a list item or description containing ": " must be reworded or quoted.
- **Look at the screenshots.** In Plan 7b a layout bug (a stretched segmented row) passed every test and was only caught by looking at a baseline. Every visual task here ends by opening named images.

## Conventions every task follows

- Run commands from the repository root.
- CSS goes in `packages/css/src/components/<name>.css`, imported in `packages/css/src/index.css` with `layer(raster.components)` after `slider.css`, in task order. No raw colours; system colours only inside `@media (forced-colors: active)`.
- React components forward `ref` through `ComponentPropsWithRef` and merge `className` with `cx`. They live in `packages/react/src/display/` (or `feedback/` where named) and are exported from `packages/react/src/index.ts`; add each name to `packages/react/test/exports.test.ts`.
- New React tests go in `packages/react/test/feedback.test.tsx` (create it in Task 1 with the imports shown there; later tasks add imports at the top).
- Rebuild before docs tests: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`.
- Commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/css/src/components/progress.css` | ProgressBar and Meter: head row and native bar styling, meter states, forced colours |
| `packages/css/src/components/skeleton.css` | Skeleton blocks and their pulse |
| `packages/css/src/components/banner.css` | Page-level Banner strip |
| `packages/css/src/components/empty.css` | EmptyState on a hanging layout |
| `packages/css/src/components/media.css` | Media frame with fixed ratios |
| `packages/css/src/components/avatar.css` | Avatar and Badge |
| `packages/css/src/components/facts.css` | DescriptionList and Stat |
| `packages/react/src/feedback/ProgressBar.tsx` | `ProgressBar` |
| `packages/react/src/feedback/Meter.tsx` | `Meter`, `meterState`, `meterRegion` |
| `packages/react/src/feedback/Skeleton.tsx` | `Skeleton` |
| `packages/react/src/feedback/Banner.tsx` | `Banner` |
| `packages/react/src/display/tones.ts` | Tone icons and spoken tone words, shared by Callout and Banner |
| `packages/react/src/feedback/EmptyState.tsx` | `EmptyState` |
| `packages/react/src/display/Media.tsx` | `Media` |
| `packages/react/src/display/Avatar.tsx` | `Avatar`, `initials` |
| `packages/react/src/display/Badge.tsx` | `Badge` |
| `packages/react/src/display/DescriptionList.tsx` | `DescriptionList`, `DescriptionItem` |
| `packages/react/src/display/Stat.tsx` | `Stat` |
| `apps/docs/src/demos/<component>/` and `src/content/components/*.mdx` | Ten pages in the Display group |
| `apps/docs/e2e/forced-colors.spec.ts` | Screenshots of every bar-like control in forced-colours mode |

---

### Task 1: ProgressBar and Meter

**Files:**
- Create: `packages/css/src/components/progress.css`, `packages/react/src/feedback/ProgressBar.tsx`, `packages/react/src/feedback/Meter.tsx`, `packages/react/test/feedback.test.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("progress bar and meter", () => {
  it("draw a 4px bar with the browser's appearance removed", () => {
    expect(css).toMatch(/\.sw-progress-bar,\s*\.sw-meter-bar\s*\{[^}]*appearance:\s*none[^}]*block-size:\s*4px/);
  });

  it("fill the progress value with the accent in every engine", () => {
    expect(css).toMatch(/\.sw-progress-bar::-webkit-progress-value\s*\{[^}]*background-color:\s*var\(--accent\)/);
    expect(css).toMatch(/\.sw-progress-bar::-moz-progress-bar\s*\{[^}]*background-color:\s*var\(--accent\)/);
  });

  it("colour the meter by data-state, not by vendor pseudo-classes", () => {
    expect(rule('.sw-meter-bar[data-state="optimum"]')).toMatch(/--_meter-fill:\s*var\(--success\)/);
    expect(rule('.sw-meter-bar[data-state="suboptimum"]')).toMatch(/--_meter-fill:\s*var\(--warning\)/);
    expect(rule('.sw-meter-bar[data-state="poor"]')).toMatch(/--_meter-fill:\s*var\(--danger\)/);
    expect(css).not.toMatch(/-moz-meter-(optimum|sub)/);
  });

  it("keep bars visible in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-progress-bar::-webkit-progress-value[\s\S]*?background-color:\s*highlight/i);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-meter-bar::-moz-meter-bar[\s\S]*?background-color:\s*highlight/i);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/progress.css`:

```css
/*
 * ProgressBar and Meter render the browser's own <progress> and <meter> on both routes.
 * The head row holds the label and the value in mono; the bar is a 4px line on the hairline colour.
 */
.sw-progress-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.sw-progress-value {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.sw-meter-word {
  color: var(--text-primary);
  font-weight: 500;
}

.sw-progress-bar,
.sw-meter-bar {
  appearance: none;
  display: block;
  inline-size: 100%;
  block-size: 4px;
  margin: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: none;
  background-color: var(--border);
}

/* Progress */
.sw-progress-bar::-webkit-progress-bar {
  background-color: var(--border);
}

.sw-progress-bar::-webkit-progress-value {
  background-color: var(--accent);
}

.sw-progress-bar::-moz-progress-bar {
  background-color: var(--accent);
}

/* Meter: the state comes from data-state, so the colour always matches the word beside it. */
.sw-meter-bar::-webkit-meter-bar {
  block-size: 4px;
  border: 0;
  border-radius: 0;
  background: none;
  background-color: var(--border);
}

.sw-meter-bar::-webkit-meter-optimum-value,
.sw-meter-bar::-webkit-meter-suboptimum-value,
.sw-meter-bar::-webkit-meter-even-less-good-value {
  background: none;
  background-color: var(--_meter-fill, var(--accent));
}

.sw-meter-bar::-moz-meter-bar {
  background: none;
  background-color: var(--_meter-fill, var(--accent));
}

.sw-meter-bar[data-state="optimum"] {
  --_meter-fill: var(--success);
}

.sw-meter-bar[data-state="suboptimum"] {
  --_meter-fill: var(--warning);
}

.sw-meter-bar[data-state="poor"] {
  --_meter-fill: var(--danger);
}

/* Forced colours drop backgrounds: the track becomes a CanvasText outline, the fill Highlight. */
@media (forced-colors: active) {
  .sw-progress-bar,
  .sw-meter-bar {
    forced-color-adjust: none;
    background-color: Canvas;
    outline: 1px solid CanvasText;
  }

  .sw-progress-bar::-webkit-progress-bar,
  .sw-meter-bar::-webkit-meter-bar {
    background-color: Canvas;
  }

  .sw-progress-bar::-webkit-progress-value,
  .sw-meter-bar::-webkit-meter-optimum-value,
  .sw-meter-bar::-webkit-meter-suboptimum-value,
  .sw-meter-bar::-webkit-meter-even-less-good-value {
    background-color: Highlight;
  }

  .sw-progress-bar::-moz-progress-bar,
  .sw-meter-bar::-moz-meter-bar {
    background-color: Highlight;
  }
}
```

Import it in `packages/css/src/index.css` after `slider.css`:

```css
@import "./components/progress.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** Create `packages/react/test/feedback.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Meter, meterRegion, meterState } from "../src/feedback/Meter";
import { ProgressBar } from "../src/feedback/ProgressBar";
import { expectAccessible } from "./axe";

describe("ProgressBar", () => {
  it("renders a labelled native progress element with the percentage beside the label", () => {
    const { container } = render(<ProgressBar label="Uploading proofs" value={40} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-progress");
    const bar = screen.getByRole("progressbar", { name: "Uploading proofs" });
    expect(bar.tagName).toBe("PROGRESS");
    expect(bar).toHaveClass("sw-progress-bar");
    expect(bar).toHaveAttribute("value", "40");
    expect(bar).toHaveAttribute("max", "100");
    expect(container.querySelector(".sw-progress-value")).toHaveTextContent("40%");
    expect(container.querySelector(".sw-progress-value")).toHaveAttribute("aria-hidden", "true");
  });

  it("maps a custom range onto the element's zero-based scale and accepts a value label", () => {
    render(<ProgressBar label="Pages" value={12} minValue={2} maxValue={22} valueLabel="12 of 22 pages" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("value", "10");
    expect(bar).toHaveAttribute("max", "20");
    expect(bar).toHaveAttribute("aria-valuetext", "12 of 22 pages");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<ProgressBar label="Uploading proofs" value={40} />);
    await expectAccessible(container);
  });
});

describe("meterState", () => {
  const range = { min: 0, max: 100, low: 30, high: 80 };

  it("prefers the middle when the optimum is in the middle", () => {
    expect(meterState(50, { ...range, optimum: 50 })).toBe("optimum");
    expect(meterState(90, { ...range, optimum: 50 })).toBe("suboptimum");
    expect(meterState(10, { ...range, optimum: 50 })).toBe("suboptimum");
  });

  it("prefers low values when the optimum is low", () => {
    expect(meterState(10, { ...range, optimum: 0 })).toBe("optimum");
    expect(meterState(50, { ...range, optimum: 0 })).toBe("suboptimum");
    expect(meterState(90, { ...range, optimum: 0 })).toBe("poor");
  });

  it("prefers high values when the optimum is high", () => {
    expect(meterState(90, { ...range, optimum: 100 })).toBe("optimum");
    expect(meterState(10, { ...range, optimum: 100 })).toBe("poor");
  });

  it("names the region a value falls in", () => {
    expect(meterRegion(10, 30, 80)).toBe("low");
    expect(meterRegion(50, 30, 80)).toBe("medium");
    expect(meterRegion(90, 30, 80)).toBe("high");
  });
});

describe("Meter", () => {
  it("renders a labelled native meter whose state and word agree", () => {
    const { container } = render(<Meter label="Storage" value={86} low={30} high={80} optimum={0} />);
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter.tagName).toBe("METER");
    expect(meter).toHaveClass("sw-meter-bar");
    expect(meter).toHaveAttribute("data-state", "poor");
    expect(meter).toHaveAttribute("aria-valuetext", "86%, High");
    expect(container.querySelector(".sw-meter-word")).toHaveTextContent("High");
  });

  it("shows no word in the middle region", () => {
    const { container } = render(<Meter label="Storage" value={50} low={30} high={80} optimum={0} />);
    expect(container.querySelector(".sw-meter-word")).toBeNull();
    expect(screen.getByRole("meter")).toHaveAttribute("data-state", "suboptimum");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Meter label="Storage" value={86} low={30} high={80} optimum={0} />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- feedback`
Expected: FAIL, cannot resolve `../src/feedback/Meter`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/feedback/ProgressBar.tsx`:

```tsx
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type ProgressBarProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  value: number;
  /** Defaults to 0. */
  minValue?: number;
  /** Defaults to 100. */
  maxValue?: number;
  /** Text shown beside the label and announced instead of the percentage, such as "12 of 22 pages". */
  valueLabel?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * How far a task has got, when its length is known. Renders a native <progress>, so the HTML
 * route is the same markup. For waits of unknown length, use Skeleton.
 */
export function ProgressBar({ label, value, minValue = 0, maxValue = 100, valueLabel, className, ...rest }: ProgressBarProps) {
  const id = useId();
  const span = Math.max(maxValue - minValue, 1);
  const position = clamp(value, minValue, maxValue) - minValue;
  const percent = Math.round((position / span) * 100);
  return (
    <div className={cx("sw-field sw-progress", className)} {...rest}>
      <div className="sw-progress-head">
        <label className="sw-field-label" htmlFor={id}>
          {label}
        </label>
        <span className="sw-progress-value" aria-hidden="true">
          {valueLabel ?? `${percent}%`}
        </span>
      </div>
      <progress className="sw-progress-bar" id={id} value={position} max={span} aria-valuetext={valueLabel}>
        {valueLabel ?? `${percent}%`}
      </progress>
    </div>
  );
}
```

Create `packages/react/src/feedback/Meter.tsx`:

```tsx
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type MeterState = "optimum" | "suboptimum" | "poor";
export type MeterRegion = "low" | "medium" | "high";

/** Which region of the range a value is in: below low, between low and high, or above high. */
export function meterRegion(value: number, low: number, high: number): MeterRegion {
  if (value < low) return "low";
  if (value > high) return "high";
  return "medium";
}

/** The HTML meter algorithm: how good a value is, given where the optimum lies. */
export function meterState(
  value: number,
  { min, max, low = min, high = max, optimum = (min + max) / 2 }: { min: number; max: number; low?: number; high?: number; optimum?: number },
): MeterState {
  const region = meterRegion(value, low, high);
  const preferred = meterRegion(optimum, low, high);
  if (region === preferred) return "optimum";
  if (preferred === "medium" || region === "medium") return "suboptimum";
  return "poor";
}

export type MeterProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  value: number;
  /** Defaults to 0. */
  minValue?: number;
  /** Defaults to 100. */
  maxValue?: number;
  /** Below this the value is "low". */
  low?: number;
  /** Above this the value is "high". */
  high?: number;
  /** The best value; decides whether low or high is good. Defaults to the middle. */
  optimum?: number;
  /** Text for the value, such as "86 GB"; defaults to a percentage. */
  valueLabel?: string;
  /** Words shown outside the middle region. Defaults to "Low" and "High". */
  regionLabels?: { low?: string; high?: string };
};

/**
 * A measurement within a known range, such as storage used. Renders a native <meter>; outside the
 * middle region a word ("High", "Low") is shown beside the value, so the state is never colour alone.
 */
export function Meter({
  label,
  value,
  minValue = 0,
  maxValue = 100,
  low,
  high,
  optimum,
  valueLabel,
  regionLabels,
  className,
  ...rest
}: MeterProps) {
  const id = useId();
  const lo = low ?? minValue;
  const hi = high ?? maxValue;
  const region = meterRegion(value, lo, hi);
  const word = region === "low" ? (regionLabels?.low ?? "Low") : region === "high" ? (regionLabels?.high ?? "High") : undefined;
  const state = meterState(value, { min: minValue, max: maxValue, low: lo, high: hi, optimum });
  const text = valueLabel ?? `${Math.round(((value - minValue) / Math.max(maxValue - minValue, 1)) * 100)}%`;
  return (
    <div className={cx("sw-field sw-progress sw-meter", className)} {...rest}>
      <div className="sw-progress-head">
        <label className="sw-field-label" htmlFor={id}>
          {label}
        </label>
        <span className="sw-progress-value" aria-hidden="true">
          {text}
          {word && <span className="sw-meter-word"> · {word}</span>}
        </span>
      </div>
      <meter
        className="sw-meter-bar"
        id={id}
        value={value}
        min={minValue}
        max={maxValue}
        low={low}
        high={high}
        optimum={optimum}
        data-state={state}
        aria-valuetext={word ? `${text}, ${word}` : text}
      >
        {text}
      </meter>
    </div>
  );
}
```

Export them in `packages/react/src/index.ts` (after the Slider export):

```ts
export { Meter, type MeterProps, type MeterRegion, meterRegion, type MeterState, meterState } from "./feedback/Meter";
export { ProgressBar, type ProgressBarProps } from "./feedback/ProgressBar";
```

Add `"ProgressBar", "Meter", "meterState", "meterRegion",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. jsdom maps `<meter>` to the meter role and `<progress>` to progressbar; if its role mapping lags, query the elements by tag within the field and keep the name assertions via `toHaveAccessibleName`.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: ProgressBar and Meter on native progress and meter elements"
```

---

### Task 2: Skeleton and Banner

**Files:**
- Create: `packages/css/src/components/skeleton.css`, `packages/css/src/components/banner.css`
- Create: `packages/react/src/feedback/Skeleton.tsx`, `packages/react/src/feedback/Banner.tsx`, `packages/react/src/display/tones.ts`
- Modify: `packages/react/src/display/Callout.tsx`, `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/feedback.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("skeleton", () => {
  it("is a static block on the subtle surface that pulses only with full motion", () => {
    expect(rule(".sw-skeleton")).toMatch(/background-color:\s*var\(--surface-subtle\)/);
    expect(rule(".sw-skeleton")).toMatch(/animation:\s*sw-skeleton-pulse/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-skeleton\s*\{[^}]*animation:\s*none/);
    expect(css).not.toMatch(/\.sw-skeleton[^{]*\{[^}]*gradient/);
  });

  it("stays visible in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-skeleton\s*\{[^}]*border:\s*1px solid canvastext/i);
  });
});

describe("banner", () => {
  it("is a full-width strip with a 4px leading rule in the tone colour", () => {
    expect(rule(".sw-banner")).toMatch(/border-inline-start:\s*4px solid var\(--_tone\)/);
    expect(rule('.sw-banner[data-tone="danger"]')).toMatch(/--_tone:\s*var\(--danger\)/);
  });

  it("aligns its content with the page's content width", () => {
    expect(rule(".sw-banner-inner")).toMatch(/max-inline-size:\s*calc\(var\(--content-max\) \+ 2 \* var\(--page-margin\)\)/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/skeleton.css`:

```css
/*
 * Skeleton: placeholder blocks while content loads. Mark them aria-hidden and put aria-busy="true"
 * on the region that is loading. No shimmer gradient: a slow opacity pulse, off under reduced motion.
 */
.sw-skeleton {
  display: block;
  inline-size: 100%;
  block-size: 1rem;
  border-radius: var(--radius);
  background-color: var(--surface-subtle);
  animation: sw-skeleton-pulse 1.6s var(--ease-linear) infinite;
}

.sw-skeleton[data-shape="text"] {
  block-size: 0.75rem;
  margin-block: 0.375rem;
}

.sw-skeleton[data-shape="heading"] {
  block-size: 1.5rem;
  margin-block: 0.5rem;
}

.sw-skeleton[data-shape="block"] {
  block-size: auto;
  aspect-ratio: 16 / 9;
}

@keyframes sw-skeleton-pulse {
  50% {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sw-skeleton {
    animation: none;
  }
}

[data-motion="reduce"] .sw-skeleton {
  animation: none;
}

@media (forced-colors: active) {
  .sw-skeleton {
    border: 1px solid CanvasText;
  }
}
```

Create `packages/css/src/components/banner.css`:

```css
/*
 * Banner: a page-level message strip below the header, never over content. The tone is carried by a
 * 4px leading rule, an icon and a spoken tone word, never by colour alone.
 */
.sw-banner {
  --_tone: var(--accent);
  border-block-end: 1px solid var(--border);
  border-inline-start: 4px solid var(--_tone);
  background-color: var(--surface-subtle);
  color: var(--text-primary);
}

.sw-banner[data-tone="success"] {
  --_tone: var(--success);
}

.sw-banner[data-tone="warning"] {
  --_tone: var(--warning);
}

.sw-banner[data-tone="danger"] {
  --_tone: var(--danger);
}

.sw-banner-inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: var(--space-3);
  max-inline-size: calc(var(--content-max) + 2 * var(--page-margin));
  margin-inline: auto;
  padding-block: var(--space-3);
  padding-inline: var(--page-margin);
}

.sw-banner-inner > svg {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin-block-start: 0.125em;
  color: var(--_tone);
  stroke-width: 1.5;
}

.sw-banner-body {
  min-inline-size: 0;
}

.sw-banner-title {
  margin: 0;
  font-weight: 500;
}

.sw-banner-body > :not(:first-child, .sw-sr-only + *) {
  margin-block-start: var(--space-1);
}

.sw-banner-body > p {
  margin-block-end: 0;
}

.sw-banner-dismiss {
  margin-block: calc(-1 * var(--space-2));
}
```

Import both after `progress.css`:

```css
@import "./components/skeleton.css" layer(raster.components);
@import "./components/banner.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Share the tones.** Create `packages/react/src/display/tones.ts`:

```ts
import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint } from "lucide-react";

export type Tone = "info" | "success" | "warning" | "danger";

export const TONE_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

/** Read before the content so tone never relies on colour or icon alone. */
export const TONE_WORDS: Record<Tone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  danger: "Error",
};
```

In `packages/react/src/display/Callout.tsx`, replace the lucide import, the `ICONS` constant and the `TONE_WORDS` constant with an import of the shared ones, keeping `CalloutTone` as an alias:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";
import { type Tone, TONE_ICONS, TONE_WORDS } from "./tones";

export type CalloutTone = Tone;
```

and change `const Icon = ICONS[tone];` to `const Icon = TONE_ICONS[tone];`. The existing Callout tests must still pass unchanged.

- [ ] **Step 6: Write the failing React tests.** In `packages/react/test/feedback.test.tsx`, add `import userEvent from "@testing-library/user-event";`, `import { vi } from "vitest";` (merge into the existing vitest import), `import { Banner } from "../src/feedback/Banner";` and `import { Skeleton } from "../src/feedback/Skeleton";`, then append:

```tsx
describe("Skeleton", () => {
  it("renders a hidden placeholder of the chosen shape and width", () => {
    const { container } = render(<Skeleton shape="heading" width="60%" />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveClass("sw-skeleton");
    expect(block).toHaveAttribute("data-shape", "heading");
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block.style.inlineSize).toBe("60%");
  });
});

describe("Banner", () => {
  it("is a status strip with a tone, an icon and a spoken tone word", () => {
    const { container } = render(<Banner title="Scheduled maintenance">The studio site is read-only on Sunday.</Banner>);
    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("sw-banner");
    expect(banner).toHaveAttribute("data-tone", "info");
    expect(container.querySelector(".sw-banner-inner > svg")).toHaveAttribute("aria-hidden", "true");
    expect(banner).toHaveTextContent("Note:");
    expect(container.querySelector(".sw-banner-title")).toHaveTextContent("Scheduled maintenance");
  });

  it("uses the alert role for danger", () => {
    render(<Banner tone="danger">Payments are failing.</Banner>);
    expect(screen.getByRole("alert")).toHaveAttribute("data-tone", "danger");
  });

  it("can be dismissed, telling its owner and moving focus to the main content", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <>
        <Banner onDismiss={onDismiss}>New projects are online.</Banner>
        <main id="main" tabIndex={-1}>
          Content
        </main>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Banner title="Scheduled maintenance">Read-only on Sunday.</Banner>);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 7: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- feedback`
Expected: FAIL, cannot resolve `../src/feedback/Banner`.

- [ ] **Step 8: Write the components.** Create `packages/react/src/feedback/Skeleton.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type SkeletonProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  /** "text" (default) for a line of body text, "heading", or "block" for media at 16:9. */
  shape?: "text" | "heading" | "block";
  /** Any CSS length, such as "60%". Defaults to the full width. */
  width?: string;
};

/** A placeholder while content loads. Put aria-busy="true" on the region that is loading. */
export function Skeleton({ shape = "text", width, className, style, ...rest }: SkeletonProps) {
  return (
    <span
      className={cx("sw-skeleton", className)}
      data-shape={shape}
      aria-hidden="true"
      style={width ? { ...style, inlineSize: width } : style}
      {...rest}
    />
  );
}
```

Create `packages/react/src/feedback/Banner.tsx`:

```tsx
import { type ComponentPropsWithRef, type ReactNode, useState } from "react";
import { Button } from "../actions/Button";
import { type Tone, TONE_ICONS, TONE_WORDS } from "../display/tones";
import { cx } from "../utils/cx";

export type BannerProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: Tone;
  title?: ReactNode;
  /** Shows a dismiss button; called after the banner hides. */
  onDismiss?: () => void;
  /** Text of the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  /** Where focus goes after dismissing, as a selector. Defaults to "#main". */
  focusAfterDismiss?: string;
};

/**
 * A page-level message strip, placed below the header. Danger uses the alert role; the other tones
 * use status. Without React the same markup works, minus the dismiss button.
 */
export function Banner({
  tone = "info",
  title,
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  focusAfterDismiss = "#main",
  className,
  ...rest
}: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const Icon = TONE_ICONS[tone];
  return (
    <div className={cx("sw-banner", className)} data-tone={tone} role={tone === "danger" ? "alert" : "status"} {...rest}>
      <div className="sw-banner-inner">
        <Icon aria-hidden="true" strokeWidth={1.5} />
        <div className="sw-banner-body">
          <span className="sw-sr-only">{TONE_WORDS[tone]}:</span>
          {title != null && title !== false && <p className="sw-banner-title">{title}</p>}
          {children}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            className="sw-banner-dismiss"
            onPress={() => {
              setDismissed(true);
              onDismiss();
              document.querySelector<HTMLElement>(focusAfterDismiss)?.focus();
            }}
          >
            {dismissLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
```

Export them after the ProgressBar export:

```ts
export { Banner, type BannerProps } from "./feedback/Banner";
export { Skeleton, type SkeletonProps } from "./feedback/Skeleton";
export type { Tone } from "./display/tones";
```

Add `"Banner", "Skeleton",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 9: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS, including the existing Callout tests.

- [ ] **Step 10: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: Skeleton and Banner; Callout and Banner share their tone icons and words"
```

---
### Task 3: EmptyState and Media

**Files:**
- Create: `packages/css/src/components/empty.css`, `packages/css/src/components/media.css`
- Create: `packages/react/src/feedback/EmptyState.tsx`, `packages/react/src/display/Media.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/feedback.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("empty state", () => {
  it("hangs its label in a narrow column once its container is 600px wide", () => {
    expect(css).toMatch(/@container \(min-width: 600px\)\s*\{[\s\S]*?\.sw-empty\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*3fr\)/);
  });

  it("caps its text at the reading measure", () => {
    expect(rule(".sw-empty-text")).toMatch(/max-inline-size:\s*66ch/);
  });
});

describe("media", () => {
  it("frames media at a fixed ratio so the page does not shift as it loads", () => {
    expect(rule(".sw-media-frame")).toMatch(/aspect-ratio:\s*var\(--_ratio,\s*16 \/ 9\)/);
    expect(rule('.sw-media[data-ratio="4:3"]')).toMatch(/--_ratio:\s*4 \/ 3/);
    expect(rule('.sw-media[data-ratio="21:9"]')).toMatch(/--_ratio:\s*21 \/ 9/);
  });

  it("covers the frame with the image, video or drawing", () => {
    expect(css).toMatch(/\.sw-media-frame > :is\(img,\s*video,\s*svg,\s*iframe\)\s*\{[^}]*object-fit:\s*cover/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/empty.css`:

```css
/*
 * EmptyState: what to do when there is nothing to show. A mono label, a short heading, one sentence
 * and one action. On a container of 600px or more the label hangs in its own column.
 */
.sw-empty {
  display: grid;
  gap: var(--space-4) var(--grid-gutter);
  align-items: start;
  padding-block: var(--space-8);
}

.sw-empty-label {
  margin: 0;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

.sw-empty-title {
  margin: 0;
}

.sw-empty-text {
  max-inline-size: 66ch;
  margin: 0;
  color: var(--text-secondary);
}

.sw-empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-block-start: var(--space-2);
}

@container (min-width: 600px) {
  .sw-empty {
    grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
  }

  .sw-empty-label {
    grid-row: 1 / span 3;
  }

  .sw-empty > :not(.sw-empty-label) {
    grid-column: 2;
  }
}
```

Create `packages/css/src/components/media.css`:

```css
/* Media: an image, video or drawing in a frame of fixed ratio, with an optional caption below. */
.sw-media-frame {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  background-color: var(--surface-subtle);
  aspect-ratio: var(--_ratio, 16 / 9);
}

.sw-media[data-ratio="1:1"] {
  --_ratio: 1 / 1;
}

.sw-media[data-ratio="4:3"] {
  --_ratio: 4 / 3;
}

.sw-media[data-ratio="3:2"] {
  --_ratio: 3 / 2;
}

.sw-media[data-ratio="16:9"] {
  --_ratio: 16 / 9;
}

.sw-media[data-ratio="21:9"] {
  --_ratio: 21 / 9;
}

.sw-media-frame > :is(img, video, svg, iframe) {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  border: 0;
  object-fit: cover;
}
```

Import both after `banner.css`:

```css
@import "./components/empty.css" layer(raster.components);
@import "./components/media.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/feedback.test.tsx`, add `import { EmptyState } from "../src/feedback/EmptyState";` and `import { Media } from "../src/display/Media";`, then append:

```tsx
describe("EmptyState", () => {
  it("renders a label, a heading at the chosen level, a sentence and an action", () => {
    const { container } = render(
      <EmptyState label="Projects" title="No projects match" headingLevel={3} action={<a href="/work/">Clear filters</a>}>
        Try fewer disciplines, or show every year.
      </EmptyState>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("sw-empty");
    expect(root.querySelector(".sw-empty-label")).toHaveTextContent("Projects");
    expect(screen.getByRole("heading", { level: 3, name: "No projects match" })).toHaveClass("sw-empty-title");
    expect(root.querySelector(".sw-empty-text")).toHaveTextContent("Try fewer disciplines");
    expect(root.querySelector(".sw-empty-actions")).toContainElement(screen.getByRole("link", { name: "Clear filters" }));
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<EmptyState title="No projects match">Try fewer filters.</EmptyState>);
    await expectAccessible(container);
  });
});

describe("Media", () => {
  it("frames its child at the chosen ratio with a caption", () => {
    const { container } = render(
      <Media ratio="4:3" caption="Linie 7, platform signs.">
        <img src="/sign.jpg" alt="A platform sign" />
      </Media>,
    );
    const figure = container.firstElementChild as HTMLElement;
    expect(figure.tagName).toBe("FIGURE");
    expect(figure).toHaveClass("sw-figure", "sw-media");
    expect(figure).toHaveAttribute("data-ratio", "4:3");
    expect(figure.querySelector(".sw-media-frame > img")).toHaveAttribute("alt", "A platform sign");
    expect(figure.querySelector("figcaption")).toHaveTextContent("Linie 7, platform signs.");
  });

  it("defaults to 16:9 and leaves out the caption when none is given", () => {
    const { container } = render(
      <Media>
        <img src="/a.jpg" alt="" />
      </Media>,
    );
    expect(container.firstElementChild).toHaveAttribute("data-ratio", "16:9");
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- feedback`
Expected: FAIL, cannot resolve `../src/feedback/EmptyState`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/feedback/EmptyState.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type EmptyStateProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  /** A short mono label for the area, such as "Projects". */
  label?: ReactNode;
  title: ReactNode;
  /** Defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** One sentence: what happened and what to do. */
  children?: ReactNode;
  /** One action, such as a button or link. */
  action?: ReactNode;
};

/** What to show when there is nothing to show. Keep it to one sentence and one action. */
export function EmptyState({ label, title, headingLevel = 2, children, action, className, ...rest }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as "h2";
  return (
    <div className={cx("sw-empty", className)} {...rest}>
      {label != null && <p className="sw-empty-label">{label}</p>}
      <Heading className="sw-empty-title sw-type-h3">{title}</Heading>
      {children != null && <p className="sw-empty-text">{children}</p>}
      {action != null && <div className="sw-empty-actions">{action}</div>}
    </div>
  );
}
```

Create `packages/react/src/display/Media.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type MediaRatio = "1:1" | "4:3" | "3:2" | "16:9" | "21:9";

export type MediaProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  /** Defaults to "16:9". */
  ratio?: MediaRatio;
  caption?: ReactNode;
  /** One <img>, <video>, <svg> or <iframe>; it covers the frame. */
  children: ReactNode;
};

/** An image, video or drawing in a frame of fixed ratio, so the page does not shift as it loads. */
export function Media({ ratio = "16:9", caption, children, className, ...rest }: MediaProps) {
  return (
    <figure className={cx("sw-figure sw-media", className)} data-ratio={ratio} {...rest}>
      <div className="sw-media-frame">{children}</div>
      {caption != null && <figcaption className="sw-type-caption sw-text-secondary">{caption}</figcaption>}
    </figure>
  );
}
```

Export them after the Skeleton export:

```ts
export { EmptyState, type EmptyStateProps } from "./feedback/EmptyState";
export { Media, type MediaProps, type MediaRatio } from "./display/Media";
```

Add `"EmptyState", "Media",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: EmptyState on a hanging layout and Media at fixed ratios"
```

---

### Task 4: Avatar and Badge

**Files:**
- Create: `packages/css/src/components/avatar.css`, `packages/react/src/display/Avatar.tsx`, `packages/react/src/display/Badge.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/feedback.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("avatar and badge", () => {
  it("draws the avatar square with the theme radius, never a circle", () => {
    const r = rule(".sw-avatar");
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(rule('.sw-avatar[data-size="lg"]')).toMatch(/--_size:\s*3\.5rem/);
  });

  it("sets badges in tabular mono figures with the theme radius", () => {
    const r = rule(".sw-badge");
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(rule('.sw-badge[data-tone="danger"]')).toMatch(/background-color:\s*var\(--danger\)/);
  });

  it("keeps avatars and badges outlined in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-avatar,\s*\.sw-badge\s*\{[^}]*border:\s*1px solid canvastext/i);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/avatar.css`:

```css
/* Avatar: an image or initials in a square with the theme radius (full rounding is reserved). */
.sw-avatar {
  --_size: 2.5rem;
  display: inline-grid;
  flex: none;
  place-items: center;
  inline-size: var(--_size);
  block-size: var(--_size);
  overflow: hidden;
  border-radius: var(--radius);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
  font-family: var(--font-mono);
  font-size: calc(var(--_size) * 0.38);
  line-height: 1;
  user-select: none;
}

.sw-avatar[data-size="sm"] {
  --_size: 2rem;
}

.sw-avatar[data-size="lg"] {
  --_size: 3.5rem;
}

.sw-avatar > img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

/* Badge: a small count or status marker. A count always carries a text equivalent. */
.sw-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.25rem;
  block-size: 1.25rem;
  padding-inline: var(--space-1);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-subtle);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.sw-badge[data-tone="accent"] {
  border-color: transparent;
  background-color: var(--accent);
  color: var(--on-accent);
}

.sw-badge[data-tone="danger"] {
  border-color: transparent;
  background-color: var(--danger);
  color: var(--on-danger);
}

@media (forced-colors: active) {
  .sw-avatar,
  .sw-badge {
    border: 1px solid CanvasText;
  }
}
```

Import it after `media.css`:

```css
@import "./components/avatar.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/feedback.test.tsx`, add `import { Avatar, initials } from "../src/display/Avatar";` and `import { Badge } from "../src/display/Badge";`, then append:

```tsx
describe("initials", () => {
  it("takes the first letters of the first and last words, at most two", () => {
    expect(initials("Lea Brunner")).toBe("LB");
    expect(initials("Anouk van der Meier")).toBe("AM");
    expect(initials("Lea")).toBe("L");
    expect(initials("  élodie   roux ")).toBe("ÉR");
  });
});

describe("Avatar", () => {
  it("shows initials named for screen readers when there is no image", () => {
    render(<Avatar name="Lea Brunner" size="lg" />);
    const avatar = screen.getByRole("img", { name: "Lea Brunner" });
    expect(avatar).toHaveClass("sw-avatar");
    expect(avatar).toHaveAttribute("data-size", "lg");
    expect(avatar).toHaveTextContent("LB");
  });

  it("shows an image with the name as its text alternative", () => {
    render(<Avatar name="Lea Brunner" src="/lea.jpg" />);
    expect(screen.getByRole("img", { name: "Lea Brunner" })).toHaveAttribute("src", "/lea.jpg");
  });

  it("hides itself when a visible name sits beside it", () => {
    const { container } = render(<Avatar name="Lea Brunner" decorative />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("Badge", () => {
  it("shows a count with a text equivalent for screen readers", () => {
    const { container } = render(<Badge label="3 unread messages">3</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toHaveClass("sw-badge");
    expect(badge).toHaveAttribute("data-tone", "neutral");
    expect(badge.querySelector('[aria-hidden="true"]')).toHaveTextContent("3");
    expect(badge.querySelector(".sw-sr-only")).toHaveTextContent("3 unread messages");
  });

  it("accepts a tone and plain text without a label", () => {
    const { container } = render(<Badge tone="danger">New</Badge>);
    expect(container.firstElementChild).toHaveAttribute("data-tone", "danger");
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- feedback`
Expected: FAIL, cannot resolve `../src/display/Avatar`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/display/Avatar.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

/** The first letters of the first and last words of a name, upper-cased: "Lea Brunner" → "LB". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase();
}

export type AvatarProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  /** The person's name: the text alternative, and the source of the initials. */
  name: string;
  /** A photo. Without one, initials are shown. */
  src?: string;
  /** "sm" (32px), "md" (40px, the default) or "lg" (56px). */
  size?: "sm" | "md" | "lg";
  /** Hide from screen readers when the name is shown as text beside the avatar. */
  decorative?: boolean;
};

export function Avatar({ name, src, size = "md", decorative = false, className, ...rest }: AvatarProps) {
  if (src) {
    return (
      <span className={cx("sw-avatar", className)} data-size={size} aria-hidden={decorative || undefined} {...rest}>
        <img src={src} alt={decorative ? "" : name} />
      </span>
    );
  }
  return (
    <span
      className={cx("sw-avatar", className)}
      data-size={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      {...rest}
    >
      {initials(name)}
    </span>
  );
}
```

Create `packages/react/src/display/Badge.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
  /** "neutral" (default), "accent" or "danger". */
  tone?: "neutral" | "accent" | "danger";
  /** What a count means, read instead of the bare number: "3 unread messages". */
  label?: string;
  children: ReactNode;
};

/** A small count or status marker. Give counts a label, so "3" is never read without its meaning. */
export function Badge({ tone = "neutral", label, children, className, ...rest }: BadgeProps) {
  return (
    <span className={cx("sw-badge", className)} data-tone={tone} {...rest}>
      {label ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sw-sr-only">{label}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}
```

Export them after the Media export:

```ts
export { Avatar, type AvatarProps, initials } from "./display/Avatar";
export { Badge, type BadgeProps } from "./display/Badge";
```

Add `"Avatar", "initials", "Badge",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: square Avatar with initials and Badge with a text equivalent"
```

---

### Task 5: DescriptionList and Stat

**Files:**
- Create: `packages/css/src/components/facts.css`, `packages/react/src/display/DescriptionList.tsx`, `packages/react/src/display/Stat.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/feedback.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("description list and stat", () => {
  it("lays out facts as hairline-topped cells with mono terms", () => {
    expect(rule(".sw-dl-item")).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
    expect(rule(".sw-dl dt")).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("sets the stat value large and light over a signal rule", () => {
    expect(rule(".sw-stat")).toMatch(/border-block-start:\s*2px solid var\(--brand-signal\)/);
    const value = rule(".sw-stat-value");
    expect(value).toMatch(/font-size:\s*var\(--text-h1-size\)/);
    expect(value).toMatch(/font-weight:\s*300/);
  });

  it("keeps the change neutral in colour and mirrors its arrow in RTL", () => {
    expect(rule(".sw-stat-change")).toMatch(/color:\s*var\(--text-secondary\)/);
    expect(css).toMatch(/\.sw-stat-change svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/facts.css`:

```css
/* DescriptionList: facts as hairline-topped cells, mono terms over values. */
.sw-dl {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
  gap: var(--space-5) var(--grid-gutter);
  margin: 0;
}

.sw-dl-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-block-start: var(--space-3);
  border-block-start: 1px solid var(--border);
}

.sw-dl dt {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

.sw-dl dd {
  margin: 0;
}

/*
 * Stat: one figure with its label, over a signal rule. A change shows a sign, an arrow and a phrase;
 * its colour stays neutral, because "down" is not always bad.
 */
.sw-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block-start: var(--space-4);
  border-block-start: 2px solid var(--brand-signal);
}

.sw-stat-value {
  font-size: var(--text-h1-size);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: var(--text-h1-tracking);
  font-variant-numeric: tabular-nums;
}

.sw-stat-label {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

.sw-stat-change {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-secondary);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
}

.sw-stat-change svg {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

.sw-stat-change svg:dir(rtl) {
  transform: scaleX(-1);
}
```

Import it after `avatar.css`:

```css
@import "./components/facts.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/feedback.test.tsx`, add `import { DescriptionItem, DescriptionList } from "../src/display/DescriptionList";` and `import { Stat } from "../src/display/Stat";`, then append:

```tsx
describe("DescriptionList", () => {
  it("renders terms and details grouped in hairline cells", () => {
    const { container } = render(
      <DescriptionList>
        <DescriptionItem term="Client">Seetal Regional Rail</DescriptionItem>
        <DescriptionItem term="Stations">14</DescriptionItem>
      </DescriptionList>,
    );
    const list = container.firstElementChild as HTMLElement;
    expect(list.tagName).toBe("DL");
    expect(list).toHaveClass("sw-dl");
    const items = list.querySelectorAll(":scope > .sw-dl-item");
    expect(items).toHaveLength(2);
    expect(items[0].querySelector("dt")).toHaveTextContent("Client");
    expect(items[0].querySelector("dd")).toHaveTextContent("Seetal Regional Rail");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(
      <DescriptionList>
        <DescriptionItem term="Client">Seetal Regional Rail</DescriptionItem>
      </DescriptionList>,
    );
    await expectAccessible(container);
  });
});

describe("Stat", () => {
  it("shows a value, its label and a change with an arrow, sign and phrase", () => {
    const { container } = render(<Stat value="2,400" label="Members" change="+12% on last year" trend="up" />);
    const stat = container.firstElementChild as HTMLElement;
    expect(stat).toHaveClass("sw-stat");
    expect(stat.querySelector(".sw-stat-value")).toHaveTextContent("2,400");
    expect(stat.querySelector(".sw-stat-label")).toHaveTextContent("Members");
    const change = stat.querySelector(".sw-stat-change") as HTMLElement;
    expect(change).toHaveAttribute("data-trend", "up");
    expect(change).toHaveTextContent("+12% on last year");
    expect(change.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("leaves out the change when none is given", () => {
    const { container } = render(<Stat value="14" label="Stations" />);
    expect(container.querySelector(".sw-stat-change")).toBeNull();
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- feedback`
Expected: FAIL, cannot resolve `../src/display/DescriptionList`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/display/DescriptionList.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type DescriptionListProps = ComponentPropsWithRef<"dl"> & {
  /** DescriptionItem elements. */
  children: ReactNode;
};

/** Facts as a grid of term and value pairs, such as a project's client, scope and team. */
export function DescriptionList({ className, ...rest }: DescriptionListProps) {
  return <dl className={cx("sw-dl", className)} {...rest} />;
}

export type DescriptionItemProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  term: ReactNode;
  children: ReactNode;
};

export function DescriptionItem({ term, children, className, ...rest }: DescriptionItemProps) {
  return (
    <div className={cx("sw-dl-item", className)} {...rest}>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
```

Create `packages/react/src/display/Stat.tsx`:

```tsx
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

const TREND_ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight } as const;

export type StatProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  value: ReactNode;
  label: ReactNode;
  /** The change as words with its sign, such as "+12% on last year". */
  change?: ReactNode;
  /** Draws the arrow. The sign and phrase in change carry the meaning; colour stays neutral. */
  trend?: "up" | "down" | "flat";
};

/** One key figure with its label, and optionally how it changed. */
export function Stat({ value, label, change, trend = "flat", className, ...rest }: StatProps) {
  const Arrow = TREND_ICONS[trend];
  return (
    <div className={cx("sw-stat", className)} {...rest}>
      <span className="sw-stat-value">{value}</span>
      <span className="sw-stat-label">{label}</span>
      {change != null && (
        <span className="sw-stat-change" data-trend={trend}>
          <Arrow aria-hidden="true" strokeWidth={1.5} />
          {change}
        </span>
      )}
    </div>
  );
}
```

Export them after the Badge export:

```ts
export { DescriptionItem, type DescriptionItemProps, DescriptionList, type DescriptionListProps } from "./display/DescriptionList";
export { Stat, type StatProps } from "./display/Stat";
```

Add `"DescriptionList", "DescriptionItem", "Stat",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: DescriptionList and Stat"
```

---
### Task 6: Docs pages for ProgressBar, Meter, Skeleton, Banner and EmptyState

**Files:**
- Create: demos under `apps/docs/src/demos/{progress-bar,meter,skeleton,banner,empty-state}/`
- Create: `apps/docs/src/content/components/{progress-bar,meter,skeleton,banner,empty-state}.mdx`

These components are static: each example passes `of={Demo}`, so the page shows the rendered HTML beside the React code, and the two routes are the same markup. Only the dismissable Banner is an island.

- [ ] **Step 1: Write the demos.** Create these files:

`apps/docs/src/demos/progress-bar/Upload.tsx`:

```tsx
import { ProgressBar, Stack } from "@raster/react";

export default function Upload() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Uploading proofs" value={40} />
      <ProgressBar label="Pages exported" value={12} maxValue={20} valueLabel="12 of 20 pages" />
    </Stack>
  );
}
```

`apps/docs/src/demos/meter/Levels.tsx`:

```tsx
import { Meter, Stack } from "@raster/react";

export default function Levels() {
  return (
    <Stack gap={5}>
      <Meter label="Storage used" value={86} low={30} high={80} optimum={0} valueLabel="86 of 100 GB" />
      <Meter label="Accessibility score" value={96} low={50} high={90} optimum={100} />
      <Meter label="Build time" value={55} low={30} high={80} optimum={0} valueLabel="55 s" />
    </Stack>
  );
}
```

`apps/docs/src/demos/skeleton/LoadingCard.tsx`:

```tsx
import { Skeleton, Stack } from "@raster/react";

export default function LoadingCard() {
  return (
    <div aria-busy="true" aria-label="Loading project" style={{ maxInlineSize: "22rem" }}>
      <Stack gap={2}>
        <Skeleton shape="block" />
        <Skeleton shape="heading" width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </Stack>
    </div>
  );
}
```

`apps/docs/src/demos/banner/Maintenance.tsx`:

```tsx
import { Banner } from "@raster/react";

export default function Maintenance() {
  return (
    <Banner title="Scheduled maintenance">
      <p>The studio site is read-only on Sunday from 06:00 to 08:00.</p>
    </Banner>
  );
}
```

`apps/docs/src/demos/banner/Failure.tsx`:

```tsx
import { Banner } from "@raster/react";

export default function Failure() {
  return (
    <Banner tone="danger" title="Publishing failed">
      <p>Two pages could not be published. Check the build log and try again.</p>
    </Banner>
  );
}
```

`apps/docs/src/demos/banner/Dismissable.tsx`:

```tsx
import { Banner } from "@raster/react";

export default function Dismissable() {
  return (
    <Banner tone="success" title="Projects updated" onDismiss={() => undefined}>
      <p>Six projects now have new case studies.</p>
    </Banner>
  );
}
```

`apps/docs/src/demos/empty-state/NoResults.tsx`:

```tsx
import { EmptyState, Link } from "@raster/react";

export default function NoResults() {
  return (
    <EmptyState
      label="Projects"
      title="No projects match these filters"
      headingLevel={3}
      action={<Link href="/components/empty-state/">Clear filters</Link>}
    >
      Try fewer disciplines, or include every year.
    </EmptyState>
  );
}
```

- [ ] **Step 2: Write the pages.** Create `apps/docs/src/content/components/progress-bar.mdx`:

```mdx
---
title: ProgressBar
group: Display
order: 5
summary: How far a task has got, when its length is known, as a 4px bar with the value in mono.
props:
  - name: label
    type: ReactNode
    description: Required. Names the bar.
  - name: value
    type: number
    description: Required. The current amount.
  - name: minValue / maxValue
    type: number
    default: "0 / 100"
    description: The range.
  - name: valueLabel
    type: string
    description: Text shown and announced instead of the percentage, such as "12 of 20 pages".
a11y:
  - Both routes render a native progress element, labelled by its label element; screen readers announce the value.
  - The value beside the label is hidden from screen readers so it is not read twice.
  - In forced-colours mode the track is outlined and the fill uses the system highlight colour.
  - For waits of unknown length use Skeleton; there is no indeterminate bar.
---
import Example from "../../components/Example.astro";
import Upload from "../../demos/progress-bar/Upload";
import uploadSource from "../../demos/progress-bar/Upload.tsx?raw";

<Example title="Upload" source={uploadSource} of={Upload}>
  <Upload />
</Example>
```

Create `apps/docs/src/content/components/meter.mdx`:

```mdx
---
title: Meter
group: Display
order: 6
summary: A measurement within a known range, coloured by how good it is and named when it is high or low.
props:
  - name: label
    type: ReactNode
    description: Required. Names the meter.
  - name: value
    type: number
    description: Required. The measurement.
  - name: minValue / maxValue
    type: number
    default: "0 / 100"
    description: The range.
  - name: low / high / optimum
    type: number
    description: The edges of the middle region, and the best value; together they decide the state, as in HTML.
  - name: valueLabel
    type: string
    description: Text for the value, such as "86 of 100 GB"; defaults to a percentage.
  - name: regionLabels
    type: "{ low?: string; high?: string }"
    default: '{ low: "Low", high: "High" }'
    description: Words shown when the value is outside the middle region.
a11y:
  - Both routes render a native meter with low, high and optimum; its state sets the colour through data-state.
  - Outside the middle region a word ("High", "Low") is shown and announced with the value, so the state is never colour alone.
  - Without React, set data-state ("optimum", "suboptimum" or "poor") and write the word yourself, as in the HTML below.
---
import Example from "../../components/Example.astro";
import Levels from "../../demos/meter/Levels";
import levelsSource from "../../demos/meter/Levels.tsx?raw";

<Example title="Levels" source={levelsSource} of={Levels}>
  <Levels />
</Example>
```

Create `apps/docs/src/content/components/skeleton.mdx`:

```mdx
---
title: Skeleton
group: Display
order: 7
summary: Placeholder blocks in the shape of the content that is loading, with a slow pulse.
props:
  - name: shape
    type: '"text" | "heading" | "block"'
    default: '"text"'
    description: A line of body text, a heading, or a 16:9 block for media.
  - name: width
    type: string
    description: Any CSS length, such as "60%". Defaults to the full width.
a11y:
  - Skeletons are hidden from screen readers. Put aria-busy="true" and a name on the region that is loading, and remove aria-busy when the content arrives.
  - The pulse is a slow change of opacity, with no gradient; under reduced motion the blocks do not move.
  - In forced-colours mode each block is outlined.
---
import Example from "../../components/Example.astro";
import LoadingCard from "../../demos/skeleton/LoadingCard";
import loadingCardSource from "../../demos/skeleton/LoadingCard.tsx?raw";

<Example title="Loading card" source={loadingCardSource} of={LoadingCard}>
  <LoadingCard />
</Example>
```

Create `apps/docs/src/content/components/banner.mdx`:

```mdx
---
title: Banner
group: Display
order: 8
summary: A page-level message strip below the header, with a tone rule, an icon and an optional dismiss button.
interactive: true
props:
  - name: tone
    type: '"info" | "success" | "warning" | "danger"'
    default: '"info"'
    description: Sets the rule, the icon and the spoken tone word.
  - name: title
    type: ReactNode
    description: A short heading for the message.
  - name: onDismiss
    type: () => void
    description: Shows a dismiss button; called after the banner hides.
  - name: dismissLabel
    type: string
    default: '"Dismiss"'
    description: Text of the dismiss button.
  - name: focusAfterDismiss
    type: string
    default: '"#main"'
    description: A selector for where focus goes after dismissing.
a11y:
  - Danger uses the alert role; the other tones use status, so screen readers announce the message politely.
  - A hidden tone word ("Note", "Success", "Warning", "Error") is read first, so the tone never depends on colour or the icon.
  - After dismissing, focus moves to the main content instead of being lost.
  - Use Callout for messages inside the content; a Banner is for the whole page.
---
import Example from "../../components/Example.astro";
import Dismissable from "../../demos/banner/Dismissable";
import dismissableSource from "../../demos/banner/Dismissable.tsx?raw";
import Failure from "../../demos/banner/Failure";
import failureSource from "../../demos/banner/Failure.tsx?raw";
import Maintenance from "../../demos/banner/Maintenance";
import maintenanceSource from "../../demos/banner/Maintenance.tsx?raw";

<Example title="Maintenance notice" source={maintenanceSource} of={Maintenance}>
  <Maintenance />
</Example>

<Example title="Publishing failed" source={failureSource} of={Failure}>
  <Failure />
</Example>

<Example title="Dismissable banner" source={dismissableSource}>
  <Dismissable client:load />
</Example>
```

Create `apps/docs/src/content/components/empty-state.mdx`:

```mdx
---
title: EmptyState
group: Display
order: 9
summary: What to show when there is nothing to show, on a hanging layout with one sentence and one action.
props:
  - name: title
    type: ReactNode
    description: Required. A short heading that says what is empty.
  - name: label
    type: ReactNode
    description: A mono label for the area, such as "Projects".
  - name: children
    type: ReactNode
    description: One sentence - what happened and what to do next.
  - name: action
    type: ReactNode
    description: One button or link.
  - name: headingLevel
    type: 2 | 3 | 4 | 5 | 6
    default: "2"
    description: Level of the heading, to fit the page outline.
a11y:
  - The heading level follows the page outline; the sentence and the action follow it in reading order.
  - There is no illustration by default, so nothing needs a text alternative.
---
import Example from "../../components/Example.astro";
import NoResults from "../../demos/empty-state/NoResults";
import noResultsSource from "../../demos/empty-state/NoResults.tsx?raw";

<Example title="No results" source={noResultsSource} of={NoResults}>
  <NoResults />
</Example>
```

- [ ] **Step 3: Build and run the page checks.**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(progress-bar|meter|skeleton|banner|empty-state)/"`
Expected: `58 page(s) built`; all structure, reflow, axe (four combinations) and component-page tests for the five pages PASS. If axe reports the Banner's alert or status regions, check that no example nests one live region in another.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/src/demos apps/docs/src/content/components
git commit -m "docs: ProgressBar, Meter, Skeleton, Banner and EmptyState pages"
```

---

### Task 7: Docs pages for Media, Avatar, Badge, DescriptionList and Stat

**Files:**
- Create: demos under `apps/docs/src/demos/{media,avatar,badge,description-list,stat}/`
- Create: `apps/docs/src/content/components/{media,avatar,badge,description-list,stat}.mdx`

- [ ] **Step 1: Write the demos.**

`apps/docs/src/demos/media/Columns.tsx`:

```tsx
import { Media } from "@raster/react";

export default function Columns() {
  return (
    <Media ratio="4:3" caption="Twelve columns at 4:3. The frame keeps its shape before the image loads.">
      <svg viewBox="0 0 400 300" role="img" aria-label="Twelve pale columns across the frame">
        <g fill="currentColor" opacity="0.15">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={8 + i * 32.5} y="0" width="24" height="300" />
          ))}
        </g>
      </svg>
    </Media>
  );
}
```

`apps/docs/src/demos/media/Ratios.tsx`:

```tsx
import { Media, Stack } from "@raster/react";

const RATIOS = ["1:1", "3:2", "21:9"] as const;

export default function Ratios() {
  return (
    <Stack gap={5}>
      {RATIOS.map((ratio) => (
        <Media key={ratio} ratio={ratio} caption={ratio} style={{ maxInlineSize: "20rem" }}>
          <svg viewBox="0 0 10 10" preserveAspectRatio="none" role="img" aria-label={`An empty frame at ${ratio}`}>
            <rect width="10" height="10" fill="currentColor" opacity="0.1" />
          </svg>
        </Media>
      ))}
    </Stack>
  );
}
```

`apps/docs/src/demos/avatar/Sizes.tsx`:

```tsx
import { Avatar, Stack } from "@raster/react";

export default function Sizes() {
  return (
    <Stack direction="row" gap={4}>
      <Avatar name="Lea Brunner" size="sm" />
      <Avatar name="Jonas Imhof" />
      <Avatar name="Mara Keller" size="lg" />
    </Stack>
  );
}
```

`apps/docs/src/demos/avatar/WithName.tsx`:

```tsx
import { Avatar, Stack } from "@raster/react";

export default function WithName() {
  return (
    <Stack direction="row" gap={3}>
      <Avatar name="Nico Baumann" decorative />
      <span>Nico Baumann, senior designer</span>
    </Stack>
  );
}
```

`apps/docs/src/demos/badge/Counts.tsx`:

```tsx
import { Badge, Stack } from "@raster/react";

export default function Counts() {
  return (
    <Stack direction="row" gap={5}>
      <span>
        Inbox <Badge label="3 unread messages">3</Badge>
      </span>
      <Badge tone="accent">New</Badge>
      <span>
        Builds <Badge tone="danger" label="2 failed builds">2</Badge>
      </span>
    </Stack>
  );
}
```

`apps/docs/src/demos/description-list/ProjectFacts.tsx`:

```tsx
import { DescriptionItem, DescriptionList } from "@raster/react";

export default function ProjectFacts() {
  return (
    <DescriptionList>
      <DescriptionItem term="Client">Seetal Regional Rail</DescriptionItem>
      <DescriptionItem term="Scope">Wayfinding, pictograms, station identity</DescriptionItem>
      <DescriptionItem term="Stations">14, from Lucerne to Lenzburg</DescriptionItem>
      <DescriptionItem term="Team">Lea Brunner, Jonas Imhof, Elias Frei</DescriptionItem>
    </DescriptionList>
  );
}
```

`apps/docs/src/demos/stat/Figures.tsx`:

```tsx
import { Stat } from "@raster/react";

export default function Figures() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 12rem), 1fr))", gap: "var(--space-6)" }}>
      <Stat value="2,400" label="Members" change="+12% on last year" trend="up" />
      <Stat value="14" label="Stations" />
      <Stat value="−58%" label="Wrong-platform reports" change="−58% since launch" trend="down" />
    </div>
  );
}
```

- [ ] **Step 2: Write the pages.** Create `apps/docs/src/content/components/media.mdx`:

```mdx
---
title: Media
group: Display
order: 10
summary: An image, video or drawing in a frame of fixed ratio, so the page does not shift as it loads.
props:
  - name: ratio
    type: '"1:1" | "4:3" | "3:2" | "16:9" | "21:9"'
    default: '"16:9"'
    description: The frame's proportion; the content covers it.
  - name: caption
    type: ReactNode
    description: Shown below the frame.
  - name: children
    type: ReactNode
    description: Required. One img, video, svg or iframe.
a11y:
  - Give images a text alternative that says what they show; use alt="" only when the caption already says it.
  - A video needs captions and must not play sound on its own.
  - The fixed ratio reserves the space, so nothing below moves as the media loads.
---
import Example from "../../components/Example.astro";
import Columns from "../../demos/media/Columns";
import columnsSource from "../../demos/media/Columns.tsx?raw";
import Ratios from "../../demos/media/Ratios";
import ratiosSource from "../../demos/media/Ratios.tsx?raw";

<Example title="Columns" source={columnsSource} of={Columns}>
  <Columns />
</Example>

<Example title="Ratios" source={ratiosSource} of={Ratios}>
  <Ratios />
</Example>
```

Create `apps/docs/src/content/components/avatar.mdx`:

```mdx
---
title: Avatar
group: Display
order: 11
summary: A person's photo or initials in a square, sized to sit beside text or in a list of people.
props:
  - name: name
    type: string
    description: Required. The text alternative and the source of the initials.
  - name: src
    type: string
    description: A photo; without one, initials are shown.
  - name: size
    type: '"sm" | "md" | "lg"'
    default: '"md"'
    description: 32, 40 or 56px.
  - name: decorative
    type: boolean
    default: "false"
    description: Hides the avatar from screen readers when the name is shown beside it.
a11y:
  - Initials are named with the person's name, so "LB" is read as "Lea Brunner".
  - When the name is written next to the avatar, mark it decorative so the name is not read twice.
  - Avatars are square with the theme's radius; full rounding is reserved for tags and switches.
---
import Example from "../../components/Example.astro";
import Sizes from "../../demos/avatar/Sizes";
import sizesSource from "../../demos/avatar/Sizes.tsx?raw";
import WithName from "../../demos/avatar/WithName";
import withNameSource from "../../demos/avatar/WithName.tsx?raw";

<Example title="Sizes" source={sizesSource} of={Sizes}>
  <Sizes />
</Example>

<Example title="Beside a name" source={withNameSource} of={WithName}>
  <WithName />
</Example>
```

Create `apps/docs/src/content/components/badge.mdx`:

```mdx
---
title: Badge
group: Display
order: 12
summary: A small count or status marker in mono, beside the thing it counts.
props:
  - name: children
    type: ReactNode
    description: Required. The count or a short word.
  - name: label
    type: string
    description: What a count means, read instead of the bare number, such as "3 unread messages".
  - name: tone
    type: '"neutral" | "accent" | "danger"'
    default: '"neutral"'
    description: Neutral for counts, accent for new things, danger for failures.
a11y:
  - Give every count a label, so a screen reader says "3 unread messages" rather than "3".
  - The tone is never the only cue; the word or count says what it means.
  - In forced-colours mode badges keep an outline.
---
import Example from "../../components/Example.astro";
import Counts from "../../demos/badge/Counts";
import countsSource from "../../demos/badge/Counts.tsx?raw";

<Example title="Counts" source={countsSource} of={Counts}>
  <Counts />
</Example>
```

Create `apps/docs/src/content/components/description-list.mdx`:

```mdx
---
title: DescriptionList
group: Display
order: 13
summary: Facts as a grid of terms over values, each cell topped by a hairline.
props:
  - name: children
    type: ReactNode
    description: Required. DescriptionItem elements.
  - name: DescriptionItem term
    type: ReactNode
    description: Required. The name of the fact, set in mono.
  - name: DescriptionItem children
    type: ReactNode
    description: Required. The value.
a11y:
  - A description list, so screen readers announce each term with its value.
  - The grid reflows from one to several columns with the container; reading order stays term then value.
---
import Example from "../../components/Example.astro";
import ProjectFacts from "../../demos/description-list/ProjectFacts";
import projectFactsSource from "../../demos/description-list/ProjectFacts.tsx?raw";

<Example title="Project facts" source={projectFactsSource} of={ProjectFacts}>
  <ProjectFacts />
</Example>
```

Create `apps/docs/src/content/components/stat.mdx`:

```mdx
---
title: Stat
group: Display
order: 14
summary: One key figure, large and light, with its label and how it changed.
props:
  - name: value
    type: ReactNode
    description: Required. The figure, formatted.
  - name: label
    type: ReactNode
    description: Required. What it measures.
  - name: change
    type: ReactNode
    description: The change as words with its sign, such as "+12% on last year".
  - name: trend
    type: '"up" | "down" | "flat"'
    default: '"flat"'
    description: Draws the arrow beside the change.
a11y:
  - The change is written out with its sign; the arrow is decoration and hidden from screen readers.
  - The change keeps a neutral colour, because a fall is not always bad; the words say whether it is good.
  - The arrow mirrors in right-to-left layouts.
---
import Example from "../../components/Example.astro";
import Figures from "../../demos/stat/Figures";
import figuresSource from "../../demos/stat/Figures.tsx?raw";

<Example title="Figures" source={figuresSource} of={Figures}>
  <Figures />
</Example>
```

- [ ] **Step 3: Build and run the page checks.**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(media|avatar|badge|description-list|stat)/"`
Expected: `63 page(s) built`; all tests for the five pages PASS.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/src/demos apps/docs/src/content/components
git commit -m "docs: Media, Avatar, Badge, DescriptionList and Stat pages"
```

---

### Task 8: Browser checks — Banner keyboard and forced colours

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`
- Create: `apps/docs/e2e/forced-colors.spec.ts`

- [ ] **Step 1: Write the Banner walkthrough.** Append to `apps/docs/e2e/keyboard.spec.ts`:

```ts
test("banner: Dismiss hides it and moves focus to the main content", async ({ page }) => {
  await page.goto("/components/banner/");
  await waitForIslands(page);
  const banner = example(page, "Dismissable banner");
  const dismiss = banner.getByRole("button", { name: "Dismiss" });
  await tabTo(page, dismiss);
  await page.keyboard.press("Enter");
  await expect(banner.locator(".sw-banner")).toHaveCount(0);
  await expect(page.locator("main#main")).toBeFocused();
});
```

- [ ] **Step 2: Write the forced-colours suite.** Create `apps/docs/e2e/forced-colors.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { demo } from "./examples";
import { waitForIslands } from "./islands";

/**
 * Forced colours (Windows High Contrast) replaces author backgrounds with system colours, so any
 * control drawn only with backgrounds disappears. These screenshots keep every bar, thumb, fill and
 * block visible. Baselines are generated once and checked by eye; see the plan's Task 8.
 */
const CASES = [
  { path: "/components/progress-bar/", title: "Upload", name: "progress-bar" },
  { path: "/components/meter/", title: "Levels", name: "meter" },
  { path: "/components/skeleton/", title: "Loading card", name: "skeleton" },
  { path: "/components/slider/", title: "Gutter without React", name: "slider-native" },
  { path: "/components/slider/", title: "Gutter", name: "slider-react" },
  { path: "/components/tag-group/", title: "Disciplines without React", name: "tag-group-native" },
  { path: "/components/avatar/", title: "Sizes", name: "avatar" },
  { path: "/components/badge/", title: "Counts", name: "badge" },
];

for (const c of CASES) {
  test(`forced colours: ${c.name} stays visible`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await page.goto(c.path);
    await waitForIslands(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(demo(page, c.title)).toHaveScreenshot(`forced-${c.name}.png`);
  });
}
```

- [ ] **Step 3: Run the walkthrough, then generate and check the forced-colours baselines.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/keyboard.spec.ts -g banner`
Expected: PASS.

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/forced-colors.spec.ts --update-snapshots`
Then: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/forced-colors.spec.ts`
Expected: the second run PASSES with nothing written.

- [ ] **Step 4: Look at every forced-colours baseline.** Open each `apps/docs/e2e/__screenshots__/forced-*-darwin.png` and confirm: the progress and meter bars show an outlined track with a highlight-coloured fill; the skeleton blocks are outlined; both sliders show a dark track and a highlight thumb; the selected native chips show their check; avatars and badges are outlined. If any control is invisible, fix its CSS (add `forced-color-adjust: none` and a system colour, or a border), rebuild, regenerate and look again. Name what you saw for each image in the hand-off report.

- [ ] **Step 5: Commit.**

```bash
git add apps/docs/e2e/keyboard.spec.ts apps/docs/e2e/forced-colors.spec.ts apps/docs/e2e/__screenshots__/forced-*
git commit -m "test(docs): Banner dismiss walkthrough and a forced-colours screenshot suite"
```

---

### Task 9: Visual baselines

**Files:**
- Modify: `apps/docs/e2e/__screenshots__/`

- [ ] **Step 1: Generate baselines for the ten new pages.**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual -g "examples on (progress-bar|meter|skeleton|banner|empty-state|media|avatar|badge|description-list|stat)" --update-snapshots`
Expected: PASS, writing the new images.

- [ ] **Step 2: Check the whole visual suite is stable.**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual`
Expected: PASS with no differences.

- [ ] **Step 3: Look at these images and name what you see in the hand-off.**
  - `meter-1-alpine-light-1440-darwin.png`: three meters; storage red with "· High", score green with "· High", build time amber with no word.
  - `banner-1-zurich-dark-768-darwin.png` and `banner-2-alpine-light-360-darwin.png`: the leading tone rule, the icon and the text, wrapping cleanly at 360.
  - `empty-state-1-alpine-light-1440-darwin.png`: the mono label hanging in its own column beside the heading, sentence and link.
  - `stat-1-zurich-light-768-darwin.png`: light figures over signal rules; the arrows beside the changes.
  - `avatar-1-alpine-dark-360-darwin.png`: three squares of increasing size with initials, not circles.

  If a layout is wrong (stretched, misaligned, clipped), fix it in CSS with a test, regenerate the affected baselines and look again.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/e2e/__screenshots__
git commit -m "test(docs): visual baselines for the feedback and display components"
```

---

### Task 10: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what Plan 7c settled.** Append to the spec:

```markdown

## 11. Settled in Plan 7c

- **ProgressBar and Meter render native elements on both routes.** The React components output `<progress>` and `<meter>` rather than React Aria's divs: one markup, the browser's own semantics, and no parity gap. There is no indeterminate ProgressBar; waits of unknown length use Skeleton.
- **Meter states come from data-state.** The React Meter computes the HTML meter algorithm (`meterState`) and sets `data-state`; native authors set it themselves. Colour and the shown word ("High", "Low") always agree, and no vendor pseudo-classes are needed.
- **Static components share one markup.** Skeleton, Banner, EmptyState, Media, Avatar, Badge, DescriptionList and Stat render plain HTML; the docs show the rendered markup as the HTML route, so no parity screenshots are needed. Banner's dismiss button is React-only and moves focus to the main content.
- **Forced colours are tested.** `apps/docs/e2e/forced-colors.spec.ts` screenshots every bar, thumb, fill and block in forced-colours mode, including Plan 7b's slider and chips.
- **Stat changes are neutral in colour:** a fall is not always bad, so the sign and the words carry the meaning.
```

- [ ] **Step 2: Run everything.**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and both apps' browser tests PASS. Note the counts for the hand-off.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7c's outcomes"
```

---

## Self-review notes

- **Spec coverage:** section 3 rows 12–21 → Tasks 1–5; section 4 visual rules (4px bars, words for meter states, static skeleton without gradients, banner rule and icon and word, square avatars, badge text equivalents, hairline facts, light stat values with sign, arrow and phrase) → the CSS in Tasks 1–5; section 6 docs → Tasks 6–7; section 7 testing → Tasks 1–5 and 8–9. Deviation recorded in Task 10: ProgressBar and Meter use native elements on both routes.
- **Names used across tasks:** CSS `sw-progress`, `sw-progress-head`, `sw-progress-value`, `sw-progress-bar`, `sw-meter`, `sw-meter-bar`, `sw-meter-word`, `sw-skeleton`, `sw-banner`, `sw-banner-inner`, `sw-banner-body`, `sw-banner-title`, `sw-banner-dismiss`, `sw-empty`, `sw-empty-label`, `sw-empty-title`, `sw-empty-text`, `sw-empty-actions`, `sw-media`, `sw-media-frame`, `sw-avatar`, `sw-badge`, `sw-dl`, `sw-dl-item`, `sw-stat`, `sw-stat-value`, `sw-stat-label`, `sw-stat-change`; React `ProgressBar`, `Meter`, `meterState`, `meterRegion`, `Skeleton`, `Banner`, `EmptyState`, `Media`, `Avatar`, `initials`, `Badge`, `DescriptionList`, `DescriptionItem`, `Stat`, `Tone`.
- **Page count:** 53 before; +5 = 58 after Task 6; +5 = 63 after Task 7.
