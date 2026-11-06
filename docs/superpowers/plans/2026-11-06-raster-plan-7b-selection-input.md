# Raster Plan 7b: Selection and input

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TagGroup (selectable chips), SegmentedControl, SearchField, NumberField and Slider to Raster on both routes (native HTML and React Aria), with docs pages, keyboard walkthroughs, parity screenshots and visual baselines.

**Architecture:** As in Plan 7a: one CSS contract per component styles native form controls and React Aria output alike. The native route is built on real form controls (checkboxes and radios for chips and segments, `type="search"`, `type="number"`, `type="range"`), so it works in forms and without script. Two tiny optional scripts for the native route (clear a search field; keep a slider's `<output>` in step) ship in the docs layout and are published on the component pages.

**Tech stack:** Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1, Vitest 3.2 + jsdom, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2: components for real products](../specs/2026-11-06-raster-v2-components-design.md), section 3 rows 7–11, sections 4–7.

**Branch:** `raster/plan-7b-selection-input` (created from main after Plan 7a merged).

---

## Lessons carried from Plan 7a (read before starting)

- **Lightning CSS normalises output.** It drops default values (`currentColor` in a border), prints `transparent` as `#0000`, may drop quotes in attribute selectors and change spacing. When a CSS test fails only because of printing, adjust its regex minimally with a comment; never weaken what it checks.
- **React Aria types.** Take `Key` and prop types from `react-aria-components`, not React.
- **Focus returns a frame late.** React Aria restores focus a frame after closing: assert with `await waitFor(...)` (Vitest) or polling expectations (Playwright).
- **React Aria swallows some clicks.** Its Link and Button stop React click propagation.
- **`hidden="until-found"`.** React Aria hides collapsed content this way; Chromium keeps padding on such elements.
- **Parity is exact.** Parity screenshots use `maxDiffPixels: 0` through `expectSameRendering` / `expectParityBaseline` in `apps/docs/e2e/parity.ts`. If a pair differs, fix the markup or CSS. A component may get a documented exception only when a browser-drawn control cannot be matched (section "NumberField" below).
- **Playwright's `getByRole` reads `aria-*` attributes only, not the browser's computed state.** For native controls use `toBeChecked()`, `toHaveValue()` and the like.
- **Docs demos.** Headings start at level 3, and landmark and label names are unique on each page.

## Conventions every task follows

- Run commands from the repository root.
- CSS goes in `packages/css/src/components/<name>.css`, imported in `packages/css/src/index.css` with `layer(raster.components)` after `sidenav.css`. No raw colours; system colours (`Highlight`, `CanvasText`) only inside `@media (forced-colors: active)`.
- React components merge `className` with `cx`; field components follow `TextField`: `sw-field` root, `FieldLabel`, optional `FieldDescription`, `FieldError`.
- Rebuild before docs tests: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`.
- Commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/css/src/components/chip.css` | Selectable chips (TagGroup) on checkbox/radio inputs and React Aria tags |
| `packages/css/src/components/segmented.css` | SegmentedControl on radio inputs and React Aria toggle buttons |
| `packages/css/src/components/search.css` | SearchField with its clear button |
| `packages/css/src/components/number.css` | NumberField steppers |
| `packages/css/src/components/slider.css` | Slider: native range pseudo-elements and React Aria track and thumb |
| `packages/react/src/forms/TagGroup.tsx` | `TagGroup`, `Chip` |
| `packages/react/src/forms/SegmentedControl.tsx` | `SegmentedControl`, `Segment` |
| `packages/react/src/forms/SearchField.tsx` | `SearchField` |
| `packages/react/src/forms/NumberField.tsx` | `NumberField` |
| `packages/react/src/forms/Slider.tsx` | `Slider` |
| `packages/react/test/selection.test.tsx` | Unit tests for all five |
| `apps/docs/src/lib/native-controls.ts` | `installSearchClear`, `installSliderOutputs` for the native route |
| `apps/docs/src/demos/<component>/` | React demos and native twins |
| `apps/docs/src/content/components/*.mdx` | Five new pages |
| `apps/docs/e2e/keyboard.spec.ts`, `parity.spec.ts` | Walkthroughs and parity checks |

---

### Task 1: TagGroup (CSS and React)

**Files:**
- Create: `packages/css/src/components/chip.css`, `packages/react/src/forms/TagGroup.tsx`, `packages/react/test/selection.test.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("chips (TagGroup)", () => {
  it("are pill-shaped 32px chips with a 44px hit area", () => {
    const r = rule(".sw-chip");
    expect(r).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(r).toMatch(/min-block-size:\s*2rem/);
    expect(css).toMatch(/\.sw-chip::?before\s*\{[^}]*inset-block:\s*calc\(\(2rem - var\(--target-min\)\) \/ 2\)/);
  });

  it("keep the native input focusable but invisible", () => {
    const r = rule(".sw-chip-input");
    expect(r).toMatch(/opacity:\s*0/);
    expect(r).toMatch(/position:\s*absolute/);
  });

  it("mark selection on both routes with a check and a tint, never colour alone", () => {
    expect(css).toMatch(/:is\(\.sw-chip:has\(> \.sw-chip-input:checked\),\s*\.sw-chip\[data-selected\]\)\s*\{[^}]*background-color:\s*var\(--accent-subtle\)/);
    expect(css).toMatch(/:is\(\.sw-chip:has\(> \.sw-chip-input:checked\),\s*\.sw-chip\[data-selected\]\) \.sw-chip-check\s*\{[^}]*display:\s*block/);
  });

  it("show the focus ring on the chip for both routes", () => {
    expect(css).toMatch(/:is\(\.sw-chip:has\(> \.sw-chip-input:focus-visible\),\s*\.sw-chip\[data-focus-visible\]\)\s*\{[^}]*outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-chip`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/chip.css`:

```css
/*
 * Selectable chips (TagGroup). Native route: a labelled group of <label class="sw-chip"> elements,
 * each holding a checkbox (multiple) or radio (single) input. React route: React Aria TagGroup,
 * where each Tag carries data-selected. Full rounding is reserved for Tag and Switch; chips are tags.
 */
.sw-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-2);
  outline: none;
}

.sw-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-block-size: 2rem;
  padding-inline: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-full);
  background-color: var(--surface-raised);
  color: var(--text-primary);
  font-size: var(--text-body-size);
  line-height: 1.25;
  cursor: pointer;
  user-select: none;
  outline: none;
}

/* Hit area: 44px tall although the chip is drawn 32px tall. */
.sw-chip::before {
  content: "";
  position: absolute;
  inset-block: calc((2rem - var(--target-min)) / 2);
  inset-inline: 0;
}

@media (hover: hover) {
  .sw-chip:hover {
    border-color: var(--text-secondary);
  }
}

.sw-chip-input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

/* A check drawn with two borders, shown only when selected. */
.sw-chip-check {
  display: none;
  flex: none;
  inline-size: 0.625rem;
  block-size: 0.375rem;
  margin-block-start: -0.25rem;
  border-inline-start: 1.5px solid currentColor;
  border-block-end: 1.5px solid currentColor;
  transform: rotate(-45deg);
}

