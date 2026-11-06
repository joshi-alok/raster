# Raster Plan 7d: Combobox, dates and files

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ComboBox, Calendar, RangeCalendar, DatePicker, DateRangePicker and FileUpload to Raster on both routes, with five docs pages, keyboard walkthroughs, forced-colours screenshots and visual baselines.

**Architecture:** The React route wraps React Aria Components (`ComboBox`, `Calendar`, `RangeCalendar`, `DatePicker`, `DateRangePicker`, `DropZone`, `FileTrigger`). The HTML route uses the browser's own controls: `<input list>` with `<datalist>`, `<input type="date">`, and a file input that is itself the drop zone. One CSS file per family styles both. Calendar and RangeCalendar have no HTML route, because no native calendar element exists.

**Tech stack:** Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1, `@internationalized/date` 3.12.4 (already installed with React Aria), lucide-react, Vitest 3.2 + jsdom + user-event, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2](../specs/2026-11-06-raster-v2-components-design.md), section 12 (the Plan 7d design), plus sections 4–7.

**Branch:** `raster/plan-7d` (created from main after Plan 7c merged).

---

## Lessons carried from Plans 7a–7c

- **Lightning CSS printing:** it drops default values, prints `transparent` as `#0000`, lower-cases system colours (use the `i` flag), prints `:has(> .x)` as `:has( > .x)`, prints `(min-width: 600px)` as `(width >= 600px)`, joins grouped selectors and `:not(a, b)` lists onto one line, and may add vendor-prefixed copies of pseudo-elements such as `::file-selector-button`. When a CSS test fails only because of printing, adjust the regex minimally with a comment; never weaken it.
- **React Aria:** take `Key`, `DateValue` and prop types from `react-aria-components`. Collection components render a `<template>` before their root in tests; query with `:scope > :not(template)`. React Aria restores focus a frame late; use `waitFor`.
- **Forced colours removes backgrounds.** Anything drawn only by `background-color` (a selected day, a focused segment) needs `forced-color-adjust: none` and system colours, or a border.
- **Accessibility checks on docs pages:** a plain `div` may not carry `aria-label`; give it a role. YAML descriptions containing ": " must be reworded.
- **Look at the screenshots.** Layout bugs (a stretched row in 7b, a squeezed banner in 7c) passed every test and were caught only by eye. The visual task ends by opening named images.

## Conventions every task follows

- Run commands from the repository root. To run one React test file: `cd packages/react && npx vitest run test/pickers.test.tsx` (the `pnpm --filter … test -- name` form runs the whole suite).
- CSS goes in `packages/css/src/components/<name>.css`, imported in `packages/css/src/index.css` with `layer(raster.components)` after `facts.css`, in task order. No raw colours; system colours only inside `@media (forced-colors: active)`.
- React components live in `packages/react/src/forms/`, merge `className` with `cx`, and are exported from `packages/react/src/index.ts` after the Stat export; add each name to `expected` in `packages/react/test/exports.test.ts`.
- New React tests go in `packages/react/test/pickers.test.tsx` (created in Task 1; later tasks add imports at the top).
- Rebuild before docs tests: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`.
- Commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/css/src/components/combobox.css` | Combobox input and suggestions button; the list reuses `.sw-popover` and `.sw-listbox` |
| `packages/css/src/components/calendar.css` | Calendar header, grid, day states, range, the calendar popover, forced colours |
| `packages/css/src/components/date-picker.css` | Segmented date field, calendar button, native date inputs and the native range fieldset |
| `packages/css/src/components/file-upload.css` | Drop zone, native file input, file list |
| `packages/react/src/forms/ComboBox.tsx` | `ComboBox`, `ComboBoxItem` |
| `packages/react/src/forms/Calendar.tsx` | `Calendar`, `RangeCalendar`, and the shared `CalendarBody` |
| `packages/react/src/forms/DatePicker.tsx` | `DatePicker`, `DateRangePicker` |
| `packages/react/src/forms/FileUpload.tsx` | `FileUpload`, `formatFileSize`, `acceptsFile` |
| `packages/react/test/pickers.test.tsx` | Unit tests for all of the above |
| `apps/docs/src/demos/{combobox,date-picker,date-range-picker,calendar,file-upload}/` | Demos and native `.html` twins |
| `apps/docs/src/content/components/{combobox,date-picker,date-range-picker,calendar,file-upload}.mdx` | Five pages in the Forms group, orders 13–17 |
| `apps/docs/e2e/keyboard.spec.ts` | Keyboard walkthroughs on both routes, and a drop |
| `apps/docs/e2e/forced-colors.spec.ts` | Four new cases |

---

### Task 1: ComboBox (CSS and React)

**Files:**
- Create: `packages/css/src/components/combobox.css`, `packages/react/src/forms/ComboBox.tsx`, `packages/react/test/pickers.test.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("combobox", () => {
  it("reserves room for the suggestions button inside the input", () => {
    expect(rule(".sw-combobox-input")).toMatch(/padding-inline-end:\s*var\(--control-height\)/);
  });

  it("places a square suggestions button at the inline end", () => {
    const r = rule(".sw-combobox-button");
    expect(r).toMatch(/position:\s*absolute/);
    expect(r).toMatch(/inset-inline-end:\s*0/);
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
  });

  it("extends the button's hit area to the 44px target", () => {
    expect(rule(".sw-combobox-button:before")).toMatch(/inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/);
  });

  it("gives the native list input back its normal padding, since the browser draws its own indicator", () => {
    expect(rule(".sw-combobox-input[list]")).toMatch(/padding-inline-end:\s*var\(--space-3\)/);
  });
});
```

Lightning CSS prints `::before` as `:before`; the test expects that.

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test`
Expected: FAIL with `No rule for .sw-combobox-input`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/combobox.css`:

```css
/*
 * Combobox: type to filter a list of suggestions.
 * Native route: <input list> with a <datalist>. The suggestion list and its indicator are the
 * browser's own, and any text is accepted.
 * React route: React Aria ComboBox. The list opens in .sw-popover with .sw-listbox, as Select does.
 */
.sw-combobox-control {
  position: relative;
}

.sw-combobox-input {
  padding-inline-end: var(--control-height);
}

.sw-combobox-input[list] {
  padding-inline-end: var(--space-3);
}

.sw-combobox-button {
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

/* Extend the hit area to the 44px touch target without changing the 40px control. */
.sw-combobox-button::before {
  content: "";
  position: absolute;
  inset-block: calc((var(--control-height) - var(--target-min)) / 2);
  inset-inline: 0;
}

@media (hover: hover) {
  .sw-combobox-button:hover {
    color: var(--text-primary);
  }
}

.sw-combobox-button svg {
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}
```

React Aria leaves the suggestions button out of the tab order (the input opens the list with the arrow keys), so it needs no focus style.

Import it after `facts.css` in `packages/css/src/index.css`:

```css
@import "./components/combobox.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** Create `packages/react/test/pickers.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboBox, ComboBoxItem } from "../src/forms/ComboBox";
import { expectAccessible } from "./axe";

const CITIES = ["Basel", "Bern", "Lucerne", "Lugano", "Zürich"];

function City({ onSelectionChange }: { onSelectionChange?: (key: unknown) => void }) {
  return (
    <ComboBox label="City" placeholder="Type to filter" onSelectionChange={onSelectionChange}>
      {CITIES.map((city) => (
        <ComboBoxItem key={city} id={city}>
          {city}
        </ComboBoxItem>
      ))}
    </ComboBox>
  );
}