:is(.sw-chip:has(> .sw-chip-input:checked), .sw-chip[data-selected]) {
  border-color: var(--accent);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

:is(.sw-chip:has(> .sw-chip-input:checked), .sw-chip[data-selected]) .sw-chip-check {
  display: block;
}

:is(.sw-chip:has(> .sw-chip-input:focus-visible), .sw-chip[data-focus-visible]) {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

:is(.sw-chip:has(> .sw-chip-input:disabled), .sw-chip[data-disabled]) {
  border-color: var(--border);
  color: var(--text-muted);
  cursor: not-allowed;
}

@media (forced-colors: active) {
  :is(.sw-chip:has(> .sw-chip-input:checked), .sw-chip[data-selected]) {
    border-color: Highlight;
  }
}
```

Import it in `packages/css/src/index.css` after `sidenav.css`:

```css
@import "./components/chip.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** Create `packages/react/test/selection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip, TagGroup } from "../src/forms/TagGroup";
import { expectAccessible } from "./axe";

describe("TagGroup", () => {
  function Disciplines(props: { onSelectionChange?: (keys: unknown) => void; selectionMode?: "single" | "multiple" }) {
    return (
      <TagGroup label="Discipline" defaultSelectedKeys={["identity"]} {...props}>
        <Chip id="identity">Identity</Chip>
        <Chip id="wayfinding">Wayfinding</Chip>
        <Chip id="editorial" isDisabled>
          Editorial
        </Chip>
      </TagGroup>
    );
  }

  it("renders a labelled field holding a list of chips with check marks", () => {
    const { container } = render(<Disciplines />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-chip-group");
    const grid = screen.getByRole("grid", { name: "Discipline" });
    expect(grid).toHaveClass("sw-chip-list");
    const chips = screen.getAllByRole("row");
    expect(chips).toHaveLength(3);
    for (const chip of chips) {
      expect(chip).toHaveClass("sw-chip");
      expect(chip.querySelector(".sw-chip-check")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("selects several chips by default and reports changes", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Disciplines onSelectionChange={onSelectionChange} />);
    const identity = screen.getByRole("row", { name: "Identity" });
    const wayfinding = screen.getByRole("row", { name: "Wayfinding" });
    expect(identity).toHaveAttribute("aria-selected", "true");
    await user.click(wayfinding);
    expect(wayfinding).toHaveAttribute("aria-selected", "true");
    expect(identity).toHaveAttribute("aria-selected", "true");
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("keeps one chip selected in single mode", async () => {
    const user = userEvent.setup();
    render(<Disciplines selectionMode="single" />);
    await user.click(screen.getByRole("row", { name: "Wayfinding" }));
    expect(screen.getByRole("row", { name: "Identity" })).toHaveAttribute("aria-selected", "false");
  });

  it("marks disabled chips", () => {
    render(<Disciplines />);
    expect(screen.getByRole("row", { name: "Editorial" })).toHaveAttribute("aria-disabled", "true");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Disciplines />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- selection`
Expected: FAIL, cannot resolve `../src/forms/TagGroup`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/forms/TagGroup.tsx`:

```tsx
import type { ReactNode } from "react";
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  type TagGroupProps as AriaTagGroupProps,
  type Key,
  TagList,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldLabel } from "./FieldParts";

export type TagGroupProps = Omit<AriaTagGroupProps, "className" | "children" | "selectionMode"> & {
  label: ReactNode;
  description?: ReactNode;
  /** "multiple" (the default) for filters; "single" for one choice among several. */
  selectionMode?: "single" | "multiple";
  className?: string;
  /** Chip elements. */
  children: ReactNode;
};

/**
 * A labelled set of selectable chips, for filters. Arrow keys move between chips; Space toggles.
 * Native twin: a role="group" of <label class="sw-chip"> elements holding checkbox or radio inputs.
 */
export function TagGroup({ label, description, selectionMode = "multiple", className, children, ...rest }: TagGroupProps) {
  return (
    <AriaTagGroup className={cx("sw-field sw-chip-group", className)} selectionMode={selectionMode} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <TagList className="sw-chip-list">{children}</TagList>
      {description != null && <FieldDescription>{description}</FieldDescription>}
    </AriaTagGroup>
  );
}

export type ChipProps = {
  id: Key;
  /** The chip's text; also its accessible name. */
  children: string;
  isDisabled?: boolean;
  className?: string;
};

export function Chip({ id, children, isDisabled, className }: ChipProps) {
  return (
    <AriaTag id={id} textValue={children} isDisabled={isDisabled} className={cx("sw-chip", className)}>
      <span className="sw-chip-check" aria-hidden="true" />
      {children}
    </AriaTag>
  );
}
```

Export them in `packages/react/src/index.ts` after the `TextArea`/`TextField` export:

```ts
export { Chip, type ChipProps, TagGroup, type TagGroupProps } from "./forms/TagGroup";
```

Add `"TagGroup", "Chip",` to the `expected` array in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. If React Aria names the grid or rows differently than the test expects (for example, the grid takes its name from the label via `aria-labelledby`), check the rendered DOM with `screen.debug()` and correct the query, not the component, unless the component is genuinely unlabelled.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: TagGroup with selectable chips on checkbox inputs and React Aria"
```

---

### Task 2: SegmentedControl (CSS and React)

**Files:**
- Create: `packages/css/src/components/segmented.css`, `packages/react/src/forms/SegmentedControl.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/selection.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("segmented control", () => {
  it("joins the segments inside one border", () => {
    expect(rule(".sw-segmented-list")).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(css).toMatch(/\.sw-segment \+ \.sw-segment\s*\{[^}]*border-inline-start:\s*1px solid var\(--border-strong\)/);
  });

  it("gives each segment a 40px control with a 44px hit area", () => {
    expect(rule(".sw-segment")).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(css).toMatch(/\.sw-segment::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("marks the selected segment like a pressed toggle: inset accent line and underline", () => {
    const sel = /:is\(\.sw-segment:has\(> \.sw-segment-input:checked\),\s*\.sw-segment\[data-selected\]\)\s*\{([^}]*)\}/;
    const body = css.match(sel)?.[1] ?? "";
    expect(body).toMatch(/box-shadow:\s*inset 0 0 0 1px var\(--accent\)/);
    expect(body).toMatch(/text-decoration-line:\s*underline/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-segmented-list`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/segmented.css`:

```css
/*
 * SegmentedControl: one choice from a short set, shown as a joined row.
 * Native route: a role="radiogroup" of <label class="sw-segment"> elements holding radio inputs.
 * React route: React Aria ToggleButtonGroup (single selection), each ToggleButton carrying data-selected.
 */
.sw-segmented-list {
  display: inline-flex;
  max-inline-size: 100%;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
}

.sw-segment {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--control-height);
  padding-inline: var(--space-4);
  border: 0;
  background: none;
  color: var(--text-secondary);
  font: inherit;
  font-weight: 500;
  line-height: 1.25;
  text-underline-offset: 0.3em;
  cursor: pointer;
  user-select: none;
  outline: none;
}

.sw-segment + .sw-segment {
  border-inline-start: 1px solid var(--border-strong);
}

/* Hit area: 44px tall. */
.sw-segment::before {
  content: "";
  position: absolute;
  inset-block: calc((var(--control-height) - var(--target-min)) / 2);
  inset-inline: 0;
}

@media (hover: hover) {
  .sw-segment:hover {
    color: var(--text-primary);
  }
}

.sw-segment-input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

:is(.sw-segment:has(> .sw-segment-input:checked), .sw-segment[data-selected]) {
  box-shadow: inset 0 0 0 1px var(--accent);
  color: var(--text-primary);
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
}

:is(.sw-segment:has(> .sw-segment-input:focus-visible), .sw-segment[data-focus-visible]) {
  z-index: 1;
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

:is(.sw-segment:has(> .sw-segment-input:disabled), .sw-segment[data-disabled]) {
  color: var(--text-muted);
  cursor: not-allowed;
}
```

Import it after `chip.css`:

```css
@import "./components/segmented.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/selection.test.tsx`, add `import { Segment, SegmentedControl } from "../src/forms/SegmentedControl";` and append:

```tsx
describe("SegmentedControl", () => {
  function View(props: { onSelectionChange?: (key: unknown) => void }) {
    return (
      <SegmentedControl label="View" defaultSelectedKey="grid" {...props}>
        <Segment id="grid">Grid</Segment>
        <Segment id="list">List</Segment>
        <Segment id="map">Map</Segment>
      </SegmentedControl>
    );
  }

  it("is a labelled radio group of segments", () => {
    const { container } = render(<View />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-segmented");
    const group = screen.getByRole("radiogroup", { name: "View" });
    expect(group).toHaveClass("sw-segmented-list");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Grid" })).toHaveClass("sw-segment");
  });

  it("selects exactly one segment and reports the new key", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<View onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "List" }));
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Grid" })).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith("list");
  });

  it("does not let the selection become empty", async () => {
    const user = userEvent.setup();
    render(<View />);
    await user.click(screen.getByRole("radio", { name: "Grid" }));
    expect(screen.getByRole("radio", { name: "Grid" })).toBeChecked();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<View />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- selection`
Expected: FAIL, cannot resolve `../src/forms/SegmentedControl`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/forms/SegmentedControl.tsx`:

```tsx
import { type ReactNode, useId } from "react";
import { type Key, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { cx } from "../utils/cx";

export type SegmentedControlProps = {
  label: ReactNode;
  /** Segment elements. */
  children: ReactNode;
  selectedKey?: Key;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key) => void;
  isDisabled?: boolean;
  className?: string;
};

/**
 * One choice from two to five options, shown as a joined row. There is always exactly one selection.
 * Native twin: a role="radiogroup" of <label class="sw-segment"> elements holding radio inputs.
 */
export function SegmentedControl({
  label,
  children,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  className,
}: SegmentedControlProps) {
  const labelId = useId();
  return (
    <div className={cx("sw-field sw-segmented", className)}>
      <span className="sw-field-label" id={labelId}>
        {label}
      </span>
      <ToggleButtonGroup
        className="sw-segmented-list"
        aria-labelledby={labelId}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={selectedKey === undefined ? undefined : [selectedKey]}
        defaultSelectedKeys={defaultSelectedKey === undefined ? undefined : [defaultSelectedKey]}
        onSelectionChange={(keys) => {
          const [key] = [...keys];
          if (key !== undefined) onSelectionChange?.(key);
        }}
        isDisabled={isDisabled}
      >
        {children}
      </ToggleButtonGroup>
    </div>
  );
}

export type SegmentProps = {
  id: Key;
  children: ReactNode;
  isDisabled?: boolean;
  className?: string;
};

export function Segment({ id, children, isDisabled, className }: SegmentProps) {
  return (
    <ToggleButton id={id} isDisabled={isDisabled} className={cx("sw-segment", className)}>
      {children}
    </ToggleButton>
  );
}
```

Export them in `packages/react/src/index.ts` after the TagGroup export:

```ts
export { Segment, SegmentedControl, type SegmentedControlProps, type SegmentProps } from "./forms/SegmentedControl";
```

Add `"SegmentedControl", "Segment",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: SegmentedControl on radio inputs and React Aria toggle buttons"
```

---

### Task 3: SearchField (CSS and React)

**Files:**
- Create: `packages/css/src/components/search.css`, `packages/react/src/forms/SearchField.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/selection.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("search field", () => {
  it("reserves room for the clear button inside the input and hides the browser's own", () => {
    expect(rule(".sw-search-input")).toMatch(/padding-inline-end:\s*var\(--control-height\)/);
    expect(css).toMatch(/\.sw-search-input::-webkit-search-cancel-button\s*\{[^}]*display:\s*none/);
  });

  it("places a square clear button at the inline end", () => {
    const r = rule(".sw-search-clear");
    expect(r).toMatch(/position:\s*absolute/);
    expect(r).toMatch(/inset-inline-end:\s*0/);
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
  });

  it("hides the clear button while the field is empty, on both routes", () => {
    expect(css).toMatch(
      /\.sw-search\[data-empty\] \.sw-search-clear,\s*\.sw-search-control:has\(> \.sw-search-input:placeholder-shown\) \.sw-search-clear\s*\{[^}]*display:\s*none/,
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-search-input`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/search.css`:

```css
/*
 * SearchField: a search input with a clear button at its inline end.
 * Native route: <input type="search"> with a placeholder (the clear button hides while it shows)
 * and a <button class="sw-search-clear" tabindex="-1">; Escape clears in the browser itself.
 * React route: React Aria SearchField, whose root carries data-empty.
 */
.sw-search-control {
  position: relative;
}

.sw-search-input {
  appearance: none;
  padding-inline-end: var(--control-height);
}

.sw-search-input::-webkit-search-cancel-button,
.sw-search-input::-webkit-search-decoration {
  appearance: none;
  display: none;
}

.sw-search-clear {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  display: grid;
  place-items: center;
  inline-size: var(--control-height);
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
}

@media (hover: hover) {
  .sw-search-clear:hover {
    color: var(--text-primary);
  }
}

.sw-search-clear:is(:focus-visible, [data-focus-visible]) {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width) - 2px);
}

.sw-search[data-empty] .sw-search-clear,
.sw-search-control:has(> .sw-search-input:placeholder-shown) .sw-search-clear {
  display: none;
}

/* A cross drawn with borders, so it survives forced-colours mode. */
.sw-search-clear-icon {
  position: relative;
  inline-size: 0.875rem;
  block-size: 0.875rem;
}

.sw-search-clear-icon::before,
.sw-search-clear-icon::after {
  content: "";
  position: absolute;
  inset-block-start: calc(50% - 0.75px);
  inset-inline: 0;
  border-block-start: 1.5px solid currentColor;
  transform: rotate(45deg);
}

.sw-search-clear-icon::after {
  transform: rotate(-45deg);
}
```

Import it after `segmented.css`:

```css
@import "./components/search.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/selection.test.tsx`, add `import { SearchField } from "../src/forms/SearchField";` and append:

```tsx
describe("SearchField", () => {
  it("renders a labelled search input with a clear button", () => {
    const { container } = render(<SearchField label="Search projects" placeholder="Name or client" />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-search");
    const input = screen.getByRole("searchbox", { name: "Search projects" });
    expect(input).toHaveClass("sw-input", "sw-search-input");
    expect(input).toHaveAttribute("placeholder", "Name or client");
    expect(container.querySelector(".sw-search-clear .sw-search-clear-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("marks itself empty, and clears from the button and from Escape", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { container } = render(<SearchField label="Search projects" onClear={onClear} />);
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByRole("searchbox");
    expect(root).toHaveAttribute("data-empty");
    await user.type(input, "Linie");
    expect(root).not.toHaveAttribute("data-empty");
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
    await user.type(input, "Atlas{Escape}");
    expect(input).toHaveValue("");
  });

  it("submits the value on Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchField label="Search projects" onSubmit={onSubmit} />);
    await user.type(screen.getByRole("searchbox"), "Velo{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Velo");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<SearchField label="Search projects" description="Titles and clients." />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- selection`
Expected: FAIL, cannot resolve `../src/forms/SearchField`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/SearchField.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type SearchFieldProps = Omit<AriaSearchFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    placeholder?: string;
    /** Accessible name of the clear button. Defaults to "Clear search". */
    clearLabel?: string;
    className?: string;
  };

/**
 * A search input. Escape or the clear button empties it; Enter submits.
 * Native twin: <input type="search"> plus a <button class="sw-search-clear">.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  clearLabel = "Clear search",
  className,
  ...rest
}: SearchFieldProps) {
  return (
    <AriaSearchField className={cx("sw-field sw-search", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <div className="sw-search-control">
        <Input className="sw-input sw-search-input" placeholder={placeholder} />
        <AriaButton className="sw-search-clear" aria-label={clearLabel}>
          <span className="sw-search-clear-icon" aria-hidden="true" />
        </AriaButton>
      </div>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaSearchField>
  );
}
```

Export it after the SegmentedControl export:

```ts
export { SearchField, type SearchFieldProps } from "./forms/SearchField";
```

Add `"SearchField",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: SearchField with a clear button on both routes"
```

---
### Task 4: NumberField (CSS and React)

**Files:**
- Create: `packages/css/src/components/number.css`, `packages/react/src/forms/NumberField.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/selection.test.tsx`

**The one documented exception.** On the native route, NumberField is `<input type="number" class="sw-input sw-number-input">` with the browser's own steppers; the React route has − and + buttons beside the input. The two cannot render alike, so NumberField has no parity screenshot. Its keyboard behaviour (arrow keys step the value) is tested on both routes instead (Task 9).

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("number field", () => {
  it("sets the value in tabular figures, centred", () => {
    const r = rule(".sw-number-input");
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(r).toMatch(/text-align:\s*center/);
  });

  it("gives the steppers a 44px-wide control with a 44px-tall hit area", () => {
    const r = rule(".sw-number-step");
    expect(r).toMatch(/inline-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(css).toMatch(/\.sw-number-step::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("draws plus and minus with borders, so they survive forced colours", () => {
    expect(css).toMatch(/\.sw-number-sign::?before,\s*\.sw-number-sign\[data-sign="?plus"?\]::?after\s*\{[^}]*border-block-start:\s*1\.5px solid/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-number-input`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/number.css`:

```css
/*
 * NumberField. Native route: <input type="number" class="sw-input sw-number-input"> with the
 * browser's own steppers. React route: React Aria NumberField, with − and + buttons either side.
 */
.sw-number-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sw-number-input {
  inline-size: 6rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.sw-number-step {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--target-min);
  block-size: var(--control-height);
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}

.sw-number-step::before {
  content: "";
  position: absolute;
  inset-block: calc((var(--control-height) - var(--target-min)) / 2);
  inset-inline: 0;
}

@media (hover: hover) {
  .sw-number-step:hover:not([data-disabled]) {
    border-color: var(--text-secondary);
  }
}

.sw-number-step[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-number-step[data-disabled] {
  border-color: var(--border);
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-number-sign {
  position: relative;
  inline-size: 0.875rem;
  block-size: 0.875rem;
}

.sw-number-sign::before,
.sw-number-sign[data-sign="plus"]::after {
  content: "";
  position: absolute;
  inset-block-start: calc(50% - 0.75px);
  inset-inline: 0;
  border-block-start: 1.5px solid currentColor;
}

.sw-number-sign[data-sign="plus"]::after {
  transform: rotate(90deg);
}
```

Import it after `search.css`:

```css
@import "./components/number.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/selection.test.tsx`, add `import { NumberField } from "../src/forms/NumberField";` and append:

```tsx
describe("NumberField", () => {
  it("renders a labelled numeric input between decrease and increase buttons", () => {
    const { container } = render(<NumberField label="Copies" defaultValue={2} minValue={1} maxValue={20} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-number");
    const input = screen.getByRole("textbox", { name: "Copies" });
    expect(input).toHaveClass("sw-input", "sw-number-input");
    expect(input).toHaveValue("2");
    const steps = container.querySelectorAll(".sw-number-step");
    expect(steps).toHaveLength(2);
    expect(steps[0].querySelector('[data-sign="minus"]')).not.toBeNull();
    expect(steps[1].querySelector('[data-sign="plus"]')).not.toBeNull();
  });

  it("steps with the buttons and the arrow keys, within its limits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberField label="Copies" defaultValue={2} minValue={1} maxValue={3} onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "Copies" });
    await user.click(screen.getByRole("button", { name: /Increase/ }));
    expect(input).toHaveValue("3");
    expect(screen.getByRole("button", { name: /Increase/ })).toBeDisabled();
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(input).toHaveValue("1");
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<NumberField label="Copies" defaultValue={2} />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- selection`
Expected: FAIL, cannot resolve `../src/forms/NumberField`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/NumberField.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Group,
  Input,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type NumberFieldProps = Omit<AriaNumberFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
  };

/**
 * A number with − and + buttons; arrow keys step the value. Use formatOptions for units and currency.
 * Native twin: <input type="number" class="sw-input sw-number-input"> with the browser's steppers.
 */
export function NumberField({ label, description, errorMessage, className, ...rest }: NumberFieldProps) {
  return (
    <AriaNumberField className={cx("sw-field sw-number", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-number-control">
        <AriaButton slot="decrement" className="sw-number-step">
          <span className="sw-number-sign" data-sign="minus" aria-hidden="true" />
        </AriaButton>
        <Input className="sw-input sw-number-input" />
        <AriaButton slot="increment" className="sw-number-step">
          <span className="sw-number-sign" data-sign="plus" aria-hidden="true" />
        </AriaButton>
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}
```

Export it after the SearchField export:

```ts
export { NumberField, type NumberFieldProps } from "./forms/NumberField";
```

Add `"NumberField",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. React Aria names the steppers "Increase" and "Decrease" followed by the field's label; the tests match the start of the name only.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: NumberField with stepper buttons; native route uses the browser's steppers"
```

---

### Task 5: Slider (CSS and React)

**Files:**
- Create: `packages/css/src/components/slider.css`, `packages/react/src/forms/Slider.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/selection.test.tsx`

**Matching the routes.** A native range thumb travels inside the input, so its centre runs from half a thumb in from each end. The React track is therefore inset by half a thumb on each side, and its line is drawn back out to the full width with `::before`, so thumb positions match the native ones exactly. Neither route draws a filled portion: Chromium has no fill pseudo-element, and gradients are not allowed.

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("slider", () => {
  it("draws a 2px track on both routes", () => {
    expect(css).toMatch(/\.sw-slider-input::-webkit-slider-runnable-track\s*\{[^}]*block-size:\s*2px/);
    expect(css).toMatch(/\.sw-slider-input::-moz-range-track\s*\{[^}]*block-size:\s*2px/);
    expect(css).toMatch(/\.sw-slider-track::?before\s*\{[^}]*block-size:\s*2px/);
  });

  it("uses a square thumb with the theme radius on both routes", () => {
    expect(css).toMatch(/\.sw-slider-input::-webkit-slider-thumb\s*\{[^}]*border-radius:\s*var\(--radius\)/);
    expect(rule(".sw-slider-thumb")).toMatch(/border-radius:\s*var\(--radius\)/);
  });

  it("insets the React track by half a thumb so thumbs travel like native ones", () => {
    expect(rule(".sw-slider-track")).toMatch(/margin-inline:\s*calc\(var\(--_thumb\) \/ 2\)/);
  });

  it("keeps the thumb visible in forced colours", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-slider-thumb\s*\{[^}]*background-color:\s*Highlight/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/slider.css`:

```css
/*
 * Slider. Native route: <input type="range" class="sw-slider-input"> with an <output> for the value.
 * React route: React Aria Slider (SliderTrack with one SliderThumb per value, SliderOutput).
 */
.sw-slider {
  --_thumb: 1.25rem;
}

.sw-slider-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.sw-slider-output {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* Native route */
.sw-slider-input {
  appearance: none;
  display: block;
  inline-size: 100%;
  block-size: var(--target-min);
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.sw-slider-input:focus-visible {
  outline: none;
}

.sw-slider-input::-webkit-slider-runnable-track {
  block-size: 2px;
  background-color: var(--border-strong);
}

.sw-slider-input::-webkit-slider-thumb {
  appearance: none;
  inline-size: var(--_thumb);
  block-size: var(--_thumb);
  margin-block-start: calc(1px - var(--_thumb) / 2);
  border: 0;
  border-radius: var(--radius);
  background-color: var(--accent);
}

.sw-slider-input::-moz-range-track {
  block-size: 2px;
  background-color: var(--border-strong);
}

.sw-slider-input::-moz-range-thumb {
  inline-size: var(--_thumb);
  block-size: var(--_thumb);
  border: 0;
  border-radius: var(--radius);
  background-color: var(--accent);
}

.sw-slider-input:focus-visible::-webkit-slider-thumb {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-slider-input:focus-visible::-moz-range-thumb {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-slider-input:disabled::-webkit-slider-thumb {
  background-color: var(--text-muted);
}

.sw-slider-input:disabled::-moz-range-thumb {
  background-color: var(--text-muted);
}

/* React route: the track is inset by half a thumb; its line is drawn back out to full width. */
.sw-slider-track {
  position: relative;
  block-size: var(--target-min);
  margin-inline: calc(var(--_thumb) / 2);
  cursor: pointer;
}

.sw-slider-track::before {
  content: "";
  position: absolute;
  inset-block-start: calc(50% - 1px);
  inset-inline: calc(var(--_thumb) / -2);
  block-size: 2px;
  background-color: var(--border-strong);
}

/* React Aria positions the thumb's inline offset; the block offset is set here. */
.sw-slider-thumb {
  inset-block-start: 50%;
  inline-size: var(--_thumb);
  block-size: var(--_thumb);
  margin-block-start: calc(var(--_thumb) / -2);
  border-radius: var(--radius);
  background-color: var(--accent);
}

/* Hit area: 44px square around the 20px thumb. */
.sw-slider-thumb::before {
  content: "";
  position: absolute;
  inset: calc((var(--_thumb) - var(--target-min)) / 2);
}

.sw-slider-thumb[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-slider[data-disabled] .sw-slider-thumb {
  background-color: var(--text-muted);
}

@media (forced-colors: active) {
  .sw-slider-track::before {
    forced-color-adjust: none;
    background-color: CanvasText;
  }

  .sw-slider-thumb {
    forced-color-adjust: none;
    background-color: Highlight;
  }
}
```

Import it after `number.css`:

```css
@import "./components/slider.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/selection.test.tsx`, add `import { Slider } from "../src/forms/Slider";` and append:

```tsx
describe("Slider", () => {
  it("renders a labelled slider with its value shown", () => {
    const { container } = render(<Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-slider");
    expect(container.querySelector(".sw-slider-head .sw-field-label")).toHaveTextContent("Gutter (px)");
    expect(container.querySelector(".sw-slider-output")).toHaveTextContent("24");
    const slider = screen.getByRole("slider", { name: "Gutter (px)" });
    expect(slider).toHaveValue("24");
    expect(slider.closest(".sw-slider-thumb")).not.toBeNull();
  });

  it("steps with the arrow keys and jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    await user.click(slider);
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveValue("25");
    await user.keyboard("{End}");
    expect(slider).toHaveValue("32");
    await user.keyboard("{Home}");
    expect(slider).toHaveValue("16");
    expect(onChange).toHaveBeenLastCalledWith(16);
  });

  it("draws one thumb per value for a range, each named", () => {
    render(
      <Slider label="Budget" minValue={20} maxValue={150} step={5} defaultValue={[40, 90]} thumbLabels={["Minimum", "Maximum"]} />,
    );
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(screen.getByRole("slider", { name: /Minimum/ })).toHaveValue("40");
    expect(screen.getByRole("slider", { name: /Maximum/ })).toHaveValue("90");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Slider label="Gutter (px)" defaultValue={24} />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- selection`
Expected: FAIL, cannot resolve `../src/forms/Slider`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/Slider.tsx`:

```tsx
import type { ReactNode } from "react";
import {
  Slider as AriaSlider,
  SliderOutput,
  type SliderProps as AriaSliderProps,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldLabel } from "./FieldParts";

export type SliderProps<T extends number | number[]> = Omit<AriaSliderProps<T>, "className" | "children"> & {
  label: ReactNode;
  /** Names for each thumb of a range slider, such as ["Minimum", "Maximum"]. */
  thumbLabels?: string[];
  className?: string;
};

/**
 * A value, or a range with two thumbs, chosen along a track; the current value is shown in mono.
 * Native twin: <input type="range" class="sw-slider-input"> with an <output>.
 */
export function Slider<T extends number | number[]>({ label, thumbLabels, className, ...rest }: SliderProps<T>) {
  return (
    <AriaSlider className={cx("sw-field sw-slider", className)} {...rest}>
      <div className="sw-slider-head">
        <FieldLabel>{label}</FieldLabel>
        <SliderOutput className="sw-slider-output" />
      </div>
      <SliderTrack className="sw-slider-track">
        {({ state }) =>
          state.values.map((_, i) => (
            <SliderThumb key={i} index={i} aria-label={thumbLabels?.[i]} className="sw-slider-thumb" />
          ))
        }
      </SliderTrack>
    </AriaSlider>
  );
}
```

Export it after the NumberField export:

```ts
export { Slider, type SliderProps } from "./forms/Slider";
```

Add `"Slider",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: Slider with matching native and React Aria tracks"
```

---

### Task 6: Native-route scripts for the docs

**Files:**
- Create: `apps/docs/src/lib/native-controls.ts`, `apps/docs/test/native-controls.test.ts`
- Modify: `apps/docs/src/layouts/Base.astro`

Two behaviours have no HTML-only form: a clear button that empties its search input, and an `<output>` that follows its range input. Both are a few lines, optional, and published on the component pages.

- [ ] **Step 1: Write the failing tests.** Create `apps/docs/test/native-controls.test.ts`:

```ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { installSearchClear, installSliderOutputs } from "../src/lib/native-controls";

let uninstall: () => void = () => undefined;
afterEach(() => {
  uninstall();
  document.body.innerHTML = "";
});

describe("installSearchClear", () => {
  it("empties the search input, announces the change and returns focus", () => {
    document.body.innerHTML = `
      <div class="sw-search-control">
        <input type="search" id="q" value="Linie" />
        <button type="button" class="sw-search-clear"><span class="sw-search-clear-icon"></span></button>
      </div>`;
    uninstall = installSearchClear(document);
    const input = document.getElementById("q") as HTMLInputElement;
    let inputEvents = 0;
    input.addEventListener("input", () => inputEvents++);
    (document.querySelector(".sw-search-clear-icon") as HTMLElement).click();
    expect(input.value).toBe("");
    expect(inputEvents).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it("leaves React Aria's clear buttons alone", () => {
    document.body.innerHTML = `
      <div class="sw-search-control">
        <input type="search" id="q" value="Linie" />
        <button type="button" class="sw-search-clear" data-rac=""></button>
      </div>`;
    uninstall = installSearchClear(document);
    (document.querySelector(".sw-search-clear") as HTMLElement).click();
    expect((document.getElementById("q") as HTMLInputElement).value).toBe("Linie");
  });
});

describe("installSliderOutputs", () => {
  it("keeps each output in step with the range input it names", () => {
    document.body.innerHTML = `
      <input type="range" id="gutter" min="16" max="32" value="24" />
      <output for="gutter">24</output>`;
    uninstall = installSliderOutputs(document);
    const input = document.getElementById("gutter") as HTMLInputElement;
    input.value = "30";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("output")?.value).toBe("30");
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/docs test -- native-controls`
Expected: FAIL, cannot resolve `../src/lib/native-controls`.

- [ ] **Step 3: Write the module.** Create `apps/docs/src/lib/native-controls.ts`:

```ts
/**
 * Optional scripts for Raster's native route. Each returns a function that removes its listener.
 */

/** Search fields: the clear button empties its input, tells listeners, and returns focus to it. */
export function installSearchClear(doc: Document): () => void {
  const onClick = (event: Event) => {
    const button = event.target instanceof Element ? event.target.closest(".sw-search-clear") : null;
    // React Aria's SearchField clears itself; its button carries data-rac.
    if (!button || button.hasAttribute("data-rac")) return;
    const input = button.parentElement?.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) return;
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  };
  doc.addEventListener("click", onClick);
  return () => doc.removeEventListener("click", onClick);
}

/** Sliders: keep every <output for="id"> in step with the range input of that id. */
export function installSliderOutputs(doc: Document): () => void {
  const onInput = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "range" || !input.id) return;
    for (const output of doc.querySelectorAll("output")) {
      if (output.htmlFor.contains(input.id)) output.value = input.value;
    }
  };
  doc.addEventListener("input", onInput);
  return () => doc.removeEventListener("input", onInput);
}
```

- [ ] **Step 4: Install them on every docs page.** In `apps/docs/src/layouts/Base.astro`, inside the module `<script>`, add the import next to the existing ones:

```ts
import { installSearchClear, installSliderOutputs } from "../lib/native-controls";
```

and after the existing `installInvokerFallback(document);` call add:

```ts
installSearchClear(document);
installSliderOutputs(document);
```

- [ ] **Step 5: Run the tests and typecheck.**

Run: `pnpm --filter @raster/docs test && pnpm --filter @raster/docs typecheck`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/src/lib/native-controls.ts apps/docs/test/native-controls.test.ts apps/docs/src/layouts/Base.astro
git commit -m "docs: optional native-route scripts for clearing search fields and slider outputs"
```

---
### Task 7: Docs pages for TagGroup, SegmentedControl and SearchField

**Files:**
- Create: `apps/docs/src/demos/tag-group/Disciplines.tsx`, `disciplines.html`
- Create: `apps/docs/src/demos/segmented-control/View.tsx`, `view.html`
- Create: `apps/docs/src/demos/search-field/Projects.tsx`, `projects.html`
- Create: `apps/docs/src/content/components/tag-group.mdx`, `segmented-control.mdx`, `search-field.mdx`

The React demo and its native twin must render the same text and structure: Task 10 compares them pixel for pixel.

- [ ] **Step 1: TagGroup demos.** Create `apps/docs/src/demos/tag-group/Disciplines.tsx`:

```tsx
import { Chip, TagGroup } from "@raster/react";

export default function Disciplines() {
  return (
    <TagGroup
      label="Discipline"
      description="Show projects in any of the chosen disciplines."
      defaultSelectedKeys={["identity", "editorial"]}
    >
      <Chip id="identity">Identity</Chip>
      <Chip id="wayfinding">Wayfinding</Chip>
      <Chip id="editorial">Editorial</Chip>
      <Chip id="digital">Digital</Chip>
    </TagGroup>
  );
}
```

Create `apps/docs/src/demos/tag-group/disciplines.html`:

```html
<div class="sw-field sw-chip-group" role="group" aria-labelledby="disciplines-label">
  <span class="sw-field-label" id="disciplines-label">Discipline</span>
  <div class="sw-chip-list">
    <label class="sw-chip"><input class="sw-chip-input" type="checkbox" name="discipline" value="identity" checked /><span class="sw-chip-check" aria-hidden="true"></span>Identity</label>
    <label class="sw-chip"><input class="sw-chip-input" type="checkbox" name="discipline" value="wayfinding" /><span class="sw-chip-check" aria-hidden="true"></span>Wayfinding</label>
    <label class="sw-chip"><input class="sw-chip-input" type="checkbox" name="discipline" value="editorial" checked /><span class="sw-chip-check" aria-hidden="true"></span>Editorial</label>
    <label class="sw-chip"><input class="sw-chip-input" type="checkbox" name="discipline" value="digital" /><span class="sw-chip-check" aria-hidden="true"></span>Digital</label>
  </div>
  <span class="sw-field-description">Show projects in any of the chosen disciplines.</span>
</div>
```

- [ ] **Step 2: TagGroup page.** Create `apps/docs/src/content/components/tag-group.mdx`:

```mdx
---
title: TagGroup
group: Forms
order: 8
summary: Selectable chips for filtering a list by several values at once, or for one choice among a few.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. Names the group.
  - name: description
    type: ReactNode
    description: Help text below the chips.
  - name: selectionMode
    type: '"multiple" | "single"'
    default: '"multiple"'
    description: Multiple for filters; single when exactly one value applies.
  - name: selectedKeys / defaultSelectedKeys / onSelectionChange
    type: Iterable<Key> / Iterable<Key> / (keys) => void
    description: Controlled or starting selection, and its change handler.
  - name: Chip id / children / isDisabled
    type: Key / string / boolean
    description: The chip's key, its text (also its name), and whether it can be chosen.
a11y:
  - React route - a grid of tags; arrow keys move between chips, Space toggles one, and selection is announced.
  - Without React, each chip is a real checkbox (or radio for a single choice) inside its label, so it submits with a form and works without script; Tab moves between chips and Space toggles.
  - A selected chip shows a check and a tint, never colour alone; in forced-colours mode its border uses the system highlight.
  - Chips are drawn 32px tall with a 44px hit area.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Disciplines from "../../demos/tag-group/Disciplines";
import disciplinesSource from "../../demos/tag-group/Disciplines.tsx?raw";
import disciplinesHtml from "../../demos/tag-group/disciplines.html?raw";

<Example title="Disciplines" source={disciplinesSource}>
  <Disciplines client:load />
</Example>

<NativeExample title="Disciplines without React" html={disciplinesHtml} />
```

Use a plain hyphen after "React route" as shown: a colon followed by a space would make the YAML list item a key/value pair and break the build.

- [ ] **Step 3: SegmentedControl demos.** Create `apps/docs/src/demos/segmented-control/View.tsx`:

```tsx
import { Segment, SegmentedControl } from "@raster/react";

export default function View() {
  return (
    <SegmentedControl label="View" defaultSelectedKey="grid">
      <Segment id="grid">Grid</Segment>
      <Segment id="list">List</Segment>
      <Segment id="map">Map</Segment>
    </SegmentedControl>
  );
}
```

Create `apps/docs/src/demos/segmented-control/view.html`:

```html
<div class="sw-field sw-segmented">
  <span class="sw-field-label" id="view-label">View</span>
  <div class="sw-segmented-list" role="radiogroup" aria-labelledby="view-label">
    <label class="sw-segment"><input class="sw-segment-input" type="radio" name="view" value="grid" checked />Grid</label>
    <label class="sw-segment"><input class="sw-segment-input" type="radio" name="view" value="list" />List</label>
    <label class="sw-segment"><input class="sw-segment-input" type="radio" name="view" value="map" />Map</label>
  </div>
</div>
```

- [ ] **Step 4: SegmentedControl page.** Create `apps/docs/src/content/components/segmented-control.mdx`:

```mdx
---
title: SegmentedControl
group: Forms
order: 9
summary: One choice from two to five options shown as a joined row, such as a view or a time range.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. Names the group.
  - name: selectedKey / defaultSelectedKey / onSelectionChange
    type: Key / Key / (key) => void
    description: Controlled or starting selection, and its change handler. One segment is always selected.
  - name: isDisabled
    type: boolean
    description: Disables every segment.
  - name: Segment id / children / isDisabled
    type: Key / ReactNode / boolean
    description: The segment's key, its label, and whether it can be chosen.
a11y:
  - A radio group - one segment is always selected and arrow keys move between segments on both routes.
  - Without React, the segments are radio inputs inside their labels, so the choice submits with a form and needs no script.
  - The selected segment is marked by an inset accent line and an underline, not colour alone.
  - Use RadioGroup instead when the options need descriptions or there are more than five.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import View from "../../demos/segmented-control/View";
import viewSource from "../../demos/segmented-control/View.tsx?raw";
import viewHtml from "../../demos/segmented-control/view.html?raw";

<Example title="View" source={viewSource}>
  <View client:load />
</Example>

<NativeExample title="View without React" html={viewHtml} />
```

- [ ] **Step 5: SearchField demos.** Create `apps/docs/src/demos/search-field/Projects.tsx`:

```tsx
import { SearchField } from "@raster/react";

export default function Projects() {
  return <SearchField label="Search projects" placeholder="Name or client" description="Searches titles and clients." />;
}
```

Create `apps/docs/src/demos/search-field/projects.html`:

```html
<div class="sw-field sw-search">
  <label class="sw-field-label" for="project-search">Search projects</label>
  <div class="sw-search-control">
    <input class="sw-input sw-search-input" type="search" id="project-search" name="q" placeholder="Name or client" aria-describedby="project-search-description" />
    <button type="button" class="sw-search-clear" tabindex="-1" aria-label="Clear search"><span class="sw-search-clear-icon" aria-hidden="true"></span></button>
  </div>
  <span class="sw-field-description" id="project-search-description">Searches titles and clients.</span>
</div>
```

- [ ] **Step 6: SearchField page.** Create `apps/docs/src/content/components/search-field.mdx`:

```mdx
---
title: SearchField
group: Forms
order: 10
summary: A search input with a clear button; Escape clears it and Enter submits.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: placeholder
    type: string
    description: An example of what to type. The native route needs one, because the clear button hides while it shows.
  - name: description / errorMessage
    type: ReactNode
    description: Help text, and the message shown when the field is invalid.
  - name: value / defaultValue / onChange
    type: string / string / (value) => void
    description: Controlled or starting text, and its change handler.
  - name: onSubmit / onClear
    type: (value) => void / () => void
    description: Called on Enter, and when the field is cleared.
  - name: clearLabel
    type: string
    default: '"Clear search"'
    description: Accessible name of the clear button.
a11y:
  - The input has the searchbox role and its label; the description is announced with it.
  - The clear button is left out of the tab order on both routes, because Escape clears the field from the keyboard.
  - The browser's own clear control is hidden so there is only one.
  - Without React, the clear button needs the short script below; Escape works without it.
---
import CodeBlock from "../../components/CodeBlock.astro";
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Projects from "../../demos/search-field/Projects";
import projectsSource from "../../demos/search-field/Projects.tsx?raw";
import projectsHtml from "../../demos/search-field/projects.html?raw";

export const clearScript = `document.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".sw-search-clear") : null;
  const input = button?.parentElement?.querySelector('input[type="search"]');
  if (!input) return;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
});`;

<Example title="Project search" source={projectsSource}>
  <Projects client:load />
</Example>

<NativeExample title="Project search without React" html={projectsHtml} />

The native clear button needs this script once per page:

<CodeBlock code={clearScript} label="Search clear script" />
```

- [ ] **Step 7: Build and run the page checks.**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(tag-group|segmented-control|search-field)/"`
Expected: `51 page(s) built`; structure, reflow, axe (four combinations) and component-page tests for the three pages PASS.

- [ ] **Step 8: Commit.**

```bash
git add apps/docs/src/demos/tag-group apps/docs/src/demos/segmented-control apps/docs/src/demos/search-field apps/docs/src/content/components/tag-group.mdx apps/docs/src/content/components/segmented-control.mdx apps/docs/src/content/components/search-field.mdx
git commit -m "docs: TagGroup, SegmentedControl and SearchField pages with native examples"
```

---

### Task 8: Docs pages for NumberField and Slider

**Files:**
- Create: `apps/docs/src/demos/number-field/Copies.tsx`, `copies.html`
- Create: `apps/docs/src/demos/slider/Gutter.tsx`, `gutter.html`, `apps/docs/src/demos/slider/Budget.tsx`
- Create: `apps/docs/src/content/components/number-field.mdx`, `slider.mdx`

- [ ] **Step 1: NumberField demos.** Create `apps/docs/src/demos/number-field/Copies.tsx`:

```tsx
import { NumberField } from "@raster/react";

export default function Copies() {
  return <NumberField label="Copies" defaultValue={2} minValue={1} maxValue={20} />;
}
```

Create `apps/docs/src/demos/number-field/copies.html`:

```html
<div class="sw-field sw-number">
  <label class="sw-field-label" for="copies">Copies</label>
  <input class="sw-input sw-number-input" type="number" id="copies" name="copies" min="1" max="20" step="1" value="2" />
</div>
```

- [ ] **Step 2: NumberField page.** Create `apps/docs/src/content/components/number-field.mdx`:

```mdx
---
title: NumberField
group: Forms
order: 11
summary: A number with step buttons, for quantities and other small whole numbers.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: value / defaultValue / onChange
    type: number / number / (value) => void
    description: Controlled or starting value, and its change handler.
  - name: minValue / maxValue / step
    type: number
    description: Limits and step size; the buttons disable at the limits.
  - name: formatOptions
    type: Intl.NumberFormatOptions
    description: Formats the value, for example as a currency or a percentage.
  - name: description / errorMessage
    type: ReactNode
    description: Help text, and the message shown when the value is invalid.
a11y:
  - Arrow keys step the value on both routes; Page Up and Page Down take bigger steps on the React route.
  - The step buttons are named Increase and Decrease and stay out of the tab order, so the input is a single tab stop.
  - Without React, the browser draws its own steppers inside the input, so this route looks different by design and has no parity screenshot.
  - Use a TextField with inputmode="numeric" instead for codes and numbers that are not quantities.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Copies from "../../demos/number-field/Copies";
import copiesSource from "../../demos/number-field/Copies.tsx?raw";
import copiesHtml from "../../demos/number-field/copies.html?raw";

<Example title="Copies" source={copiesSource}>
  <Copies client:load />
</Example>

<NativeExample title="Copies without React" html={copiesHtml} />
```

- [ ] **Step 3: Slider demos.** Create `apps/docs/src/demos/slider/Gutter.tsx`:

```tsx
import { Slider } from "@raster/react";

export default function Gutter() {
  return <Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} />;
}
```

Create `apps/docs/src/demos/slider/gutter.html`:

```html
<div class="sw-field sw-slider">
  <div class="sw-slider-head">
    <label class="sw-field-label" for="gutter">Gutter (px)</label>
    <output class="sw-slider-output" for="gutter">24</output>
  </div>
  <input class="sw-slider-input" type="range" id="gutter" name="gutter" min="16" max="32" step="1" value="24" />
</div>
```

Create `apps/docs/src/demos/slider/Budget.tsx`:

```tsx
import { Slider } from "@raster/react";

export default function Budget() {
  return (
    <Slider
      label="Budget (CHF thousands)"
      minValue={20}
      maxValue={150}
      step={5}
      defaultValue={[40, 90]}
      thumbLabels={["Minimum", "Maximum"]}
    />
  );
}
```

- [ ] **Step 4: Slider page.** Create `apps/docs/src/content/components/slider.mdx`:

```mdx
---
title: Slider
group: Forms
order: 12
summary: A value, or a range between two thumbs, chosen along a track, with the value shown in mono.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: value / defaultValue / onChange
    type: number | number[] / number | number[] / (value) => void
    description: A number for one thumb, or two numbers for a range.
  - name: minValue / maxValue / step
    type: number
    default: "0 / 100 / 1"
    description: Limits and step size.
  - name: thumbLabels
    type: string[]
    description: Names for the thumbs of a range, such as Minimum and Maximum.
  - name: formatOptions
    type: Intl.NumberFormatOptions
    description: Formats the value shown beside the label.
a11y:
  - Each thumb has the slider role; arrow keys step, Page Up and Page Down take bigger steps, Home and End go to the limits.
  - The value is shown as text beside the label, so position is never the only cue.
  - The thumb is drawn 20px square with a 44px hit area, and keeps the system highlight colour in forced-colours mode.
  - Without React, a range input does the same with one thumb; a two-thumb range needs React. Its output follows the input with the short script below.
---
import CodeBlock from "../../components/CodeBlock.astro";
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Budget from "../../demos/slider/Budget";
import budgetSource from "../../demos/slider/Budget.tsx?raw";
import Gutter from "../../demos/slider/Gutter";
import gutterSource from "../../demos/slider/Gutter.tsx?raw";
import gutterHtml from "../../demos/slider/gutter.html?raw";

export const outputScript = `document.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "range" || !input.id) return;
  for (const output of document.querySelectorAll("output")) {
    if (output.htmlFor.contains(input.id)) output.value = input.value;
  }
});`;

<Example title="Gutter" source={gutterSource}>
  <Gutter client:load />
</Example>

<NativeExample title="Gutter without React" html={gutterHtml} />

The native output needs this script once per page:

<CodeBlock code={outputScript} label="Slider output script" />

<Example title="Budget range" source={budgetSource}>
  <Budget client:load />
</Example>
```

- [ ] **Step 5: Build and run the page checks.**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(number-field|slider)/"`
Expected: `53 page(s) built`; all tests for the two pages PASS.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/src/demos/number-field apps/docs/src/demos/slider apps/docs/src/content/components/number-field.mdx apps/docs/src/content/components/slider.mdx
git commit -m "docs: NumberField and Slider pages with native examples"
```

---

### Task 9: Keyboard walkthroughs on both routes

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`

- [ ] **Step 1: Write the tests.** Append to `apps/docs/e2e/keyboard.spec.ts` (`example`, `tabTo`, `waitForIslands` are already imported):

```ts
test("tag group, React: arrows move between chips and Space toggles", async ({ page }) => {
  await page.goto("/components/tag-group/");
  await waitForIslands(page);
  const group = example(page, "Disciplines");
  const identity = group.getByRole("row", { name: "Identity" });
  const wayfinding = group.getByRole("row", { name: "Wayfinding" });
  await tabTo(page, identity);
  await page.keyboard.press("ArrowRight");
  await expect(wayfinding).toBeFocused();
  await page.keyboard.press("Space");
  await expect(wayfinding).toHaveAttribute("aria-selected", "true");
  await expect(identity).toHaveAttribute("aria-selected", "true");
});

test("tag group, native: Tab moves between checkboxes and Space toggles", async ({ page }) => {
  await page.goto("/components/tag-group/");
  const group = example(page, "Disciplines without React");
  const identity = group.getByRole("checkbox", { name: "Identity" });
  const wayfinding = group.getByRole("checkbox", { name: "Wayfinding" });
  await tabTo(page, identity);
  await page.keyboard.press("Space");
  await expect(identity).not.toBeChecked();
  await page.keyboard.press("Tab");
  await expect(wayfinding).toBeFocused();
  await page.keyboard.press("Space");
  await expect(wayfinding).toBeChecked();
});

test("segmented control, React: arrows move and Space selects; one segment stays selected", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  await waitForIslands(page);
  const view = example(page, "View");
  await tabTo(page, view.getByRole("radio", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(view.getByRole("radio", { name: "List" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(view.getByRole("radio", { name: "List" })).toBeChecked();
  await expect(view.getByRole("radio", { name: "Grid" })).not.toBeChecked();
});

test("segmented control, native: arrows move the selection", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  const view = example(page, "View without React");
  await tabTo(page, view.getByRole("radio", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(view.getByRole("radio", { name: "List" })).toBeFocused();
  await expect(view.getByRole("radio", { name: "List" })).toBeChecked();
});

for (const route of ["React", "native"] as const) {
  test(`search field, ${route}: Escape clears; the clear button clears and returns focus`, async ({ page }) => {
    await page.goto("/components/search-field/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Project search" : "Project search without React");
    const input = field.getByRole("searchbox", { name: "Search projects" });
    const clear = field.getByRole("button", { name: "Clear search" });
    await tabTo(page, input);
    await expect(clear).toBeHidden();
    await page.keyboard.type("Linie");
    await expect(clear).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await page.keyboard.type("Atlas");
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  });

  test(`number field, ${route}: arrow keys step the value`, async ({ page }) => {
    await page.goto("/components/number-field/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Copies" : "Copies without React");
    const input = route === "React" ? field.getByRole("textbox", { name: "Copies" }) : field.getByRole("spinbutton", { name: "Copies" });
    await tabTo(page, input);
    await page.keyboard.press("ArrowUp");
    await expect(input).toHaveValue("3");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveValue("1");
  });

  test(`slider, ${route}: arrows step, Home and End reach the limits, the value is shown`, async ({ page }) => {
    await page.goto("/components/slider/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Gutter" : "Gutter without React");
    const slider = field.getByRole("slider", { name: "Gutter (px)" });
    const output = field.locator(".sw-slider-output");
    await tabTo(page, slider);
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("25");
    await expect(output).toHaveText("25");
    await page.keyboard.press("End");
    await expect(output).toHaveText("32");
    await page.keyboard.press("Home");
    await expect(output).toHaveText("16");
  });
}
```

- [ ] **Step 2: Run them.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/keyboard.spec.ts`
Expected: all PASS. If React Aria's ToggleButtonGroup selects on arrow keys rather than Space, the React segmented test still passes (Space keeps the selection); do not change the native test. If React Aria exposes the NumberField input with a role other than textbox, query by label (`field.getByLabel("Copies")`) instead.

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/e2e/keyboard.spec.ts
git commit -m "test(docs): keyboard walkthroughs for chips, segments, search, number and slider on both routes"
```

---

### Task 10: Parity between the two routes

**Files:**
- Modify: `apps/docs/e2e/parity.spec.ts`

- [ ] **Step 1: Write the checks.** Inside the existing `test.describe(variant, …)` block in `apps/docs/e2e/parity.spec.ts`, after the last test, add:

```ts
    test("tag group renders alike, as loaded and after a change", async ({ page }) => {
      await open(page, "/components/tag-group/");
      const react = demo(page, "Disciplines");
      const native = demo(page, "Disciplines without React");
      await expectSameRendering(page, `tag-group-${variant}`, react, native);
      await react.getByRole("row", { name: "Wayfinding" }).click();
      await native.getByText("Wayfinding").click();
      await expectSameRendering(page, `tag-group-changed-${variant}`, react, native);
    });

    test("segmented control renders alike, as loaded and after a change", async ({ page }) => {
      await open(page, "/components/segmented-control/");
      const react = demo(page, "View");
      const native = demo(page, "View without React");
      await expectSameRendering(page, `segmented-${variant}`, react, native);
      await react.getByRole("radio", { name: "Map" }).click();
      await native.getByText("Map").click();
      await expectSameRendering(page, `segmented-changed-${variant}`, react, native);
    });

    test("search field renders alike, empty and with text", async ({ page }) => {
      await open(page, "/components/search-field/");
      const react = demo(page, "Project search");
      const native = demo(page, "Project search without React");
      await expectSameRendering(page, `search-empty-${variant}`, react, native);
      await react.getByRole("searchbox").fill("Linie");
      await native.getByRole("searchbox").fill("Linie");
      await expectSameRendering(page, `search-filled-${variant}`, react, native);
    });

    test("slider renders alike, as loaded and at its maximum", async ({ page }) => {
      await open(page, "/components/slider/");
      const react = demo(page, "Gutter");
      const native = demo(page, "Gutter without React");
      await expectSameRendering(page, `slider-${variant}`, react, native);
      for (const target of [react, native]) {
        await target.getByRole("slider").focus();
        await page.keyboard.press("End");
      }
      await expectSameRendering(page, `slider-max-${variant}`, react, native);
    });

    // NumberField has no parity check: the native route uses the browser's own steppers by design.
```

- [ ] **Step 2: Generate the baselines, then check them without updating.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/parity.spec.ts -g "tag group|segmented|search field|slider" --update-snapshots`
Then: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/parity.spec.ts --repeat-each=3`
Expected: the second run PASSES with nothing written.

If a pair differs, open the `*-diff.png` under `apps/docs/test-results/` and fix the difference in markup or CSS. For the slider only, if after aligning track, thumb size and thumb travel a difference remains that comes from the browser drawing the native thumb (for example anti-aliasing of its edge), you may pass a per-test `maxDiffPixels` to that one comparison: measure the stable difference over `--repeat-each=3`, use the smallest cap that passes, and state the number and the reason in a comment above it and in the hand-off report.

- [ ] **Step 3: Look at four baselines.** Open `parity-tag-group-changed-alpine-light-darwin.png`, `parity-segmented-zurich-dark-darwin.png`, `parity-search-filled-alpine-light-darwin.png` and `parity-slider-alpine-light-darwin.png` under `apps/docs/e2e/__screenshots__/` and confirm: three chips with checks (Identity, Wayfinding, Editorial) and Digital plain; Grid marked with the inset line and underline; "Linie" in the field with the cross at the end; the thumb a third of the way along the track with "24" beside the label.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/e2e/parity.spec.ts apps/docs/e2e/__screenshots__/parity-*
git commit -m "test(docs): parity screenshots for chips, segments, search and slider"
```

---

### Task 11: Visual baselines

**Files:**
- Modify: `apps/docs/e2e/__screenshots__/`

- [ ] **Step 1: Generate baselines for the new pages.**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual -g "examples on (tag-group|segmented-control|search-field|number-field|slider)" --update-snapshots`
Expected: PASS, writing the new images.

- [ ] **Step 2: Check the whole visual suite is stable.**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual`
Expected: PASS with no differences.

- [ ] **Step 3: Look at two images.** Open `slider-1-zurich-dark-768-darwin.png` and `number-field-1-alpine-light-360-darwin.png` and confirm the square thumb on a hairline track, and the − and + buttons either side of the value.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/e2e/__screenshots__
git commit -m "test(docs): visual baselines for the selection and input components"
```

---

### Task 12: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what Plan 7b settled.** Append to the end of the spec:

```markdown

## 10. Settled in Plan 7b

- **NumberField parity:** the native route keeps the browser's own steppers inside the input, so it cannot render like the React route's − and + buttons. NumberField has no parity screenshot; its arrow-key stepping is tested on both routes.
- **Native-route scripts:** a search field's clear button and a slider's `<output>` need a few lines of script on the native route. The docs ship them (`apps/docs/src/lib/native-controls.ts`) and publish them on the component pages; Raster's packages ship no script. Escape still clears a native search field without script.
- **Slider fill:** neither route draws a filled portion of the track. Chromium has no fill pseudo-element and gradients are not allowed; the value is always shown as text.
- **Chips and segments without script:** the native route uses real checkbox and radio inputs, so a filter or a choice submits with a form.
```

If Task 10 needed a slider tolerance, add a bullet with the cap and the reason.

- [ ] **Step 2: Run everything.**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and both apps' browser tests PASS. Note the counts for the hand-off.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7b's outcomes"
```

---

## Self-review notes

- **Spec coverage:** section 3 rows 7–11 → Tasks 1–5; section 6 (docs, native examples) → Tasks 6–8; section 7 (unit tests, keyboard, parity, visual) → Tasks 1–5 and 9–11. NumberField's parity exception follows section 7's provision for browser-drawn controls.
- **Names used across tasks:** CSS `sw-chip-group`, `sw-chip-list`, `sw-chip`, `sw-chip-input`, `sw-chip-check`, `sw-segmented`, `sw-segmented-list`, `sw-segment`, `sw-segment-input`, `sw-search`, `sw-search-control`, `sw-search-input`, `sw-search-clear`, `sw-search-clear-icon`, `sw-number`, `sw-number-control`, `sw-number-input`, `sw-number-step`, `sw-number-sign`, `sw-slider`, `sw-slider-head`, `sw-slider-output`, `sw-slider-input`, `sw-slider-track`, `sw-slider-thumb`; React `TagGroup`, `Chip`, `SegmentedControl`, `Segment`, `SearchField`, `NumberField`, `Slider`; docs `installSearchClear`, `installSliderOutputs`.
- **Page count:** 48 before; +5 = 53 (51 after Task 7).