describe("ComboBox", () => {
  it("renders a labelled combobox input with a suggestions button", () => {
    const { container } = render(<City />);
    // React Aria's collection builder may render a <template> before the root, so skip past it.
    expect(container.querySelector(":scope > :not(template)")).toHaveClass("sw-field", "sw-combobox");
    const input = screen.getByRole("combobox", { name: "City" });
    expect(input).toHaveClass("sw-input", "sw-combobox-input");
    expect(input).toHaveAttribute("placeholder", "Type to filter");
    expect(container.querySelector(".sw-combobox-button svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("filters as you type and chooses with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<City onSelectionChange={onSelectionChange} />);
    const input = screen.getByRole("combobox", { name: "City" });
    await user.type(input, "Lu");
    const list = await screen.findByRole("listbox");
    expect(list).toHaveClass("sw-listbox");
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Lucerne", "Lugano"]);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("Lucerne");
    expect(onSelectionChange).toHaveBeenLastCalledWith("Lucerne");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<City />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `cd packages/react && npx vitest run test/pickers.test.tsx`
Expected: FAIL, cannot resolve `../src/forms/ComboBox`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/ComboBox.tsx`:

```tsx
import { ChevronDown } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Input,
  ListBox,
  Popover,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";
import { SelectItem, type SelectItemProps } from "./Select";

export type ComboBoxProps<T extends object> = Omit<AriaComboBoxProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    placeholder?: string;
    className?: string;
    /** ComboBoxItem elements, or a render function for `defaultItems` / `items`. */
    children: ReactNode | ((item: T) => ReactNode);
  };

/**
 * Type to filter a list of suggestions. The list opens in a popover, filtered as you type; arrow
 * keys move through it and Enter chooses. Pass `allowsCustomValue` to accept text not in the list.
 * Native twin: <input list> with a <datalist>, whose list is the browser's own.
 */
export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  children,
  ...rest
}: ComboBoxProps<T>) {
  return (
    <AriaComboBox className={cx("sw-field sw-combobox", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <div className="sw-combobox-control">
        <Input className="sw-input sw-combobox-input" placeholder={placeholder} />
        <AriaButton className="sw-combobox-button">
          <ChevronDown aria-hidden="true" />
        </AriaButton>
      </div>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover">
        <ListBox className="sw-listbox">{children}</ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export type ComboBoxItemProps = SelectItemProps;

/** One suggestion in a ComboBox. The same as SelectItem: weight 500 and a check when chosen. */
export const ComboBoxItem = SelectItem;
```

Export it after the Stat export in `packages/react/src/index.ts`:

```ts
export { ComboBox, ComboBoxItem, type ComboBoxItemProps, type ComboBoxProps } from "./forms/ComboBox";
```

Add `"ComboBox", "ComboBoxItem",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: ComboBox filters suggestions as you type"
```

---

### Task 2: Calendar and RangeCalendar (CSS and React)

**Files:**
- Create: `packages/css/src/components/calendar.css`, `packages/react/src/forms/Calendar.tsx`
- Modify: `packages/react/package.json` (devDependency), `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/pickers.test.tsx`

- [ ] **Step 1: Add the date library for tests.** Raster's components take their date types from `react-aria-components`, so the package needs no new runtime dependency; its tests build dates with `@internationalized/date`, which React Aria already installs.

Run: `pnpm --filter @raster/react add -D @internationalized/date@3.12.4`
Expected: `packages/react/package.json` lists `"@internationalized/date": "3.12.4"` under devDependencies; the lockfile resolves to the copy already installed.

- [ ] **Step 2: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("calendar", () => {
  it("is at most seven 44px cells wide", () => {
    expect(rule(".sw-calendar")).toMatch(/inline-size:\s*min\(100%,\s*calc\(7 \* var\(--target-min\)\)\)/);
  });

  it("draws square day cells in mono", () => {
    const r = rule(".sw-calendar-cell");
    expect(r).toMatch(/aspect-ratio:\s*1/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("marks today with a 2px underline, not colour", () => {
    const r = rule(".sw-calendar-cell[data-today]");
    expect(r).toMatch(/text-decoration-line:\s*underline/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("fills a selected day with the accent and sets it in weight 500", () => {
    const r = rule(".sw-calendar-cell[data-selected]");
    expect(r).toMatch(/background-color:\s*var\(--accent\)/);
    expect(r).toMatch(/color:\s*var\(--on-accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("gives the middle of a range a subtle fill, keeping the ends solid", () => {
    expect(css).toMatch(
      /\.sw-range-calendar \.sw-calendar-cell\[data-selected\]:not\(\[data-selection-start\],\s*\[data-selection-end\]\)\s*\{[^}]*background-color:\s*var\(--accent-subtle\)/,
    );
  });

  it("strikes through unavailable days and hides days outside the month", () => {
    expect(rule(".sw-calendar-cell[data-unavailable]")).toMatch(/text-decoration-line:\s*line-through/);
    expect(rule(".sw-calendar-cell[data-outside-month]")).toMatch(/visibility:\s*hidden/);
  });

  it("mirrors the month arrows in right-to-left text", () => {
    expect(css).toMatch(/\.sw-calendar-nav svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });

  it("keeps selected days visible in forced colours", () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-calendar-cell\[data-selected\]\s*\{[^}]*forced-color-adjust:\s*none[^}]*background-color:\s*highlight/i,
    );
  });
});
```

- [ ] **Step 3: Run them to see them fail.**

Run: `pnpm --filter @raster/css test`
Expected: FAIL with `No rule for .sw-calendar`.

- [ ] **Step 4: Write the CSS.** Create `packages/css/src/components/calendar.css`:

```css
/*
 * Calendar and RangeCalendar (React route only: there is no native calendar element).
 * A 7-column grid of 44px cells. States are never colour alone: today is underlined, a selected
 * day is filled and set in weight 500, an unavailable day is struck through.
 */
.sw-calendar {
  display: grid;
  gap: var(--space-2);
  inline-size: min(100%, calc(7 * var(--target-min)));
}

.sw-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.sw-calendar-heading {
  margin: 0;
  font-size: var(--text-body-size);
  font-weight: 500;
  line-height: 1.25;
}

.sw-calendar-nav {
  display: grid;
  place-items: center;
  inline-size: var(--target-min);
  block-size: var(--target-min);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: none;
  color: var(--text-primary);
  cursor: pointer;
}

@media (hover: hover) {
  .sw-calendar-nav:hover {
    background-color: var(--surface-subtle);
  }
}

.sw-calendar-nav[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-calendar-nav svg {
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

.sw-calendar-nav svg:dir(rtl) {
  transform: scaleX(-1);
}

.sw-calendar-grid {
  inline-size: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.sw-calendar-grid td {
  padding: 0;
}

.sw-calendar-weekday {
  padding-block: var(--space-1);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  font-weight: 400;
  text-align: center;
}

.sw-calendar-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-body-size);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  outline: none;
}

@media (hover: hover) {
  .sw-calendar-cell[data-hovered]:not([data-selected], [data-unavailable], [data-disabled]) {
    background-color: var(--surface-subtle);
  }
}

.sw-calendar-cell[data-focus-visible] {
  position: relative;
  z-index: 1;
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-calendar-cell[data-today] {
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.3em;
}

.sw-calendar-cell[data-selected] {
  border-color: var(--accent);
  background-color: var(--accent);
  color: var(--on-accent);
  font-weight: 500;
}

/* A range: solid start and end, a subtle fill between. */
.sw-range-calendar .sw-calendar-cell[data-selected]:not([data-selection-start], [data-selection-end]) {
  border-color: transparent;
  border-radius: 0;
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
  font-weight: 400;
}

.sw-calendar-cell[data-unavailable] {
  color: var(--text-muted);
  text-decoration-line: line-through;
  cursor: not-allowed;
}

.sw-calendar-cell[data-today][data-unavailable] {
  text-decoration-line: underline line-through;
}

.sw-calendar-cell[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-calendar-cell[data-outside-month] {
  visibility: hidden;
}

/* The popover a DatePicker opens: as tall and as wide as the calendar needs. */
.sw-calendar-popover {
  min-inline-size: 0;
  max-block-size: none;
  padding: var(--space-3);
}

.sw-calendar-dialog {
  outline: none;
}

@media (forced-colors: active) {
  .sw-calendar-cell[data-selected] {
    forced-color-adjust: none;
    border-color: Highlight;
    background-color: Highlight;
    color: HighlightText;
  }

  .sw-range-calendar .sw-calendar-cell[data-selected]:not([data-selection-start], [data-selection-end]) {
    forced-color-adjust: none;
    border-color: Highlight;
    background-color: Canvas;
    color: CanvasText;
  }
}
```

Import it after `combobox.css`:

```css
@import "./components/calendar.css" layer(raster.components);
```

- [ ] **Step 5: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS. (stylelint allows `Highlight`, `Canvas` and the other system colours only inside the forced-colours block, which is where they are.)

- [ ] **Step 6: Write the failing React tests.** In `packages/react/test/pickers.test.tsx`, add these imports at the top:

```tsx
import { isWeekend, parseDate } from "@internationalized/date";
import { act } from "react";
import { Calendar, RangeCalendar } from "../src/forms/Calendar";
```

and append:

```tsx
/** Moves focus onto a calendar day, as a click or Tab would, without selecting it. */
function focusDay(container: HTMLElement, selector: string) {
  const cell = container.querySelector<HTMLElement>(selector);
  if (!cell) throw new Error(`No day matches ${selector}`);
  act(() => cell.focus());
}

describe("Calendar", () => {
  it("shows the month of its value, with previous and next buttons", () => {
    const { container } = render(<Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} />);
    expect(container.querySelector(".sw-calendar")).not.toBeNull();
    expect(screen.getByRole("heading")).toHaveTextContent("March 2026");
    expect(screen.getByRole("button", { name: "Previous" })).toHaveClass("sw-calendar-nav");
    expect(screen.getByRole("button", { name: "Next" })).toHaveClass("sw-calendar-nav");
    expect(screen.getByRole("grid")).toHaveClass("sw-calendar-grid");
    expect(container.querySelector(".sw-calendar-cell[data-selected]")).toHaveTextContent("12");
  });

  it("moves by day with arrows and by month with Page Down, and selects with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} onChange={onChange} />,
    );
    focusDay(container, ".sw-calendar-cell[data-selected]");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("13");
    await user.keyboard("{PageDown}");
    expect(screen.getByRole("heading")).toHaveTextContent("April 2026");
    await user.keyboard("{Enter}");
    expect(String(onChange.mock.calls.at(-1)?.[0])).toBe("2026-04-13");
  });

  it("marks unavailable days and will not select them", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Delivery day"
        defaultValue={parseDate("2026-03-13")}
        isDateUnavailable={(date) => isWeekend(date, "de-CH")}
        onChange={onChange}
      />,
    );
    focusDay(container, ".sw-calendar-cell[data-selected]");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("14");
    expect(document.activeElement).toHaveAttribute("data-unavailable");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Calendar aria-label="Delivery day" defaultValue={parseDate("2026-03-12")} />);
    await expectAccessible(container);
  });
});

describe("RangeCalendar", () => {
  it("marks the start, the end and the days between", () => {
    const { container } = render(
      <RangeCalendar aria-label="Booking" defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }} />,
    );
    expect(container.querySelector(".sw-calendar.sw-range-calendar")).not.toBeNull();
    expect(container.querySelector(".sw-calendar-cell[data-selection-start]")).toHaveTextContent("9");
    expect(container.querySelector(".sw-calendar-cell[data-selection-end]")).toHaveTextContent("13");
    expect(container.querySelectorAll(".sw-calendar-cell[data-selected]")).toHaveLength(5);
  });
});
```

- [ ] **Step 7: Run them to see them fail.**

Run: `cd packages/react && npx vitest run test/pickers.test.tsx`
Expected: FAIL, cannot resolve `../src/forms/Calendar`.

- [ ] **Step 8: Write the component.** Create `packages/react/src/forms/Calendar.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RefAttributes } from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  type CalendarProps as AriaCalendarProps,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  type DateValue,
  Heading,
  RangeCalendar as AriaRangeCalendar,
  type RangeCalendarProps as AriaRangeCalendarProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

/**
 * The month heading between previous and next buttons, and the day grid. Shared by Calendar,
 * RangeCalendar and the calendars the date pickers open. React Aria names the buttons
 * ("Previous", "Next") and the grid (the calendar's label and the month).
 */
export function CalendarBody() {
  return (
    <>
      <header className="sw-calendar-header">
        <AriaButton slot="previous" className="sw-calendar-nav">
          <ChevronLeft aria-hidden="true" />
        </AriaButton>
        <Heading className="sw-calendar-heading" />
        <AriaButton slot="next" className="sw-calendar-nav">
          <ChevronRight aria-hidden="true" />
        </AriaButton>
      </header>
      <CalendarGrid className="sw-calendar-grid" weekdayStyle="narrow">
        <CalendarGridHeader>
          {(day) => <CalendarHeaderCell className="sw-calendar-weekday">{day}</CalendarHeaderCell>}
        </CalendarGridHeader>
        <CalendarGridBody>{(date) => <CalendarCell date={date} className="sw-calendar-cell" />}</CalendarGridBody>
      </CalendarGrid>
    </>
  );
}

export type CalendarProps<T extends DateValue> = Omit<AriaCalendarProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
  };

/**
 * A month of days to choose one from. Needs aria-label (or aria-labelledby) when it stands alone.
 * Values are CalendarDate objects from @internationalized/date, such as parseDate("2026-03-12").
 * There is no native twin: without React, use <input type="date"> (see DatePicker).
 */
export function Calendar<T extends DateValue>({ className, ...rest }: CalendarProps<T>) {
  return (
    <AriaCalendar className={cx("sw-calendar", className)} {...rest}>
      <CalendarBody />
    </AriaCalendar>
  );
}

export type RangeCalendarProps<T extends DateValue> = Omit<AriaRangeCalendarProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
  };

/** A month of days to choose a range from: solid start and end, a subtle fill between. */
export function RangeCalendar<T extends DateValue>({ className, ...rest }: RangeCalendarProps<T>) {
  return (
    <AriaRangeCalendar className={cx("sw-calendar sw-range-calendar", className)} {...rest}>
      <CalendarBody />
    </AriaRangeCalendar>
  );
}
```

Export it after the ComboBox export:

```ts
export { Calendar, type CalendarProps, RangeCalendar, type RangeCalendarProps } from "./forms/Calendar";
```

`CalendarBody` stays internal (Task 3 imports it from the file). Add `"Calendar", "RangeCalendar",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 9: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. If a test finds the month heading or the Previous and Next names in another wording, the cause is jsdom's locale; it is `en-US` by default, which gives "March 2026", "Previous" and "Next".

- [ ] **Step 10: Commit.**

```bash
git add packages/css packages/react pnpm-lock.yaml
git commit -m "feat: Calendar and RangeCalendar on a seven-column grid"
```

---
### Task 3: DatePicker and DateRangePicker (CSS and React)

**Files:**
- Create: `packages/css/src/components/date-picker.css`, `packages/react/src/forms/DatePicker.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/pickers.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("date picker", () => {
  it("lays the segments and the calendar button out in one input", () => {
    const r = rule(".sw-date-field");
    expect(r).toMatch(/display:\s*flex/);
    expect(r).toMatch(/padding-block:\s*0/);
    expect(r).toMatch(/padding-inline-end:\s*0/);
  });

  it("rings the whole field while a segment has keyboard focus", () => {
    expect(rule(".sw-date-field[data-focus-visible]")).toMatch(/outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });

  it("marks an invalid field with a thicker leading edge as well as colour", () => {
    const r = rule(".sw-date-field[data-invalid]");
    expect(r).toMatch(/border-color:\s*var\(--danger\)/);
    expect(r).toMatch(/border-inline-start-width:\s*4px/);
  });

  it("fills the focused segment with the accent, and keeps it visible in forced colours", () => {
    expect(rule(".sw-date-segment[data-focused]")).toMatch(/background-color:\s*var\(--accent\)/);
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-date-segment\[data-focused\]\s*\{[^}]*forced-color-adjust:\s*none[^}]*background-color:\s*highlight/i,
    );
  });

  it("puts the calendar button behind a hairline at the inline end", () => {
    const r = rule(".sw-date-button");
    expect(r).toMatch(/inline-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border-inline-start:\s*1px solid var\(--border\)/);
  });

  it("sets a native date range as two fields side by side that wrap", () => {
    expect(rule(".sw-date-range-fields")).toMatch(/flex-wrap:\s*wrap/);
    expect(rule(".sw-date-range-native")).toMatch(/border:\s*0/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test`
Expected: FAIL with `No rule for .sw-date-field`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/date-picker.css`:

```css
/*
 * DatePicker and DateRangePicker.
 * React route: a React Aria Group with class "sw-input sw-date-field" holds the date segments and a
 * calendar button; the calendar opens in .sw-popover.sw-calendar-popover (calendar.css).
 * Native route: <input type="date" class="sw-input sw-date-native">; a range is two of them in
 * <fieldset class="sw-field sw-date-range-native"> with a legend.
 */
.sw-date-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-block: 0;
  padding-inline-end: 0;
}

.sw-date-field[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-date-field[data-invalid] {
  border-color: var(--danger);
  border-inline-start-width: 4px;
}

.sw-date-input {
  display: flex;
  flex: 1;
  align-items: center;
  min-inline-size: 0;
  font-variant-numeric: tabular-nums;
}

.sw-date-segment {
  padding-inline: 0.0625rem;
  border-radius: 2px;
  color: var(--text-primary);
  caret-color: transparent;
  outline: none;
}

.sw-date-segment[data-type="literal"] {
  padding-inline: 0;
  color: var(--text-secondary);
}

.sw-date-segment[data-placeholder] {
  color: var(--text-muted);
}

.sw-date-segment[data-focused] {
  background-color: var(--accent);
  color: var(--on-accent);
}

.sw-date-range-dash {
  color: var(--text-secondary);
}

.sw-date-button {
  position: relative;
  display: grid;
  flex: none;
  align-self: stretch;
  place-items: center;
  inline-size: var(--control-height);
  padding: 0;
  border: 0;
  border-inline-start: 1px solid var(--border);
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
}

/* Extend the hit area to the 44px touch target. */
.sw-date-button::before {
  content: "";
  position: absolute;
  inset-block: calc((var(--control-height) - var(--target-min)) / 2);
  inset-inline: 0;
}

@media (hover: hover) {
  .sw-date-button:hover {
    color: var(--text-primary);
  }
}

.sw-date-button[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width) - 2px);
}

.sw-date-button svg {
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

/* Native route */
.sw-date-native {
  font-variant-numeric: tabular-nums;
}

.sw-date-native::-webkit-calendar-picker-indicator {
  cursor: pointer;
}

.sw-date-range-native {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.sw-date-range-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.sw-date-range-fields > .sw-field {
  flex: 1 1 10rem;
}

@media (forced-colors: active) {
  .sw-date-segment[data-focused] {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
```

Import it after `calendar.css`:

```css
@import "./components/date-picker.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/pickers.test.tsx`, add `waitFor` to the `@testing-library/react` import and add:

```tsx
import { DatePicker, DateRangePicker } from "../src/forms/DatePicker";
```

Then append:

```tsx
describe("DatePicker", () => {
  it("renders a labelled group of date segments with a calendar button", () => {
    const { container } = render(<DatePicker label="Delivery date" defaultValue={parseDate("2026-03-12")} />);
    expect(container.querySelector(":scope > :not(template)")).toHaveClass("sw-field", "sw-date-picker");
    const group = screen.getByRole("group", { name: "Delivery date" });
    expect(group).toHaveClass("sw-input", "sw-date-field");
    expect(within(group).getAllByRole("spinbutton").map((s) => s.textContent)).toEqual(["3", "12", "2026"]);
    expect(within(group).getByRole("button", { name: /Calendar/ })).toHaveClass("sw-date-button");
  });

  it("opens a calendar on its value and closes when a day is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Delivery date" defaultValue={parseDate("2026-03-12")} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Calendar/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.closest(".sw-popover")).toHaveClass("sw-calendar-popover");
    expect(within(dialog).getByRole("heading")).toHaveTextContent("March 2026");
    await user.click(within(dialog).getByText("20"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(String(onChange.mock.calls.at(-1)?.[0])).toBe("2026-03-20");
    expect(screen.getAllByRole("spinbutton")[1]).toHaveTextContent("20");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(
      <DatePicker label="Delivery date" description="From 2 March." defaultValue={parseDate("2026-03-12")} />,
    );
    await expectAccessible(container);
  });
});

describe("DateRangePicker", () => {
  const period = { start: parseDate("2026-03-09"), end: parseDate("2026-03-13") };

  it("renders start and end segments in one labelled group", () => {
    render(<DateRangePicker label="Project period" defaultValue={period} />);
    const group = screen.getByRole("group", { name: "Project period" });
    expect(within(group).getAllByRole("spinbutton").map((s) => s.textContent)).toEqual(["3", "9", "2026", "3", "13", "2026"]);
  });

  it("opens a range calendar showing the range", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Project period" defaultValue={period} />);
    await user.click(screen.getByRole("button", { name: /Calendar/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".sw-range-calendar")).not.toBeNull();
    expect(dialog.querySelector(".sw-calendar-cell[data-selection-start]")).toHaveTextContent("9");
    expect(dialog.querySelector(".sw-calendar-cell[data-selection-end]")).toHaveTextContent("13");
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `cd packages/react && npx vitest run test/pickers.test.tsx`
Expected: FAIL, cannot resolve `../src/forms/DatePicker`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/DatePicker.tsx`:

```tsx
import { Calendar as CalendarIcon } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  DateInput,
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  DateRangePicker as AriaDateRangePicker,
  type DateRangePickerProps as AriaDateRangePickerProps,
  DateSegment,
  type DateValue,
  Dialog,
  Group,
  Popover,
  RangeCalendar as AriaRangeCalendar,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { CalendarBody } from "./Calendar";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

type FieldText = {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
};

/** Day, month and year segments, in the order and with the separators of the reader's locale. */
function Segments({ slot }: { slot?: "start" | "end" }) {
  return (
    <DateInput slot={slot} className="sw-date-input">
      {(segment) => <DateSegment segment={segment} className="sw-date-segment" />}
    </DateInput>
  );
}

/** React Aria names this button "Calendar". */
function CalendarButton() {
  return (
    <AriaButton className="sw-date-button">
      <CalendarIcon aria-hidden="true" />
    </AriaButton>
  );
}

export type DatePickerProps<T extends DateValue> = Omit<AriaDatePickerProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> &
  FieldText;

/**
 * A date field: type into the day, month and year segments (arrow keys step them), or open the
 * calendar from the button. Values are CalendarDate objects from @internationalized/date.
 * Native twin: <input type="date">, whose calendar is the browser's own.
 */
export function DatePicker<T extends DateValue>({ label, description, errorMessage, className, ...rest }: DatePickerProps<T>) {
  return (
    <AriaDatePicker className={cx("sw-field sw-date-picker", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-input sw-date-field">
        <Segments />
        <CalendarButton />
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover sw-calendar-popover" placement="bottom start">
        <Dialog className="sw-calendar-dialog">
          <AriaCalendar className="sw-calendar">
            <CalendarBody />
          </AriaCalendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

export type DateRangePickerProps<T extends DateValue> = Omit<AriaDateRangePickerProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> &
  FieldText;

/**
 * A start and an end date in one field, with a range calendar.
 * Native twin: two <input type="date"> fields, From and To, in a fieldset with a legend.
 */
export function DateRangePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  className,
  ...rest
}: DateRangePickerProps<T>) {
  return (
    <AriaDateRangePicker className={cx("sw-field sw-date-picker sw-date-range-picker", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-input sw-date-field">
        <Segments slot="start" />
        <span className="sw-date-range-dash" aria-hidden="true">
          –
        </span>
        <Segments slot="end" />
        <CalendarButton />
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover sw-calendar-popover" placement="bottom start">
        <Dialog className="sw-calendar-dialog">
          <AriaRangeCalendar className="sw-calendar sw-range-calendar">
            <CalendarBody />
          </AriaRangeCalendar>
        </Dialog>
      </Popover>
    </AriaDateRangePicker>
  );
}
```

Export it after the Calendar export:

```ts
export { DatePicker, type DatePickerProps, DateRangePicker, type DateRangePickerProps } from "./forms/DatePicker";
```

Add `"DatePicker", "DateRangePicker",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: DatePicker and DateRangePicker with a calendar popover"
```

---

### Task 4: FileUpload (CSS and React)

**Files:**
- Create: `packages/css/src/components/file-upload.css`, `packages/react/src/forms/FileUpload.tsx`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/react/test/pickers.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("file upload", () => {
  it("draws the drop zone with a dashed hairline", () => {
    expect(rule(".sw-file-drop")).toMatch(/border:\s*1px dashed var\(--border-strong\)/);
  });

  it("shows a drag-over by a solid border and a fill, not colour alone", () => {
    const r = rule(".sw-file-drop[data-drop-target]");
    expect(r).toMatch(/border-style:\s*solid/);
    expect(r).toMatch(/background-color:\s*var\(--accent-subtle\)/);
  });

  it("makes the native file input itself the drop zone", () => {
    const r = rule(".sw-file-input");
    expect(r).toMatch(/inline-size:\s*100%/);
    expect(r).toMatch(/border:\s*1px dashed var\(--border-strong\)/);
  });

  it("styles the native choose button as a Raster button", () => {
    // Lightning CSS may also print a -webkit-file-upload-button copy; the standard one must exist.
    expect(css).toMatch(/\.sw-file-input::file-selector-button\s*\{[^}]*border:\s*1px solid var\(--border-strong\)/);
  });

  it("lists files between hairlines, with the size in mono", () => {
    expect(rule(".sw-file-item")).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-file-size")).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(rule(".sw-file-name")).toMatch(/text-overflow:\s*ellipsis/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test`
Expected: FAIL with `No rule for .sw-file-drop`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/file-upload.css`:

```css
/*
 * FileUpload.
 * React route: a React Aria DropZone (.sw-file-drop) holding an icon, a line of text and the
 * Choose files button; chosen files are listed below in .sw-file-list.
 * Native route: <input type="file" class="sw-file-input"> is itself the drop zone. Browsers accept
 * files dropped on it and show the chosen names beside its button, so no script is needed.
 */
.sw-file-drop {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding-block: var(--space-6);
  padding-inline: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--text-secondary);
  text-align: center;
}

.sw-file-drop > svg {
  inline-size: 1.5rem;
  block-size: 1.5rem;
  stroke-width: 1.5;
}

.sw-file-drop[data-drop-target] {
  border-style: solid;
  border-color: var(--accent);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

.sw-file-drop[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

/* Native route */
.sw-file-input {
  inline-size: 100%;
  padding-block: var(--space-6);
  padding-inline: var(--space-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--text-secondary);
  font-size: var(--text-body-size);
  cursor: pointer;
}

.sw-file-input::file-selector-button {
  min-block-size: var(--control-height);
  margin-inline-end: var(--space-3);
  padding-inline: var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--text-primary);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

/* The list of chosen files */
.sw-file-list {
  display: grid;
  margin: 0;
  padding: 0;
  border-block-start: 1px solid var(--border);
  list-style: none;
}

.sw-file-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--space-3);
  row-gap: var(--space-1);
  padding-block: var(--space-2);
  border-block-end: 1px solid var(--border);
}

.sw-file-meta {
  display: grid;
  min-inline-size: 0;
}

.sw-file-name {
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sw-file-size {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-caption-size);
  font-variant-numeric: tabular-nums;
}

.sw-file-item > .sw-progress-bar {
  grid-column: 1 / -1;
}

@media (forced-colors: active) {
  .sw-file-drop[data-drop-target] {
    border-color: Highlight;
  }
}
```

The progress bar under a row is the `<progress class="sw-progress-bar">` from Plan 7c, which already has its forced-colours rule.

Import it after `date-picker.css`:

```css
@import "./components/file-upload.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/pickers.test.tsx`, add `useState` from `react` to the existing `act` import (`import { act, useState } from "react";`) and add:

```tsx
import { acceptsFile, FileUpload, type FileUploadEntry, formatFileSize } from "../src/forms/FileUpload";
```

Then append:

```tsx
describe("formatFileSize", () => {
  it("uses decimal units in the reader's locale", () => {
    expect(formatFileSize(820_000, "en-US")).toBe("820 kB");
    expect(formatFileSize(1_200_000, "en-US")).toBe("1.2 MB");
  });
});

describe("acceptsFile", () => {
  it("matches MIME types, wildcards and extensions", () => {
    const pdf = { name: "Cover.PDF", type: "application/pdf" };
    expect(acceptsFile(pdf, undefined)).toBe(true);
    expect(acceptsFile(pdf, ["application/pdf"])).toBe(true);
    expect(acceptsFile(pdf, [".pdf"])).toBe(true);
    expect(acceptsFile(pdf, ["image/*"])).toBe(false);
    expect(acceptsFile({ name: "a.png", type: "image/png" }, ["image/*"])).toBe(true);
  });
});

describe("FileUpload", () => {
  function Proofs() {
    const [files, setFiles] = useState<FileUploadEntry[]>([
      { id: "cover", name: "cover.pdf", size: 820_000 },
      { id: "spread", name: "spread-04.png", size: 2_400_000, progress: 40 },
    ]);
    return (
      <FileUpload
        label="Proofs"
        description="PDF or PNG, up to 10 MB."
        acceptedFileTypes={["application/pdf", "image/png"]}
        allowsMultiple
        maxSize={10_000_000}
        files={files}
        onAdd={(added) => setFiles((current) => [...current, ...added.map((f) => ({ id: f.name, name: f.name, size: f.size }))])}
        onRemove={(id) => setFiles((current) => current.filter((f) => f.id !== id))}
      />
    );
  }

  it("renders a drop zone with a Choose files button named with the field label", () => {
    const { container } = render(<Proofs />);
    expect(container.firstElementChild).toHaveClass("sw-field", "sw-file-upload");
    expect(container.querySelector(".sw-file-drop")).not.toBeNull();
    const choose = screen.getByRole("button", { name: "Choose files Proofs" });
    expect(choose).toHaveAccessibleDescription("PDF or PNG, up to 10 MB.");
  });

  it("lists files with their size, a named Remove button and progress while uploading", () => {
    render(<Proofs />);
    const list = screen.getByRole("list", { name: "Proofs" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("820 kB")).toHaveClass("sw-file-size");
    expect(within(list).getByText("2.4 MB · 40%")).toHaveClass("sw-file-size");
    expect(within(list).getByRole("progressbar", { name: "Uploading spread-04.png" })).toHaveValue(40);
    expect(within(list).getByRole("button", { name: "Remove cover.pdf" })).toHaveClass("sw-file-remove");
  });

  it("adds chosen files and refuses the wrong type or size with a message", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<Proofs />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("No file input");
    await user.upload(input, [
      new File(["%PDF"], "index.pdf", { type: "application/pdf" }),
      new File(["x"], "notes.txt", { type: "text/plain" }),
      new File([new Uint8Array(10_000_001)], "scan.png", { type: "image/png" }),
    ]);
    expect(screen.getByText("index.pdf")).toHaveClass("sw-file-name");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("notes.txt is not an accepted type.");
    expect(alert).toHaveTextContent("scan.png is larger than 10 MB.");
  });

  it("moves focus to the next Remove button, then to Choose files when the list is empty", async () => {
    const user = userEvent.setup();
    render(<Proofs />);
    await user.click(screen.getByRole("button", { name: "Remove cover.pdf" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove spread-04.png" })).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Remove spread-04.png" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Choose files Proofs" })).toHaveFocus());
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Proofs />);
    await expectAccessible(container);
  });
});
```

If `user.upload` refuses the input because React Aria hides it with `display: none`, use `fireEvent.change(input, { target: { files: [...] } })` from `@testing-library/react` instead, with the same three files.

- [ ] **Step 6: Run them to see them fail.**

Run: `cd packages/react && npx vitest run test/pickers.test.tsx`
Expected: FAIL, cannot resolve `../src/forms/FileUpload`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/forms/FileUpload.tsx`:

```tsx
import { Upload } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { DropZone, type DropZoneProps, FileTrigger, isFileDropItem, Text } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

/** A file the app is holding: chosen, uploading (progress 0–100) or uploaded. */
export type FileUploadEntry = { id: string; name: string; size: number; progress?: number };

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** A file size in decimal units, as the reader's locale writes them: "820 kB", "1.2 MB". */
export function formatFileSize(bytes: number, locale?: string): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: UNITS[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

/** Whether a file matches an accept list of MIME types ("image/png"), wildcards ("image/*") or extensions (".pdf"). */
export function acceptsFile(file: { name: string; type: string }, accepted: readonly string[] | undefined): boolean {
  if (!accepted || accepted.length === 0) return true;
  const name = file.name.toLowerCase();
  return accepted.some((rule) => {
    const r = rule.trim().toLowerCase();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return file.type.toLowerCase().startsWith(r.slice(0, -1));
    return file.type.toLowerCase() === r;
  });
}

export type FileUploadProps = {
  /** Names the Choose files button and the list of files. */
  label: ReactNode;
  /** The limits, such as "PDF or PNG, up to 10 MB."; describes the Choose files button. */
  description?: ReactNode;
  /** MIME types, wildcards or extensions, as for the accept attribute. */
  acceptedFileTypes?: string[];
  allowsMultiple?: boolean;
  /** Largest accepted file, in bytes. */
  maxSize?: number;
  /** The files to list. The app owns them: add on onAdd, remove on onRemove, set progress while uploading. */
  files: FileUploadEntry[];
  /** Called with the accepted files, from the button or a drop. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** Defaults to "Choose files". */
  buttonLabel?: string;
  /** Defaults to "Drop files here, or". */
  dropLabel?: string;
  /** Shown while files are dragged over. Defaults to "Drop to add". */
  dropActiveLabel?: string;
  className?: string;
};

/**
 * A drop zone with a Choose files button, and the list of chosen files with size, Remove and
 * optional upload progress. Refused files are reported in an alert. Removing a file moves focus to
 * the next Remove button, or to Choose files when none is left.
 * Native twin: <input type="file" class="sw-file-input">, which is itself the drop zone.
 */
export function FileUpload({
  label,
  description,
  acceptedFileTypes,
  allowsMultiple = false,
  maxSize,
  files,
  onAdd,
  onRemove,
  buttonLabel = "Choose files",
  dropLabel = "Drop files here, or",
  dropActiveLabel = "Drop to add",
  className,
}: FileUploadProps) {
  const labelId = useId();
  const descriptionId = useId();
  const buttonId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const removedIndex = useRef<number | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const add = (chosen: File[]) => {
    const accepted: File[] = [];
    const refused: string[] = [];
    for (const file of chosen) {
      if (!acceptsFile(file, acceptedFileTypes)) refused.push(`${file.name} is not an accepted type.`);
      else if (maxSize != null && file.size > maxSize) refused.push(`${file.name} is larger than ${formatFileSize(maxSize)}.`);
      else accepted.push(file);
    }
    setProblems(refused);
    if (accepted.length > 0) onAdd(allowsMultiple ? accepted : accepted.slice(0, 1));
  };

  const onDrop: DropZoneProps["onDrop"] = async (event) => {
    add(await Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile())));
  };

  // After a removal, keep keyboard users in place: the next Remove button, else Choose files.
  useEffect(() => {
    if (removedIndex.current == null) return;
    const buttons = listRef.current?.querySelectorAll<HTMLElement>(".sw-file-remove") ?? [];
    const target = buttons[Math.min(removedIndex.current, buttons.length - 1)] ?? document.getElementById(buttonId);
    removedIndex.current = null;
    target?.focus();
  }, [files, buttonId]);

  return (
    <div className={cx("sw-field sw-file-upload", className)}>
      <span className="sw-field-label" id={labelId}>
        {label}
      </span>
      <DropZone className="sw-file-drop" onDrop={onDrop}>
        {({ isDropTarget }) => (
          <>
            <Upload aria-hidden="true" />
            <Text slot="label" className="sw-file-drop-text">
              {isDropTarget ? dropActiveLabel : dropLabel}
            </Text>
            <FileTrigger
              acceptedFileTypes={acceptedFileTypes}
              allowsMultiple={allowsMultiple}
              onSelect={(list) => add(Array.from(list ?? []))}
            >
              <Button
                id={buttonId}
                aria-labelledby={`${buttonId} ${labelId}`}
                aria-describedby={description != null ? descriptionId : undefined}
              >
                {buttonLabel}
              </Button>
            </FileTrigger>
          </>
        )}
      </DropZone>
      {description != null && (
        <span className="sw-field-description" id={descriptionId}>
          {description}
        </span>
      )}
      {problems.length > 0 && (
        <div className="sw-field-error" role="alert">
          {problems.map((problem) => (
            <p key={problem}>{problem}</p>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <ul ref={listRef} className="sw-file-list" aria-labelledby={labelId}>
          {files.map((file, index) => {
            const uploading = file.progress != null && file.progress < 100;
            return (
              <li key={file.id} className="sw-file-item">
                <div className="sw-file-meta">
                  <span className="sw-file-name">{file.name}</span>
                  <span className="sw-file-size">
                    {formatFileSize(file.size)}
                    {uploading ? ` · ${Math.round(file.progress ?? 0)}%` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="sw-file-remove"
                  aria-label={`Remove ${file.name}`}
                  onPress={() => {
                    removedIndex.current = index;
                    onRemove(file.id);
                  }}
                >
                  Remove
                </Button>
                {uploading && (
                  <progress
                    className="sw-progress-bar"
                    value={file.progress}
                    max={100}
                    aria-label={`Uploading ${file.name}`}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

`.sw-field-error` paragraphs inherit the reset's zero margins; if they show a gap, add `.sw-field-error > p { margin: 0; }` to `file-upload.css` with a CSS test.

Export it after the DatePicker export:

```ts
export { acceptsFile, FileUpload, type FileUploadEntry, type FileUploadProps, formatFileSize } from "./forms/FileUpload";
```

Add `"FileUpload", "formatFileSize", "acceptsFile",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: FileUpload with a drop zone and a list of files"
```

---

### Task 5: Docs pages for ComboBox, DatePicker and DateRangePicker

**Files:**
- Modify: `apps/docs/package.json` (dependency)
- Create: `apps/docs/src/demos/combobox/City.tsx`, `apps/docs/src/demos/combobox/city.html`, `apps/docs/src/demos/date-picker/Delivery.tsx`, `apps/docs/src/demos/date-picker/delivery.html`, `apps/docs/src/demos/date-range-picker/Period.tsx`, `apps/docs/src/demos/date-range-picker/period.html`, `apps/docs/src/content/components/combobox.mdx`, `apps/docs/src/content/components/date-picker.mdx`, `apps/docs/src/content/components/date-range-picker.mdx`

- [ ] **Step 1: Add the date library to the docs.** The demos build dates with it.

Run: `pnpm --filter @raster/docs add @internationalized/date@3.12.4`
Expected: `apps/docs/package.json` lists it under dependencies.

- [ ] **Step 2: Write the ComboBox demos.** Create `apps/docs/src/demos/combobox/City.tsx`:

```tsx
import { ComboBox, ComboBoxItem } from "@raster/react";

const CITIES = ["Basel", "Bern", "Biel/Bienne", "Geneva", "Lausanne", "Lucerne", "Lugano", "St. Gallen", "Winterthur", "Zürich"];

export default function City() {
  return (
    <ComboBox label="City" placeholder="Type to filter" description="Studios in ten Swiss cities.">
      {CITIES.map((city) => (
        <ComboBoxItem key={city} id={city}>
          {city}
        </ComboBoxItem>
      ))}
    </ComboBox>
  );
}
```

Create `apps/docs/src/demos/combobox/city.html`:

```html
<div class="sw-field sw-combobox">
  <label class="sw-field-label" for="city">City</label>
  <input class="sw-input sw-combobox-input" type="text" id="city" name="city" list="cities" autocomplete="off" placeholder="Type to filter" aria-describedby="city-description" />
  <datalist id="cities">
    <option value="Basel"></option>
    <option value="Bern"></option>
    <option value="Biel/Bienne"></option>
    <option value="Geneva"></option>
    <option value="Lausanne"></option>
    <option value="Lucerne"></option>
    <option value="Lugano"></option>
    <option value="St. Gallen"></option>
    <option value="Winterthur"></option>
    <option value="Zürich"></option>
  </datalist>
  <span class="sw-field-description" id="city-description">Studios in ten Swiss cities.</span>
</div>
```

- [ ] **Step 3: Write the ComboBox page.** Create `apps/docs/src/content/components/combobox.mdx`:

```mdx
---
title: ComboBox
group: Forms
order: 13
summary: Type to filter a list of suggestions, then choose one with the arrow keys and Enter.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: children
    type: ComboBoxItem elements, or (item) => ReactNode
    description: The suggestions. With a render function, pass the data as defaultItems or items.
  - name: placeholder / description / errorMessage
    type: string / ReactNode / ReactNode
    description: A hint inside the input, help text, and the message shown when the field is invalid.
  - name: selectedKey / defaultSelectedKey / onSelectionChange
    type: Key / Key / (key) => void
    description: The chosen suggestion, controlled or starting, and its change handler.
  - name: inputValue / onInputChange
    type: string / (value) => void
    description: The typed text, controlled, and its change handler.
  - name: allowsCustomValue
    type: boolean
    default: "false"
    description: Keep text that matches no suggestion, as the native route always does.
a11y:
  - The input has the combobox role and its label; the open list is a listbox, and arrow keys move through it while focus stays in the input.
  - Escape closes the list; Enter chooses the highlighted suggestion.
  - The chosen suggestion is set in weight 500 with a check mark, not colour alone.
  - Without React, the suggestion list belongs to the browser. It cannot be styled, it is announced differently by each browser, and it accepts any text, so validate the value when the form is sent.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import City from "../../demos/combobox/City";
import citySource from "../../demos/combobox/City.tsx?raw";
import cityHtml from "../../demos/combobox/city.html?raw";

<Example title="City" source={citySource}>
  <City client:load />
</Example>

<NativeExample title="City without React" html={cityHtml} />

Use a ComboBox when the list is too long to scan in a Select, roughly more than fifteen items, or when people know what they are looking for. For a short list, use Select or RadioGroup.
```

- [ ] **Step 4: Write the DatePicker demos.** Create `apps/docs/src/demos/date-picker/Delivery.tsx`:

```tsx
import { parseDate } from "@internationalized/date";
import { DatePicker } from "@raster/react";

export default function Delivery() {
  return (
    <DatePicker
      label="Delivery date"
      description="From 2 March 2026."
      defaultValue={parseDate("2026-03-12")}
      minValue={parseDate("2026-03-02")}
    />
  );
}
```

Create `apps/docs/src/demos/date-picker/delivery.html`:

```html
<div class="sw-field">
  <label class="sw-field-label" for="delivery">Delivery date</label>
  <input class="sw-input sw-date-native" type="date" id="delivery" name="delivery" value="2026-03-12" min="2026-03-02" aria-describedby="delivery-description" />
  <span class="sw-field-description" id="delivery-description">From 2 March 2026.</span>
</div>
```

- [ ] **Step 5: Write the DatePicker page.** Create `apps/docs/src/content/components/date-picker.mdx`:

```mdx
---
title: DatePicker
group: Forms
order: 14
summary: A date typed into day, month and year segments, or chosen from a calendar.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: value / defaultValue / onChange
    type: DateValue / DateValue / (value) => void
    description: The date, controlled or starting, and its change handler. Build dates with parseDate from @internationalized/date.
  - name: minValue / maxValue
    type: DateValue
    description: The earliest and latest dates allowed.
  - name: isDateUnavailable
    type: (date) => boolean
    description: Days that cannot be chosen, such as weekends; they are struck through in the calendar.
  - name: description / errorMessage
    type: ReactNode
    description: Help text, and the message shown when the date is invalid.
a11y:
  - The field is a labelled group of spin buttons, one per segment; arrow keys step a segment and typing replaces it.
  - The calendar button opens a dialog. Focus moves to the chosen day; arrow keys move by day, Page Up and Page Down by month, Enter chooses and Escape closes, returning focus to the button.
  - Segments follow the reader's locale, so 12 March 2026 reads 3/12/2026 in American English and 12.3.2026 in Swiss German.
  - Without React, use a date input. Its calendar is the browser's own; min and max limit it, but unavailable days cannot be marked.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Delivery from "../../demos/date-picker/Delivery";
import deliverySource from "../../demos/date-picker/Delivery.tsx?raw";
import deliveryHtml from "../../demos/date-picker/delivery.html?raw";

<Example title="Delivery date" source={deliverySource}>
  <Delivery client:load />
</Example>

<NativeExample title="Delivery date without React" html={deliveryHtml} />

For a period with a start and an end, use DateRangePicker. To show a month on the page itself, use Calendar.
```

- [ ] **Step 6: Write the DateRangePicker demos.** Create `apps/docs/src/demos/date-range-picker/Period.tsx`:

```tsx
import { parseDate } from "@internationalized/date";
import { DateRangePicker } from "@raster/react";

export default function Period() {
  return (
    <DateRangePicker
      label="Project period"
      description="Five working days."
      defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }}
    />
  );
}
```

Create `apps/docs/src/demos/date-range-picker/period.html`:

```html
<fieldset class="sw-field sw-date-range-native" aria-describedby="period-description">
  <legend class="sw-field-label">Project period</legend>
  <div class="sw-date-range-fields">
    <div class="sw-field">
      <label class="sw-field-label" for="period-start">From</label>
      <input class="sw-input sw-date-native" type="date" id="period-start" name="start" value="2026-03-09" />
    </div>
    <div class="sw-field">
      <label class="sw-field-label" for="period-end">To</label>
      <input class="sw-input sw-date-native" type="date" id="period-end" name="end" value="2026-03-13" min="2026-03-09" />
    </div>
  </div>
  <span class="sw-field-description" id="period-description">Five working days.</span>
</fieldset>
```

- [ ] **Step 7: Write the DateRangePicker page.** Create `apps/docs/src/content/components/date-range-picker.mdx`:

```mdx
---
title: DateRangePicker
group: Forms
order: 15
summary: A start and an end date in one field, with a range calendar.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. Names the whole range.
  - name: value / defaultValue / onChange
    type: "{ start, end } of DateValue / … / (range) => void"
    description: The range, controlled or starting, and its change handler.
  - name: minValue / maxValue / isDateUnavailable
    type: DateValue / DateValue / (date) => boolean
    description: Limits, as for DatePicker.
  - name: description / errorMessage
    type: ReactNode
    description: Help text, and the message shown when the range is invalid.
a11y:
  - The start and end segments sit in one labelled group, so the label is announced for both.
  - In the calendar, Enter on a day starts the range and Enter on a second day ends it; the start and end are solid, the days between have a subtle fill.
  - Without React, use two date inputs, From and To, in a fieldset whose legend names the range. Set the To field's min to the From date if the form must enforce the order.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Period from "../../demos/date-range-picker/Period";
import periodSource from "../../demos/date-range-picker/Period.tsx?raw";
import periodHtml from "../../demos/date-range-picker/period.html?raw";

<Example title="Project period" source={periodSource}>
  <Period client:load />
</Example>

<NativeExample title="Project period without React" html={periodHtml} />
```

- [ ] **Step 8: Build and check the pages.**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`
Expected: `66 page(s) built`.

Run: `cd apps/docs && npx playwright test --project=chromium -g "/components/(combobox|date-picker|date-range-picker)/"`
Expected: PASS (structure, 320px reflow and axe in four combinations for each page). If axe reports the native range fieldset's `aria-describedby` as not allowed, move the description out of the fieldset and point the two inputs' `aria-describedby` at it instead.

- [ ] **Step 9: Commit.**

```bash
git add apps/docs pnpm-lock.yaml
git commit -m "docs: ComboBox, DatePicker and DateRangePicker pages"
```

---

### Task 6: Docs pages for Calendar and FileUpload

**Files:**
- Create: `apps/docs/src/demos/calendar/DeliveryDay.tsx`, `apps/docs/src/demos/calendar/Booking.tsx`, `apps/docs/src/demos/file-upload/Proofs.tsx`, `apps/docs/src/demos/file-upload/proofs.html`, `apps/docs/src/content/components/calendar.mdx`, `apps/docs/src/content/components/file-upload.mdx`

- [ ] **Step 1: Write the Calendar demos.** Create `apps/docs/src/demos/calendar/DeliveryDay.tsx`:

```tsx
import { isWeekend, parseDate } from "@internationalized/date";
import { Calendar } from "@raster/react";

export default function DeliveryDay() {
  return (
    <Calendar
      aria-label="Delivery day"
      defaultValue={parseDate("2026-03-12")}
      isDateUnavailable={(date) => isWeekend(date, "de-CH")}
    />
  );
}
```

Create `apps/docs/src/demos/calendar/Booking.tsx`:

```tsx
import { parseDate } from "@internationalized/date";
import { RangeCalendar } from "@raster/react";

export default function Booking() {
  return <RangeCalendar aria-label="Booking" defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }} />;
}
```

- [ ] **Step 2: Write the Calendar page.** Create `apps/docs/src/content/components/calendar.mdx`:

```mdx
---
title: Calendar
group: Forms
order: 16
summary: A month of days on the page, to choose one day or a range.
interactive: true
props:
  - name: aria-label
    type: string
    description: Required when the calendar stands alone. The grid is named with it and the month.
  - name: value / defaultValue / onChange
    type: DateValue / DateValue / (value) => void
    description: The chosen day, controlled or starting, and its change handler. RangeCalendar takes { start, end }.
  - name: minValue / maxValue / isDateUnavailable
    type: DateValue / DateValue / (date) => boolean
    description: Limits. Unavailable days stay focusable but cannot be chosen.
a11y:
  - The month is a grid; arrow keys move by day, Page Up and Page Down by month, Home and End to the start and end of the week, Enter chooses.
  - Today is underlined; the chosen day is filled and set in weight 500; unavailable days are struck through. None of these relies on colour alone, and in forced-colours mode the chosen day uses the system highlight.
  - The previous and next buttons are named Previous and Next and mirror in right-to-left text.
  - There is no native calendar element. Without React, use a date input, whose calendar is the browser's own (see DatePicker).
---
import Example from "../../components/Example.astro";
import Booking from "../../demos/calendar/Booking";
import bookingSource from "../../demos/calendar/Booking.tsx?raw";
import DeliveryDay from "../../demos/calendar/DeliveryDay";
import deliveryDaySource from "../../demos/calendar/DeliveryDay.tsx?raw";

<Example title="Delivery day" source={deliveryDaySource}>
  <DeliveryDay client:load />
</Example>

Weekends are unavailable in this example.

<Example title="Booking" source={bookingSource}>
  <Booking client:load />
</Example>

A Calendar on the page suits choosing among a few weeks, such as a booking. For a date inside a form, use DatePicker, which keeps the calendar in a popover.
```

- [ ] **Step 3: Write the FileUpload demos.** Create `apps/docs/src/demos/file-upload/Proofs.tsx`:

```tsx
import { FileUpload, type FileUploadEntry } from "@raster/react";
import { useState } from "react";

export default function Proofs() {
  const [files, setFiles] = useState<FileUploadEntry[]>([
    { id: "cover", name: "cover.pdf", size: 820_000 },
    { id: "spread", name: "spread-04.png", size: 2_400_000, progress: 40 },
  ]);
  return (
    <FileUpload
      label="Proofs"
      description="PDF or PNG, up to 10 MB."
      acceptedFileTypes={["application/pdf", "image/png"]}
      allowsMultiple
      maxSize={10_000_000}
      files={files}
      onAdd={(added) =>
        setFiles((current) => [
          ...current,
          ...added.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size })),
        ])
      }
      onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
    />
  );
}
```

Create `apps/docs/src/demos/file-upload/proofs.html`:

```html
<div class="sw-field sw-file-upload">
  <label class="sw-field-label" for="proofs">Proofs</label>
  <input class="sw-file-input" type="file" id="proofs" name="proofs" multiple accept="application/pdf,image/png" aria-describedby="proofs-description" />
  <span class="sw-field-description" id="proofs-description">Drop files on the box or choose them. PDF or PNG, up to 10 MB.</span>
</div>
```

- [ ] **Step 4: Write the FileUpload page.** Create `apps/docs/src/content/components/file-upload.mdx`:

```mdx
---
title: FileUpload
group: Forms
order: 17
summary: A drop zone with a Choose files button, and the list of chosen files.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. Names the Choose files button and the list.
  - name: files
    type: "{ id, name, size, progress? }[]"
    description: Required. The files to list; the app owns them and sets progress while uploading.
  - name: onAdd / onRemove
    type: (files) => void / (id) => void
    description: Required. Called with accepted files from the button or a drop, and when Remove is pressed.
  - name: acceptedFileTypes / maxSize / allowsMultiple
    type: string[] / number / boolean
    description: Limits. Refused files are named in an alert.
  - name: description
    type: ReactNode
    description: The limits in words; it describes the Choose files button.
  - name: buttonLabel / dropLabel / dropActiveLabel
    type: string
    default: '"Choose files" / "Drop files here, or" / "Drop to add"'
    description: The zone's words.
a11y:
  - Choose files is a button named with the field label, and described by the limits. Dropping is never the only way to add a file.
  - While files are dragged over, the border turns solid, the zone fills and its text changes to "Drop to add", so the state is not colour alone.
  - Each Remove button is named with its file. Removing one moves focus to the next Remove button, or to Choose files when the list is empty.
  - Refused files are named in an alert, with the reason.
  - Without React, the file input is itself the drop zone. Browsers accept dropped files on it and announce the chosen files; there is no drag-over state, and size limits must be checked when the form is sent.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Proofs from "../../demos/file-upload/Proofs";
import proofsSource from "../../demos/file-upload/Proofs.tsx?raw";
import proofsHtml from "../../demos/file-upload/proofs.html?raw";

<Example title="Proofs" source={proofsSource}>
  <Proofs client:load />
</Example>

<NativeExample title="Proofs without React" html={proofsHtml} />
```

- [ ] **Step 5: Build and check the pages.**

Run: `pnpm --filter @raster/docs build`
Expected: `68 page(s) built`.

Run: `cd apps/docs && npx playwright test --project=chromium -g "/components/(calendar|file-upload)/"`
Expected: PASS. If the outline check objects to the calendar's month heading (React Aria renders it as a heading element inside the example), report the exact rule, and give `Heading` in `CalendarBody` a `level` that fits the docs outline rather than hiding the heading.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs
git commit -m "docs: Calendar and FileUpload pages"
```

---

### Task 7: Keyboard walkthroughs on both routes, and a drop

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`

- [ ] **Step 1: Write the walkthroughs.** Append to `apps/docs/e2e/keyboard.spec.ts`:

```ts
test("combobox, React: typing filters, arrows and Enter choose, Escape closes", async ({ page }) => {
  await page.goto("/components/combobox/");
  await waitForIslands(page);
  const input = example(page, "City").getByRole("combobox", { name: "City" });
  await tabTo(page, input);
  await page.keyboard.type("Lu");
  const list = page.getByRole("listbox");
  await expect(list.getByRole("option")).toHaveText(["Lucerne", "Lugano"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("Lucerne");
  await expect(list).toBeHidden();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toBeFocused();
});

test("combobox, native: a labelled input wired to its datalist that takes typed text", async ({ page }) => {
  await page.goto("/components/combobox/");
  const field = example(page, "City without React");
  const input = field.getByRole("combobox", { name: "City" });
  await expect(input).toHaveAttribute("list", "cities");
  await expect(field.locator("datalist#cities option")).toHaveCount(10);
  // The suggestion list itself is browser UI, outside the page, so it is not driven here.
  await tabTo(page, input);
  await page.keyboard.type("Lugano");
  await expect(input).toHaveValue("Lugano");
});

test("date picker, React: arrows step a segment; the calendar opens, moves by day and month, and chooses", async ({ page }) => {
  await page.goto("/components/date-picker/");
  await waitForIslands(page);
  const group = example(page, "Delivery date").getByRole("group", { name: "Delivery date" });
  const segments = group.getByRole("spinbutton");
  await tabTo(page, segments.first());
  await page.keyboard.press("ArrowUp");
  await expect(segments.first()).toHaveText("4");
  await page.keyboard.press("ArrowDown");
  await expect(segments.first()).toHaveText("3");
  const button = group.getByRole("button", { name: /Calendar/ });
  await tabTo(page, button);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText("March 2026");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageDown");
  await expect(dialog.getByRole("heading")).toHaveText("April 2026");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(segments.first()).toHaveText("4");
  await expect(segments.nth(1)).toHaveText("13");
  await expect(button).toBeFocused();
});

test("date picker, native: a labelled date input that takes a date within its limits", async ({ page }) => {
  await page.goto("/components/date-picker/");
  const input = example(page, "Delivery date without React").getByLabel("Delivery date");
  await expect(input).toHaveAttribute("type", "date");
  await expect(input).toHaveAttribute("min", "2026-03-02");
  await input.fill("2026-03-20");
  await expect(input).toHaveValue("2026-03-20");
});

test("date range picker, React: Enter starts the range, a second Enter ends it", async ({ page }) => {
  await page.goto("/components/date-range-picker/");
  await waitForIslands(page);
  const group = example(page, "Project period").getByRole("group", { name: "Project period" });
  const button = group.getByRole("button", { name: /Calendar/ });
  await tabTo(page, button);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Focus opens on the range's start, 9 March.
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  const segments = group.getByRole("spinbutton");
  await expect(segments.nth(1)).toHaveText("9");
  await expect(segments.nth(4)).toHaveText("11");
});

test("date range picker, native: From and To are labelled inside the named group", async ({ page }) => {
  await page.goto("/components/date-range-picker/");
  const group = example(page, "Project period without React").getByRole("group", { name: "Project period" });
  await expect(group.getByLabel("From")).toHaveValue("2026-03-09");
  await expect(group.getByLabel("To")).toHaveValue("2026-03-13");
});

test("calendar: arrows move by day; an unavailable weekend day cannot be chosen", async ({ page }) => {
  await page.goto("/components/calendar/");
  await waitForIslands(page);
  const calendar = example(page, "Delivery day");
  const selected = calendar.locator(".sw-calendar-cell[data-selected]");
  await expect(selected).toHaveText("12");
  await selected.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(selected).toHaveText("13");
  await page.keyboard.press("ArrowRight");
  await expect(calendar.locator(".sw-calendar-cell[data-focused]")).toHaveAttribute("data-unavailable", "true");
  await page.keyboard.press("Enter");
  await expect(selected).toHaveText("13");
});

test("file upload, React: Choose files from the keyboard adds files; Remove moves focus on", async ({ page }) => {
  await page.goto("/components/file-upload/");
  await waitForIslands(page);
  const field = example(page, "Proofs");
  const choose = field.getByRole("button", { name: "Choose files Proofs" });
  await tabTo(page, choose);
  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooser).setFiles({ name: "index.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
  await expect(field.locator(".sw-file-name")).toHaveText(["cover.pdf", "spread-04.png", "index.pdf"]);
  await field.getByRole("button", { name: "Remove cover.pdf" }).focus();
  await page.keyboard.press("Enter");
  await expect(field.getByRole("button", { name: "Remove spread-04.png" })).toBeFocused();
});

test("file upload, React: a dropped file is added; a wrong type is refused with a message", async ({ page }) => {
  await page.goto("/components/file-upload/");
  await waitForIslands(page);
  const field = example(page, "Proofs");
  await field.locator(".sw-file-drop").evaluate((zone) => {
    const data = new DataTransfer();
    data.items.add(new File(["%PDF-1.7"], "plan.pdf", { type: "application/pdf" }));
    data.items.add(new File(["notes"], "notes.txt", { type: "text/plain" }));
    const box = zone.getBoundingClientRect();
    const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
    for (const type of ["dragenter", "dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true, ...at }));
    }
  });
  await expect(field.locator(".sw-file-name").last()).toHaveText("plan.pdf");
  await expect(field.getByRole("alert")).toHaveText("notes.txt is not an accepted type.");
});

test("file upload, native: the labelled file input takes files", async ({ page }) => {
  await page.goto("/components/file-upload/");
  const input = example(page, "Proofs without React").getByLabel("Proofs");
  await input.setInputFiles({ name: "index.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
  await expect(input).toHaveJSProperty("files.length", 1);
});
```

`toHaveJSProperty` takes a single property name; if it rejects the dotted path, use `expect(await input.evaluate((el: HTMLInputElement) => el.files?.length)).toBe(1)`.

- [ ] **Step 2: Run them.**

Run: `pnpm --filter @raster/docs build && cd apps/docs && npx playwright test --project=chromium e2e/keyboard.spec.ts -g "combobox|date|calendar|file upload"`
Expected: PASS, 11 tests. Notes for failures:
- If the drop test adds nothing, React Aria's drop handling may need a `dragover` that it can accept: check that `dropEffect` ends as `"copy"`, and dispatch `dragenter` and `dragover` on the zone's inner element (`.sw-file-drop > *:first-child`) as well. Do not replace the drop with `setInputFiles`; the point of the test is the drop.
- If the calendar test's `data-focused` locator finds nothing, React Aria marks the focused cell with `data-focused` only while the grid has focus; assert on `page.locator(":focus")` instead.

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/e2e/keyboard.spec.ts
git commit -m "test(docs): keyboard walkthroughs for combobox, dates and files, and a drop"
```

---

### Task 8: Forced colours and visual baselines

**Files:**
- Modify: `apps/docs/e2e/forced-colors.spec.ts`
- Create: new PNGs under `apps/docs/e2e/__screenshots__/`

- [ ] **Step 1: Add the forced-colours cases.** In `apps/docs/e2e/forced-colors.spec.ts`, add to `CASES`:

```ts
  { path: "/components/calendar/", title: "Delivery day", name: "calendar" },
  { path: "/components/calendar/", title: "Booking", name: "range-calendar" },
  { path: "/components/date-picker/", title: "Delivery date", name: "date-picker" },
  { path: "/components/file-upload/", title: "Proofs", name: "file-upload" },
```

- [ ] **Step 2: Generate and check them.**

Run: `cd apps/docs && npx playwright test --project=chromium e2e/forced-colors.spec.ts --update-snapshots`
Expected: 12 passed, 4 new `forced-*-darwin.png` files written.

Run the same command without `--update-snapshots`. Expected: 12 passed, nothing written.

- [ ] **Step 3: Generate the visual baselines for the five new pages.**

Run: `cd apps/docs && npx playwright test --project=visual -g "examples on (combobox|date-picker|date-range-picker|calendar|file-upload)$" --update-snapshots`
Expected: 60 passed (5 pages × 12 variants), new PNGs only. Then run `git status --short apps/docs/e2e/__screenshots__` and confirm every changed file is new (`??`), none modified.

- [ ] **Step 4: Look at the images.** Open each of these with the Read tool and check it by eye. Report what you see in each, briefly.
- `forced-calendar-darwin.png`: the selected day (12) is a solid system-highlight square with readable text; weekend days are struck through; the Previous and Next arrows are visible.
- `forced-range-calendar-darwin.png`: 9 and 13 are solid highlight squares; 10–12 are outlined in highlight, not invisible.
- `forced-date-picker-darwin.png`: the field border, the segments and the calendar button's hairline and icon are all visible.
- `forced-file-upload-darwin.png`: the dashed zone, the Choose files button, both list rows with Remove, and the progress bar under spread-04.png.
- `calendar-1-alpine-light-360-darwin.png`: seven columns that fit the frame without overflow, a centred month heading between the arrows, square cells, no days from other months showing.
- `calendar-2-zurich-dark-1440-darwin.png`: the range has solid ends and a subtle fill between with no gaps or rounded inner corners.
- `date-picker-1-alpine-light-360-darwin.png` and `date-picker-2-alpine-light-360-darwin.png`: the React field and the native field side by side in your mind: same height, same border, the calendar button flush at the inline end behind a hairline.
- `date-range-picker-1-zurich-light-768-darwin.png`: both date halves and the dash on one line; nothing clipped.
- `date-range-picker-2-alpine-light-360-darwin.png`: From and To stack or sit side by side cleanly at 360px.
- `file-upload-1-alpine-dark-1440-darwin.png`: the zone's icon, text and button centred; list rows between hairlines; sizes in mono; the 4px bar under the uploading row.
- `file-upload-2-alpine-light-360-darwin.png`: the native input fills the width with its button and file text inside the dashed box.
- `combobox-1-zurich-dark-360-darwin.png`: the chevron button inside the input at the inline end.

If something is wrong in the CSS, fix it with a CSS test, rebuild, regenerate only the affected images, look again, and say what you changed.

- [ ] **Step 5: Run the full docs browser suite.**

Run: `cd apps/docs && npx playwright test`
Expected: PASS for both projects. Note the counts.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/e2e
git commit -m "test(docs): forced-colours cases and visual baselines for combobox, dates and files"
```

---

### Task 9: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what Plan 7d settled.** Append to the spec, adjusting any line the build proved different (and saying so in the hand-off):

```markdown

## 13. Settled in Plan 7d

- **Native controls are the browser's own.** The datalist's list, the date input's calendar and the file input's button and text cannot be styled to match the React route, so Plan 7d has no parity screenshots; both routes have keyboard walkthroughs.
- **Dates are `CalendarDate` values** from `@internationalized/date`. Raster's package takes its date types from React Aria and adds no runtime dependency; apps and the docs import `parseDate` and friends directly.
- **One calendar body.** Calendar, RangeCalendar and both pickers' popovers share `CalendarBody`: a heading between Previous and Next, and a grid of 44px cells.
- **FileUpload holds no files.** The app owns the list (`files`, `onAdd`, `onRemove`, `progress`); the component checks types and sizes, reports refusals in an alert and keeps focus in place after a removal.
- **The native file input is the drop zone.** No script is needed to drop or to show the chosen names; there is no drag-over state on that route.
```

- [ ] **Step 2: Run everything.**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and both apps' browser tests PASS. Note the counts for the hand-off.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7d's outcomes"
```

---

## Self-review notes

- **Spec coverage (section 12):** Combobox → Tasks 1, 5, 7; DatePicker and DateRangePicker → Tasks 3, 5, 7; Calendar and RangeCalendar → Tasks 2, 6, 7; FileUpload → Tasks 4, 6, 7; visual rules → the CSS in Tasks 1–4; testing (no parity, keyboard on both routes, a drop, forced colours) → Tasks 7–8; settled notes → Task 9.
- **Names used across tasks:** CSS `sw-combobox`, `sw-combobox-control`, `sw-combobox-input`, `sw-combobox-button`, `sw-calendar`, `sw-range-calendar`, `sw-calendar-header`, `sw-calendar-heading`, `sw-calendar-nav`, `sw-calendar-grid`, `sw-calendar-weekday`, `sw-calendar-cell`, `sw-calendar-popover`, `sw-calendar-dialog`, `sw-date-picker`, `sw-date-range-picker`, `sw-date-field`, `sw-date-input`, `sw-date-segment`, `sw-date-button`, `sw-date-range-dash`, `sw-date-native`, `sw-date-range-native`, `sw-date-range-fields`, `sw-file-upload`, `sw-file-drop`, `sw-file-drop-text`, `sw-file-input`, `sw-file-list`, `sw-file-item`, `sw-file-meta`, `sw-file-name`, `sw-file-size`, `sw-file-remove`; React `ComboBox`, `ComboBoxItem`, `Calendar`, `RangeCalendar`, `CalendarBody` (internal), `DatePicker`, `DateRangePicker`, `FileUpload`, `FileUploadEntry`, `formatFileSize`, `acceptsFile`.
- **Page count:** 63 before; +3 = 66 after Task 5; +2 = 68 after Task 6.
- **Component count:** 52 + ComboBox, DatePicker, DateRangePicker, Calendar (with RangeCalendar), FileUpload = 57.
