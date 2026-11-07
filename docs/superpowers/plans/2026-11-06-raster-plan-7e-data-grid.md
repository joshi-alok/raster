# Raster Plan 7e: DataGrid

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DataGrid to Raster: a table you can sort, select from, resize and scroll with a sticky header and first column, virtualised for large data, on both routes, with a docs page, browser tests, forced-colours screenshots and visual baselines.

**Architecture:** The React route wraps React Aria's `Table` inside `ResizableTableContainer`, adding a checkbox column for multiple selection with `useTableOptions`, and a `Virtualizer` with `TableLayout` when asked. The HTML route is a plain `<table>` with sort links and checkbox inputs, plus an optional docs script for Select all. Both carry `.sw-table` and one new stylesheet, `data-grid.css`.

**Tech stack:** Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1, Vitest 3.2 + jsdom + user-event, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2](../specs/2026-11-06-raster-v2-components-design.md), section 14 (the Plan 7e design), plus sections 4–7.

**Branch:** `raster/plan-7e` (created from main after Plan 7d merged).

---

## Lessons carried from Plans 7a–7d

- **Lightning CSS printing:** it drops default values, prints `transparent` as `#0000`, lower-cases system colours (use the `i` flag), prints `::before` as `:before`, prints `:has(> .x)` as `:has( > .x)`, and joins grouped selectors and `:not(a, b)` lists onto one line. When a CSS test fails only because of printing, adjust the regex minimally with a comment; never weaken it.
- **React Aria:** take types and hooks from `react-aria-components`. Collection components render a `<template>` before their root in tests; query with `:scope > :not(template)`. React Aria adds hidden helper elements (a hidden heading and Next button in calendars); scope queries to the visible part when names repeat. Focus is restored a frame late; use `waitFor`.
- **The plan's code is unrun.** When the library behaves differently from what a test expects, find the real behaviour (read the source in `node_modules/.pnpm/react-aria-components@1.22.1*/…/dist/private/`), correct the test to it and say why. Never weaken a test so it no longer checks its point.
- **Forced colours removes backgrounds.** A selected row drawn only by its fill needs `forced-color-adjust: none` and system colours; lines and icons are drawn with borders.
- **Accessibility checks on docs pages:** a plain `div` may not carry `aria-label`; a `<header>` outside a sectioning element is a banner landmark; adjacent small targets need 24px spacing; docs code blocks are labelled "HTML code: <title>", so `getByLabel` may need `{ exact: true }`.
- **Look at the screenshots.** Layout bugs have repeatedly passed every test and been caught only by eye. Task 6 ends by opening named images.

## Conventions every task follows

- Run commands from the repository root. To run one React test file: `cd packages/react && npx vitest run test/data-grid.test.tsx`.
- CSS goes in `packages/css/src/components/data-grid.css`, imported in `packages/css/src/index.css` with `layer(raster.components)` after `file-upload.css`. No raw colours; system colours only inside `@media (forced-colors: active)`.
- React components live in `packages/react/src/display/DataGrid.tsx`, merge `className` with `cx`, and are exported from `packages/react/src/index.ts` after the FileUpload export; add each name to `expected` in `packages/react/test/exports.test.ts`.
- Rebuild before docs tests: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`.
- Commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/css/src/components/data-grid.css` | Caption, scroll region, sticky cells, sort chevrons, selection, resize handle, virtualised cells, forced colours |
| `packages/react/src/display/DataGrid.tsx` | `DataGrid`, `DataGridHeader`, `DataGridColumn`, `DataGridBody`, `DataGridRow`, `DataGridCell` |
| `packages/react/test/data-grid.test.tsx` | Unit tests |
| `apps/docs/src/lib/native-controls.ts` | `installSelectAll`, the optional native Select all script |
| `apps/docs/test/native-controls.test.ts` | Its unit tests |
| `apps/docs/src/layouts/Base.astro` | Installs it on every docs page |
| `apps/docs/src/demos/data-grid/` | `projects.ts` data, `Projects.tsx`, `NoResults.tsx`, `Archive.tsx`, `projects.html` |
| `apps/docs/src/content/components/data-grid.mdx` | The page, Display group, order 15 |
| `apps/docs/e2e/keyboard.spec.ts` | Browser walkthroughs on both routes, and virtualisation |
| `apps/docs/e2e/forced-colors.spec.ts` | Two new cases |

---

### Task 1: DataGrid CSS

**Files:**
- Create: `packages/css/src/components/data-grid.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("data grid", () => {
  it("scrolls inside its own region", () => {
    expect(rule(".sw-data-grid-scroll")).toMatch(/overflow:\s*auto/);
  });

  it("keeps cell borders on sticky cells by not collapsing them", () => {
    const r = rule(".sw-data-grid");
    expect(r).toMatch(/border-collapse:\s*separate/);
    expect(r).toMatch(/border-spacing:\s*0/);
  });

  it("sticks the header row to the top on a solid background", () => {
    const r = rule(".sw-data-grid thead th");
    expect(r).toMatch(/position:\s*sticky/);
    expect(r).toMatch(/inset-block-start:\s*0/);
    expect(r).toMatch(/background-color:\s*var\(--surface-page\)/);
  });

  it("sticks the selection column and the sticky column to the inline start", () => {
    const r = rule(".sw-data-grid :is(.sw-data-grid-select, .sw-data-grid-sticky)");
    expect(r).toMatch(/position:\s*sticky/);
    expect(r).toMatch(/inset-inline-start:\s*0/);
    expect(rule(".sw-data-grid-selectable .sw-data-grid-sticky")).toMatch(/inset-inline-start:\s*var\(--target-min\)/);
  });

  it("ends the sticky column with a hairline drawn as a border", () => {
    expect(rule(".sw-data-grid .sw-data-grid-sticky:after")).toMatch(/border-inline-end:\s*1px solid var\(--border\)/);
  });

  it("aligns numbers at the end in tabular mono", () => {
    const r = rule(".sw-data-grid-numeric");
    expect(r).toMatch(/text-align:\s*end/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("draws the sort chevrons with borders and hides the unused one when sorted", () => {
    expect(rule(".sw-data-grid-sort-icon:before")).toMatch(/border-block-start:\s*1\.5px solid currentColor/i);
    expect(rule('.sw-data-grid-sort-icon[data-direction="ascending"]:after')).toMatch(/display:\s*none/);
    expect(rule('.sw-data-grid-sort-icon[data-direction="descending"]:before')).toMatch(/display:\s*none/);
  });

  it("marks a selected row with a fill and a 2px bar on both routes", () => {
    expect(css).toMatch(
      /\.sw-data-grid-row\[data-selected\] > \*,\s*\.sw-data-grid tr:has\( > td > input\[type="?checkbox"?\]:checked\) > \*\s*\{[^}]*background-color:\s*var\(--accent-subtle\)/,
    );
    expect(css).toMatch(/:first-child:before\s*\{[^}]*border-inline-start:\s*2px solid var\(--accent\)/);
  });

  it("draws the resize handle as a border with a 24px hit area", () => {
    expect(rule(".sw-data-grid-resizer")).toMatch(/inline-size:\s*1\.5rem/);
    expect(rule(".sw-data-grid-resizer:before")).toMatch(/border-inline-end:\s*1px solid var\(--border-strong\)/);
  });

  it("keeps selected rows visible in forced colours", () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[\s\S]*?\.sw-data-grid-row\[data-selected\] > \*[^{]*\{[^}]*forced-color-adjust:\s*none[^}]*background-color:\s*highlight/i,
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test`
Expected: FAIL with `No rule for .sw-data-grid-scroll`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/data-grid.css`:

```css
/*
 * DataGrid: a table to sort, select from and resize.
 * React route: React Aria Table (class "sw-table sw-data-grid") inside ResizableTableContainer
 * (.sw-data-grid-scroll), with a .sw-data-grid-caption above that names it.
 * Native route: <table class="sw-table sw-data-grid"> in the same wrapper, with sort links
 * (.sw-data-grid-sort) in the headers, aria-sort on the current one, and checkbox inputs in the first
 * column. Both routes carry .sw-table, so cells, hairlines and type match Table.
 */
.sw-data-grid-wrap {
  display: grid;
  gap: var(--space-3);
  min-inline-size: 0;
}

.sw-data-grid-caption {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

.sw-data-grid-scroll {
  overflow: auto;
  overscroll-behavior-inline: contain;
}

.sw-data-grid {
  border-collapse: separate;
  border-spacing: 0;
}

.sw-data-grid :is(th, td) {
  position: relative;
}

.sw-data-grid thead th {
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
  background-color: var(--surface-page);
}

.sw-data-grid :is(.sw-data-grid-select, .sw-data-grid-sticky) {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  background-color: var(--surface-page);
}

.sw-data-grid thead :is(.sw-data-grid-select, .sw-data-grid-sticky) {
  z-index: 3;
}

.sw-data-grid-selectable .sw-data-grid-sticky {
  inset-inline-start: var(--target-min);
}

/* The sticky column's edge, drawn as a border so it moves with the cell and survives forced colours. */
.sw-data-grid .sw-data-grid-sticky::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  border-inline-end: 1px solid var(--border);
}

.sw-data-grid .sw-data-grid-select {
  inline-size: var(--target-min);
  padding-inline: 0;
  text-align: center;
}

.sw-data-grid .sw-data-grid-select :is(.sw-checkbox, input[type="checkbox"]) {
  justify-content: center;
  margin: 0;
}

.sw-data-grid input[type="checkbox"] {
  inline-size: 1.125rem;
  block-size: 1.125rem;
  accent-color: var(--accent);
  cursor: pointer;
}

.sw-data-grid-numeric {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: end;
}

.sw-data-grid-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sw-data-grid-numeric .sw-data-grid-head {
  justify-content: flex-end;
}

.sw-data-grid-column[data-allows-sorting] {
  cursor: pointer;
}

@media (hover: hover) {
  .sw-data-grid-column[data-allows-sorting]:hover,
  .sw-data-grid-sort:hover {
    color: var(--text-primary);
  }
}

.sw-data-grid :is(.sw-data-grid-column, .sw-data-grid-cell, .sw-data-grid-row)[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width));
}

/* Native sort links */
.sw-data-grid-sort {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: inherit;
  text-decoration: none;
}

/* Sort chevrons, drawn with borders: a muted pair when sortable, one in the text colour when sorted. */
.sw-data-grid-sort-icon {
  position: relative;
  display: inline-block;
  flex: none;
  inline-size: 0.5rem;
  block-size: 0.875rem;
  color: var(--text-muted);
}

.sw-data-grid-sort-icon::before,
.sw-data-grid-sort-icon::after {
  content: "";
  position: absolute;
  inset-inline-start: 0.0625rem;
  inline-size: 0.3125rem;
  block-size: 0.3125rem;
  border-block-start: 1.5px solid currentColor;
  border-inline-start: 1.5px solid currentColor;
}

.sw-data-grid-sort-icon::before {
  inset-block-start: 0.125rem;
  transform: rotate(45deg);
}

.sw-data-grid-sort-icon::after {
  inset-block-end: 0.125rem;
  transform: rotate(225deg);
}

.sw-data-grid-sort-icon[data-direction] {
  color: var(--text-primary);
}

.sw-data-grid-sort-icon[data-direction="ascending"]::after {
  display: none;
}

.sw-data-grid-sort-icon[data-direction="descending"]::before {
  display: none;
}

/* Selected rows: a fill and a 2px bar at the inline start, as well as the ticked checkbox. */
.sw-data-grid-row[data-selected] > *,
.sw-data-grid tr:has(> td > input[type="checkbox"]:checked) > * {
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

.sw-data-grid-row[data-selected] > :first-child::before,
.sw-data-grid tr:has(> td > input[type="checkbox"]:checked) > :first-child::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  border-inline-start: 2px solid var(--accent);
}

/* Resize handle: a 24px-wide hit area at the header's inline end, drawn as a 1px line. */
.sw-data-grid-resizer {
  position: absolute;
  inset-block: var(--space-2);
  inset-inline-end: 0;
  inline-size: 1.5rem;
  cursor: col-resize;
  touch-action: none;
  outline: none;
}

.sw-data-grid-resizer::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  border-inline-end: 1px solid var(--border-strong);
}

.sw-data-grid-resizer:is([data-hovered], [data-resizing])::before {
  border-inline-end: 2px solid var(--accent);
}

.sw-data-grid-resizer[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width));
}

/* Virtualised rows have a fixed height, so cells centre their content instead of padding it. */
.sw-data-grid-virtualized :is(th, td) {
  display: flex;
  align-items: center;
  padding-block: 0;
}

.sw-data-grid-virtualized .sw-data-grid-numeric {
  justify-content: flex-end;
}

@media (forced-colors: active) {
  .sw-data-grid-row[data-selected] > *,
  .sw-data-grid tr:has(> td > input[type="checkbox"]:checked) > * {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
```

Import it after `file-upload.css`:

```css
@import "./components/data-grid.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS. If a selector test fails only because of how Lightning CSS prints `:is()` or `:has()`, adjust that regex minimally with a comment.

- [ ] **Step 5: Commit.**

```bash
git add packages/css
git commit -m "feat(css): DataGrid styles for both routes"
```

---

### Task 2: DataGrid (React)

**Files:**
- Create: `packages/react/src/display/DataGrid.tsx`, `packages/react/test/data-grid.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing tests.** Create `packages/react/test/data-grid.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";
import type { Selection, SortDescriptor } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, DataGridBody, DataGridCell, DataGridColumn, DataGridHeader, DataGridRow } from "../src/display/DataGrid";
import { EmptyState } from "../src/feedback/EmptyState";
import { expectAccessible } from "./axe";

type Project = { id: string; name: string; year: number };

const PROJECTS: Project[] = [
  { id: "linie", name: "Linie 7", year: 2022 },
  { id: "atlas", name: "Atlas", year: 2025 },
  { id: "velo", name: "Velo", year: 2024 },
];

function Projects({
  rows = PROJECTS,
  selectionMode = "none",
  onSelectionChange,
}: {
  rows?: Project[];
  selectionMode?: "none" | "multiple";
  onSelectionChange?: (keys: Selection) => void;
}) {
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const key = sort.column as "name" | "year";
        const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return sort.direction === "descending" ? -order : order;
      }),
    [rows, sort],
  );
  return (
    <DataGrid
      caption="Projects"
      selectionMode={selectionMode}
      onSelectionChange={onSelectionChange}
      sortDescriptor={sort}
      onSortChange={setSort}
    >
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader allowsSorting sticky allowsResizing>
          Project
        </DataGridColumn>
        <DataGridColumn id="year" allowsSorting numeric>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody emptyState={<EmptyState title="No projects match" />}>
        {sorted.map((project) => (
          <DataGridRow key={project.id} id={project.id}>
            <DataGridCell sticky>{project.name}</DataGridCell>
            <DataGridCell numeric>{project.year}</DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
}

const rowHeaders = () => screen.getAllByRole("rowheader").map((cell) => cell.textContent);

describe("DataGrid", () => {
  it("is a grid named by its visible caption, carrying the Table classes", () => {
    render(<Projects />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(grid).toHaveClass("sw-table", "sw-data-grid");
    expect(grid).not.toHaveClass("sw-data-grid-selectable");
    expect(screen.getByText("Projects", { selector: ".sw-data-grid-caption" })).toBeInTheDocument();
    expect(grid.closest(".sw-data-grid-scroll")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: "Project" })).toHaveClass("sw-data-grid-column", "sw-data-grid-sticky");
    expect(screen.getByRole("columnheader", { name: "Year" })).toHaveClass("sw-data-grid-numeric");
    expect(screen.getByRole("rowheader", { name: "Atlas" })).toHaveClass("sw-data-grid-cell", "sw-data-grid-sticky");
  });

  it("sorts from the header and shows the direction with aria-sort and a chevron", async () => {
    const user = userEvent.setup();
    render(<Projects />);
    const project = screen.getByRole("columnheader", { name: "Project" });
    const year = screen.getByRole("columnheader", { name: "Year" });
    expect(project).toHaveAttribute("aria-sort", "ascending");
    expect(project.querySelector(".sw-data-grid-sort-icon")).toHaveAttribute("data-direction", "ascending");
    expect(year.querySelector(".sw-data-grid-sort-icon")).not.toHaveAttribute("data-direction");
    expect(rowHeaders()).toEqual(["Atlas", "Linie 7", "Velo"]);
    await user.click(year);
    expect(year).toHaveAttribute("aria-sort", "ascending");
    expect(rowHeaders()).toEqual(["Linie 7", "Velo", "Atlas"]);
    await user.click(year);
    expect(year).toHaveAttribute("aria-sort", "descending");
    expect(year.querySelector(".sw-data-grid-sort-icon")).toHaveAttribute("data-direction", "descending");
    expect(rowHeaders()).toEqual(["Atlas", "Velo", "Linie 7"]);
  });

  it("adds a checkbox column and Select all for multiple selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Projects selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(grid).toHaveClass("sw-data-grid-selectable");
    const selectAll = screen.getByRole("checkbox", { name: /select all/i });
    expect(selectAll.closest("th")).toHaveClass("sw-data-grid-select");
    const velo = screen.getByRole("rowheader", { name: "Velo" }).closest("tr") as HTMLElement;
    await user.click(within(velo).getByRole("checkbox"));
    expect([...(onSelectionChange.mock.calls.at(-1)?.[0] as Set<string>)]).toEqual(["velo"]);
    expect(velo).toHaveAttribute("aria-selected", "true");
    await user.click(selectAll);
    expect(onSelectionChange).toHaveBeenLastCalledWith("all");
  });

  it("shows the empty state inside the grid when there are no rows", () => {
    render(<Projects rows={[]} />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(within(grid).getByText("No projects match")).toBeInTheDocument();
  });

  it("puts a resize handle in resizable columns only", () => {
    render(<Projects />);
    expect(screen.getByRole("columnheader", { name: "Project" }).querySelector(".sw-data-grid-resizer")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: "Year" }).querySelector(".sw-data-grid-resizer")).toBeNull();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Projects selectionMode="multiple" />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `cd packages/react && npx vitest run test/data-grid.test.tsx`
Expected: FAIL, cannot resolve `../src/display/DataGrid`.

- [ ] **Step 3: Write the components.** Create `packages/react/src/display/DataGrid.tsx`:

```tsx
import { type ReactNode, useId } from "react";
import {
  Cell,
  type CellProps,
  Column,
  type ColumnProps,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  type RowProps,
  Table,
  TableBody,
  type TableBodyProps,
  TableHeader,
  type TableHeaderProps,
  TableLayout,
  type TableProps,
  useTableOptions,
  Virtualizer,
} from "react-aria-components";
import { Checkbox } from "../forms/Checkbox";
import { cx } from "../utils/cx";

export type DataGridProps = Omit<TableProps, "className" | "children" | "aria-label" | "aria-labelledby"> & {
  /** Required. Shown above the grid in the mono label style, and names it. */
  caption: ReactNode;
  /** A CSS length. The grid scrolls inside this height and its header row sticks. */
  maxHeight?: string;
  /** Draw only the rows in view. Rows must all be rowHeight pixels tall. */
  virtualized?: { rowHeight: number; headingHeight?: number };
  className?: string;
  /** A DataGridHeader and a DataGridBody. */
  children: ReactNode;
};

/**
 * A table to sort, select from and resize, for data people work with. For static data, use Table.
 * Arrow keys move between rows and cells; Space selects a row; Enter on a header sorts.
 * Native twin: <table class="sw-table sw-data-grid"> with sort links and checkbox inputs.
 */
export function DataGrid({ caption, maxHeight, virtualized, selectionMode = "none", className, children, ...rest }: DataGridProps) {
  const captionId = useId();
  const grid = (
    <Table
      aria-labelledby={captionId}
      selectionMode={selectionMode}
      className={cx(
        "sw-table sw-data-grid",
        selectionMode !== "none" && "sw-data-grid-selectable",
        virtualized && "sw-data-grid-virtualized",
        className,
      )}
      {...rest}
    >
      {children}
    </Table>
  );
  return (
    <div className="sw-data-grid-wrap">
      <div className="sw-data-grid-caption" id={captionId}>
        {caption}
      </div>
      <ResizableTableContainer className="sw-data-grid-scroll" style={maxHeight ? { maxBlockSize: maxHeight } : undefined}>
        {virtualized ? (
          <Virtualizer
            layout={TableLayout}
            layoutOptions={{ rowHeight: virtualized.rowHeight, headingHeight: virtualized.headingHeight ?? virtualized.rowHeight }}
          >
            {grid}
          </Virtualizer>
        ) : (
          grid
        )}
      </ResizableTableContainer>
    </div>
  );
}

/** Whether the grid shows checkboxes: multiple selection with React Aria's default toggle behaviour. */
function useCheckboxes() {
  const { selectionMode, selectionBehavior } = useTableOptions();
  return selectionMode === "multiple" && selectionBehavior === "toggle";
}

export type DataGridHeaderProps = Omit<TableHeaderProps<object>, "className" | "children"> & {
  className?: string;
  /** DataGridColumn elements. */
  children: ReactNode;
};

/** The header row. Adds the Select all column when the grid allows multiple selection. */
export function DataGridHeader({ className, children, ...rest }: DataGridHeaderProps) {
  const checkboxes = useCheckboxes();
  return (
    <TableHeader className={cx("sw-data-grid-header", className)} {...rest}>
      {checkboxes && (
        <Column className="sw-data-grid-column sw-data-grid-select" width={44} minWidth={44}>
          <Checkbox slot="selection" />
        </Column>
      )}
      {children}
    </TableHeader>
  );
}

export type DataGridColumnProps = Omit<ColumnProps, "className" | "children"> & {
  children: ReactNode;
  /** End-align in tabular mono. Use the same on the column's cells. */
  numeric?: boolean;
  /** Stick to the inline start when the grid scrolls sideways. Use on one column, usually the row header. */
  sticky?: boolean;
  /** Add a resize handle at the inline end. */
  allowsResizing?: boolean;
  className?: string;
};

/** A column header: its label, the sort chevrons when sortable, and a resize handle when resizable. */
export function DataGridColumn({ children, numeric, sticky, allowsResizing, className, ...rest }: DataGridColumnProps) {
  return (
    <Column
      className={cx("sw-data-grid-column", numeric && "sw-data-grid-numeric", sticky && "sw-data-grid-sticky", className)}
      {...rest}
    >
      {({ allowsSorting, sortDirection }) => (
        <div className="sw-data-grid-head">
          <span className="sw-data-grid-label">{children}</span>
          {allowsSorting && <span className="sw-data-grid-sort-icon" data-direction={sortDirection} aria-hidden="true" />}
          {allowsResizing && <ColumnResizer className="sw-data-grid-resizer" />}
        </div>
      )}
    </Column>
  );
}

export type DataGridBodyProps<T extends object> = Omit<TableBodyProps<T>, "className" | "renderEmptyState"> & {
  /** Shown inside the grid when there are no rows; usually an EmptyState. */
  emptyState?: ReactNode;
  className?: string;
};

/** The rows: DataGridRow elements, or a render function with `items`. */
export function DataGridBody<T extends object>({ emptyState, className, ...rest }: DataGridBodyProps<T>) {
  return (
    <TableBody
      className={cx("sw-data-grid-body", className)}
      renderEmptyState={emptyState != null ? () => emptyState : undefined}
      {...rest}
    />
  );
}

export type DataGridRowProps<T extends object> = Omit<RowProps<T>, "className" | "children"> & {
  /** DataGridCell elements, one per column. */
  children: ReactNode;
  className?: string;
};

/** A row. Adds its selection checkbox when the grid allows multiple selection. */
export function DataGridRow<T extends object>({ children, className, ...rest }: DataGridRowProps<T>) {
  const checkboxes = useCheckboxes();
  return (
    <Row className={cx("sw-data-grid-row", className)} {...rest}>
      {checkboxes && (
        <Cell className="sw-data-grid-cell sw-data-grid-select">
          <Checkbox slot="selection" />
        </Cell>
      )}
      {children}
    </Row>
  );
}

export type DataGridCellProps = Omit<CellProps, "className"> & {
  numeric?: boolean;
  sticky?: boolean;
  className?: string;
};

export function DataGridCell({ numeric, sticky, className, ...rest }: DataGridCellProps) {
  return (
    <Cell
      className={cx("sw-data-grid-cell", numeric && "sw-data-grid-numeric", sticky && "sw-data-grid-sticky", className)}
      {...rest}
    />
  );
}
```

Export them after the FileUpload export in `packages/react/src/index.ts`:

```ts
export {
  DataGrid,
  DataGridBody,
  type DataGridBodyProps,
  DataGridCell,
  type DataGridCellProps,
  DataGridColumn,
  type DataGridColumnProps,
  DataGridHeader,
  type DataGridHeaderProps,
  type DataGridProps,
  DataGridRow,
  type DataGridRowProps,
} from "./display/DataGrid";
```

Add `"DataGrid", "DataGridHeader", "DataGridColumn", "DataGridBody", "DataGridRow", "DataGridCell",` to `expected` in `packages/react/test/exports.test.ts`.

- [ ] **Step 4: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build`
Expected: PASS. Notes if not:
- If React Aria names the header checkbox differently, match its real name (read `useTableSelectAllCheckbox` in `node_modules`), keeping the test's point: a Select all checkbox in the selection column.
- If clicking a header in jsdom does not sort, check whether React Aria sorts on press up, and use `user.click` on the header's inner `.sw-data-grid-head`. Do not call `onSortChange` directly.
- If `TableHeaderProps<object>` rejects a ReactNode child type, widen with `Omit<…, "children">` as written; static columns are the supported use.

- [ ] **Step 5: Commit.**

```bash
git add packages/react
git commit -m "feat: DataGrid with sorting, selection, sticky cells, resizing and virtualisation"
```

---

### Task 3: The native Select all script

**Files:**
- Modify: `apps/docs/src/lib/native-controls.ts`, `apps/docs/test/native-controls.test.ts`, `apps/docs/src/layouts/Base.astro`

- [ ] **Step 1: Write the failing tests.** In `apps/docs/test/native-controls.test.ts`, add `installSelectAll` to the import from `../src/lib/native-controls` and append:

```ts
describe("installSelectAll", () => {
  function grid() {
    document.body.innerHTML = `
      <table class="sw-table sw-data-grid">
        <thead><tr><th><input type="checkbox" data-select-all aria-label="Select all projects" /></th><th>Project</th></tr></thead>
        <tbody>
          <tr><td><input type="checkbox" name="project" value="a" /></td><td>A</td></tr>
          <tr><td><input type="checkbox" name="project" value="b" /></td><td>B</td></tr>
        </tbody>
      </table>`;
    uninstall = installSelectAll(document);
    const all = document.querySelector<HTMLInputElement>("[data-select-all]") as HTMLInputElement;
    const rows = [...document.querySelectorAll<HTMLInputElement>("tbody input")];
    return { all, rows };
  }

  it("checks and clears every row from the header checkbox", () => {
    const { all, rows } = grid();
    all.click();
    expect(rows.every((box) => box.checked)).toBe(true);
    all.click();
    expect(rows.some((box) => box.checked)).toBe(false);
  });

  it("shows a partial selection as indeterminate and a full one as checked", () => {
    const { all, rows } = grid();
    rows[0].click();
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);
    rows[1].click();
    expect(all.indeterminate).toBe(false);
    expect(all.checked).toBe(true);
  });

  it("leaves React Aria's grids alone", () => {
    const { all, rows } = grid();
    document.querySelector("table")?.setAttribute("data-rac", "");
    all.click();
    expect(rows.some((box) => box.checked)).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/docs test`
Expected: FAIL, `installSelectAll` is not exported.

- [ ] **Step 3: Write the script.** Append to `apps/docs/src/lib/native-controls.ts`:

```ts
/**
 * Data grids: a header checkbox with data-select-all checks or clears every row checkbox in its
 * table, and shows a partial selection as indeterminate. Rows still submit as plain checkboxes.
 */
export function installSelectAll(doc: Document): () => void {
  const onChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    const table = input.closest("table.sw-data-grid");
    // React Aria's grids manage their own selection; their elements carry data-rac.
    if (!table || table.closest("[data-rac]")) return;
    const all = table.querySelector<HTMLInputElement>("thead input[data-select-all]");
    if (!all) return;
    const rows = [...table.querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]')];
    if (input === all) {
      for (const box of rows) box.checked = all.checked;
      all.indeterminate = false;
      return;
    }
    const checked = rows.filter((box) => box.checked).length;
    all.checked = checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  };
  doc.addEventListener("change", onChange);
  return () => doc.removeEventListener("change", onChange);
}
```

In `apps/docs/src/layouts/Base.astro`, import `installSelectAll` alongside `installSearchClear` and `installSliderOutputs`, and call `installSelectAll(document);` after `installSliderOutputs(document);`.

- [ ] **Step 4: Run the tests to see them pass.**

Run: `pnpm --filter @raster/docs test && pnpm --filter @raster/docs typecheck`
Expected: PASS. (If the docs package has no `typecheck` script, run `cd apps/docs && npx tsc --noEmit`.)

- [ ] **Step 5: Commit.**

```bash
git add apps/docs/src/lib apps/docs/test apps/docs/src/layouts
git commit -m "feat(docs): optional Select all script for native data grids"
```

---

### Task 4: The DataGrid docs page

**Files:**
- Create: `apps/docs/src/demos/data-grid/projects.ts`, `apps/docs/src/demos/data-grid/Projects.tsx`, `apps/docs/src/demos/data-grid/NoResults.tsx`, `apps/docs/src/demos/data-grid/Archive.tsx`, `apps/docs/src/demos/data-grid/projects.html`, `apps/docs/src/content/components/data-grid.mdx`

- [ ] **Step 1: Write the data.** Create `apps/docs/src/demos/data-grid/projects.ts`:

```ts
export type Project = { id: string; name: string; client: string; discipline: string; year: number; budget: number };

/** Fictional projects for the DataGrid examples. Budgets are in Swiss francs. */
export const PROJECTS: Project[] = [
  { id: "linie-7", name: "Linie 7", client: "Verkehrsbetriebe Luzern", discipline: "Wayfinding", year: 2025, budget: 184000 },
  { id: "atlas", name: "Atlas der Stille", client: "Kunsthalle Basel", discipline: "Editorial", year: 2024, budget: 96000 },
  { id: "velo", name: "Velo Bern", client: "Stadt Bern", discipline: "Identity", year: 2023, budget: 142000 },
  { id: "grotesk", name: "Grotesk Neu", client: "Typothek Zürich", discipline: "Type", year: 2025, budget: 58000 },
  { id: "seebad", name: "Seebad", client: "Lido Lugano", discipline: "Identity", year: 2022, budget: 74000 },
  { id: "archiv", name: "Archiv 1957", client: "ETH Bibliothek", discipline: "Editorial", year: 2024, budget: 121000 },
  { id: "rigi", name: "Bergbahn Rigi", client: "Rigi Bahnen", discipline: "Wayfinding", year: 2023, budget: 210000 },
  { id: "klang", name: "Klangraum", client: "KKL Luzern", discipline: "Exhibition", year: 2025, budget: 167000 },
  { id: "raster", name: "Raster Atlas", client: "Hochschule Luzern", discipline: "Editorial", year: 2022, budget: 45000 },
  { id: "uhrwerk", name: "Uhrwerk", client: "Atelier Biel", discipline: "Identity", year: 2024, budget: 88000 },
  { id: "park", name: "Parkleitsystem", client: "Stadt Winterthur", discipline: "Wayfinding", year: 2023, budget: 132000 },
  { id: "plakat", name: "Plakatsammlung", client: "Museum für Gestaltung", discipline: "Exhibition", year: 2025, budget: 154000 },
];

const francs = new Intl.NumberFormat("de-CH");

/** Swiss grouping, as in 184’000. */
export const formatFrancs = (value: number) => francs.format(value);
```

- [ ] **Step 2: Write the React demos.** Create `apps/docs/src/demos/data-grid/Projects.tsx`:

```tsx
import { DataGrid, DataGridBody, DataGridCell, DataGridColumn, DataGridHeader, DataGridRow } from "@raster/react";
import { useMemo, useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { formatFrancs, PROJECTS, type Project } from "./projects";

type SortKey = "name" | "year" | "budget";

export default function Projects() {
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const rows = useMemo(() => {
    const key = sort.column as SortKey;
    const sorted = [...PROJECTS].sort((a: Project, b: Project) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
    return sort.direction === "descending" ? sorted.reverse() : sorted;
  }, [sort]);
  return (
    <DataGrid
      caption="Studio projects"
      selectionMode="multiple"
      defaultSelectedKeys={["linie-7"]}
      sortDescriptor={sort}
      onSortChange={setSort}
      maxHeight="22rem"
    >
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader allowsSorting allowsResizing sticky defaultWidth={200} minWidth={140}>
          Project
        </DataGridColumn>
        <DataGridColumn id="client" allowsResizing defaultWidth={220} minWidth={140}>
          Client
        </DataGridColumn>
        <DataGridColumn id="discipline" defaultWidth={140}>
          Discipline
        </DataGridColumn>
        <DataGridColumn id="year" allowsSorting numeric defaultWidth={100}>
          Year
        </DataGridColumn>
        <DataGridColumn id="budget" allowsSorting numeric defaultWidth={140}>
          Budget (CHF)
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody>
        {rows.map((project) => (
          <DataGridRow key={project.id} id={project.id}>
            <DataGridCell sticky>{project.name}</DataGridCell>
            <DataGridCell>{project.client}</DataGridCell>
            <DataGridCell>{project.discipline}</DataGridCell>
            <DataGridCell numeric>{project.year}</DataGridCell>
            <DataGridCell numeric>{formatFrancs(project.budget)}</DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
}
```

If the docs app does not depend on `react-aria-components`, import `SortDescriptor` as `type { DataGridProps }` and use `NonNullable<DataGridProps["sortDescriptor"]>` instead; do not add the dependency for a type.

Create `apps/docs/src/demos/data-grid/NoResults.tsx`:

```tsx
import { Button, DataGrid, DataGridBody, DataGridColumn, DataGridHeader, EmptyState } from "@raster/react";

export default function NoResults() {
  return (
    <DataGrid caption="Projects in 1998">
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader>
          Project
        </DataGridColumn>
        <DataGridColumn id="client">Client</DataGridColumn>
        <DataGridColumn id="year" numeric>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody
        emptyState={
          <EmptyState label="Projects" title="No projects match" headingLevel={3} action={<Button>Clear filters</Button>}>
            Nothing was finished in 1998. Try another year.
          </EmptyState>
        }
      >
        {[]}
      </DataGridBody>
    </DataGrid>
  );
}
```

Create `apps/docs/src/demos/data-grid/Archive.tsx`:

```tsx
import { DataGrid, DataGridBody, DataGridCell, DataGridColumn, DataGridHeader, DataGridRow } from "@raster/react";

const CLIENTS = ["Kunsthalle Basel", "Stadt Bern", "KKL Luzern", "ETH Bibliothek", "Lido Lugano", "Atelier Biel"];

/** 5,000 archive entries, generated so the screenshots never change. */
const ENTRIES = Array.from({ length: 5000 }, (_, i) => ({
  id: `entry-${i + 1}`,
  number: i + 1,
  title: `Archive entry ${String(i + 1).padStart(4, "0")}`,
  client: CLIENTS[i % CLIENTS.length],
  year: 1960 + (i % 66),
}));

export default function Archive() {
  return (
    <DataGrid caption="Archive, 5,000 entries" maxHeight="24rem" virtualized={{ rowHeight: 48 }}>
      <DataGridHeader>
        <DataGridColumn id="number" numeric defaultWidth={90}>
          No.
        </DataGridColumn>
        <DataGridColumn id="title" isRowHeader defaultWidth={240}>
          Title
        </DataGridColumn>
        <DataGridColumn id="client" defaultWidth={200}>
          Client
        </DataGridColumn>
        <DataGridColumn id="year" numeric defaultWidth={90}>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody items={ENTRIES}>
        {(entry) => (
          <DataGridRow id={entry.id}>
            <DataGridCell numeric>{entry.number}</DataGridCell>
            <DataGridCell>{entry.title}</DataGridCell>
            <DataGridCell>{entry.client}</DataGridCell>
            <DataGridCell numeric>{entry.year}</DataGridCell>
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}
```

React Aria virtualises a table by making the table element itself the scroll container. If `maxHeight` on the outer container does not bound the virtualised grid (all 5,000 rows render, or none), move the height onto the `Table` in `DataGrid` when `virtualized` is set (`style={{ blockSize: maxHeight, overflow: "auto" }}`), and record that in the hand-off.

- [ ] **Step 3: Write the native demo.** Create `apps/docs/src/demos/data-grid/projects.html`:

```html
<div class="sw-data-grid-wrap">
  <div class="sw-data-grid-caption" id="native-projects-caption">Studio projects</div>
  <div class="sw-data-grid-scroll" role="region" aria-labelledby="native-projects-caption" tabindex="0">
    <table class="sw-table sw-data-grid sw-data-grid-selectable" aria-labelledby="native-projects-caption">
      <thead>
        <tr>
          <th class="sw-data-grid-select" scope="col"><input type="checkbox" data-select-all aria-label="Select all projects" /></th>
          <th class="sw-data-grid-sticky" scope="col" aria-sort="ascending">
            <a class="sw-data-grid-sort" href="?sort=name&amp;dir=desc">Project<span class="sw-data-grid-sort-icon" data-direction="ascending" aria-hidden="true"></span><span class="sw-sr-only">, sort descending</span></a>
          </th>
          <th scope="col">Client</th>
          <th class="sw-data-grid-numeric" scope="col">
            <a class="sw-data-grid-sort" href="?sort=year&amp;dir=asc">Year<span class="sw-data-grid-sort-icon" aria-hidden="true"></span><span class="sw-sr-only">, sort ascending</span></a>
          </th>
          <th class="sw-data-grid-numeric" scope="col">
            <a class="sw-data-grid-sort" href="?sort=budget&amp;dir=asc">Budget (CHF)<span class="sw-data-grid-sort-icon" aria-hidden="true"></span><span class="sw-sr-only">, sort ascending</span></a>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="sw-data-grid-select"><input type="checkbox" name="project" value="archiv" aria-label="Select Archiv 1957" /></td>
          <th class="sw-data-grid-sticky" scope="row">Archiv 1957</th>
          <td>ETH Bibliothek</td>
          <td class="sw-data-grid-numeric">2024</td>
          <td class="sw-data-grid-numeric">121’000</td>
        </tr>
        <tr>
          <td class="sw-data-grid-select"><input type="checkbox" name="project" value="atlas" aria-label="Select Atlas der Stille" /></td>
          <th class="sw-data-grid-sticky" scope="row">Atlas der Stille</th>
          <td>Kunsthalle Basel</td>
          <td class="sw-data-grid-numeric">2024</td>
          <td class="sw-data-grid-numeric">96’000</td>
        </tr>
        <tr>
          <td class="sw-data-grid-select"><input type="checkbox" name="project" value="rigi" aria-label="Select Bergbahn Rigi" /></td>
          <th class="sw-data-grid-sticky" scope="row">Bergbahn Rigi</th>
          <td>Rigi Bahnen</td>
          <td class="sw-data-grid-numeric">2023</td>
          <td class="sw-data-grid-numeric">210’000</td>
        </tr>
        <tr>
          <td class="sw-data-grid-select"><input type="checkbox" name="project" value="grotesk" aria-label="Select Grotesk Neu" /></td>
          <th class="sw-data-grid-sticky" scope="row">Grotesk Neu</th>
          <td>Typothek Zürich</td>
          <td class="sw-data-grid-numeric">2025</td>
          <td class="sw-data-grid-numeric">58’000</td>
        </tr>
        <tr>
          <td class="sw-data-grid-select"><input type="checkbox" name="project" value="klang" aria-label="Select Klangraum" checked /></td>
          <th class="sw-data-grid-sticky" scope="row">Klangraum</th>
          <td>KKL Luzern</td>
          <td class="sw-data-grid-numeric">2025</td>
          <td class="sw-data-grid-numeric">167’000</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

The selected row's `:first-child` is the checkbox cell, so its 2px bar sits at the row's inline start on both routes.

- [ ] **Step 4: Write the page.** Create `apps/docs/src/content/components/data-grid.mdx`:

```mdx
---
title: DataGrid
group: Display
order: 15
summary: A table to sort, select from, resize and scroll, for data people work with.
interactive: true
props:
  - name: caption
    type: ReactNode
    description: Required. Shown above the grid and names it.
  - name: selectionMode / selectedKeys / defaultSelectedKeys / onSelectionChange
    type: '"none" | "single" | "multiple" / … / (keys) => void'
    description: Row selection. Multiple selection adds a checkbox column and Select all.
  - name: sortDescriptor / onSortChange
    type: "{ column, direction } / (descriptor) => void"
    description: The sorted column and direction; sort the rows yourself when it changes.
  - name: maxHeight
    type: string
    description: A CSS length. The grid scrolls inside it and the header row sticks.
  - name: virtualized
    type: "{ rowHeight, headingHeight? }"
    description: Draw only the rows in view, for thousands of rows. Every row must be rowHeight pixels tall.
  - name: DataGridColumn props
    type: "allowsSorting, allowsResizing, isRowHeader, numeric, sticky, defaultWidth, minWidth"
    description: Per column. Mark the column that names each row as isRowHeader, and make it sticky.
  - name: DataGridBody emptyState
    type: ReactNode
    description: Shown inside the grid when there are no rows, usually an EmptyState.
a11y:
  - The grid is one tab stop. Arrow keys move between rows and cells, Space selects a row, and Enter on a sortable header sorts it.
  - The sorted column carries aria-sort, so screen readers announce the direction; the chevron shows it on screen, never colour alone.
  - A selected row has a fill, a 2px bar at its start and a ticked checkbox; in forced-colours mode it uses the system highlight.
  - Resize handles can be moved from the keyboard as well as by dragging.
  - Without React, sort headers are links your server answers, with aria-sort on the current column, and rows are selected with checkbox inputs inside your form. Select all needs the short script below.
---
import CodeBlock from "../../components/CodeBlock.astro";
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Archive from "../../demos/data-grid/Archive";
import archiveSource from "../../demos/data-grid/Archive.tsx?raw";
import NoResults from "../../demos/data-grid/NoResults";
import noResultsSource from "../../demos/data-grid/NoResults.tsx?raw";
import Projects from "../../demos/data-grid/Projects";
import projectsSource from "../../demos/data-grid/Projects.tsx?raw";
import projectsHtml from "../../demos/data-grid/projects.html?raw";

export const selectAllScript = `document.addEventListener("change", (event) => {
  const input = event.target;
  const table = input instanceof HTMLInputElement ? input.closest("table.sw-data-grid") : null;
  const all = table?.querySelector("thead input[data-select-all]");
  if (!all) return;
  const rows = [...table.querySelectorAll('tbody input[type="checkbox"]')];
  if (input === all) rows.forEach((box) => (box.checked = all.checked));
  const checked = rows.filter((box) => box.checked).length;
  all.checked = checked === rows.length;
  all.indeterminate = checked > 0 && checked < rows.length;
});`;

<Example title="Projects" source={projectsSource}>
  <Projects client:load />
</Example>

Sort by Project, Year or Budget; resize Project and Client from their handles. The grid scrolls inside 22rem, keeping its header and the Project column in view.

<Example title="No results" source={noResultsSource}>
  <NoResults client:load />
</Example>

<Example title="Archive" source={archiveSource}>
  <Archive client:load />
</Example>

The archive has 5,000 rows, but only the rows in view are drawn.

<NativeExample title="Projects without React" html={projectsHtml} />

Select all in the native grid needs this script once per page:

<CodeBlock code={selectAllScript} label="Select all script" />

For data that is only read, use Table. Pair a DataGrid with Pagination when the server pages the data, and with SearchField or TagGroup to filter it.
```

- [ ] **Step 5: Build and check the page.**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/react build && pnpm --filter @raster/docs build`
Expected: `69 page(s) built`.

Run: `cd apps/docs && npx playwright test --project=chromium -g "/components/data-grid/"`
Expected: PASS (structure, 320px reflow and axe in four combinations). Notes if not:
- If axe reports the resize handle's target size, check that the handle is 24px wide and that neighbouring targets keep 24px spacing; report the exact rule rather than hiding the handle.
- If reflow fails, the grid region should scroll and the page should not; check `.sw-data-grid-wrap { min-inline-size: 0 }` reached the example's container.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs
git commit -m "docs: DataGrid page"
```

---

### Task 5: Browser walkthroughs and virtualisation

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`

- [ ] **Step 1: Write the walkthroughs.** Append to `apps/docs/e2e/keyboard.spec.ts`:

```ts
test("data grid, React: arrows move, Space selects a row, Enter on a header sorts", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Projects").getByRole("grid", { name: "Studio projects" });
  const firstRow = grid.getByRole("row").nth(1);
  await tabTo(page, firstRow);
  await page.keyboard.press("ArrowDown");
  const secondRow = grid.getByRole("row").nth(2);
  await expect(secondRow).toBeFocused();
  await page.keyboard.press("Space");
  await expect(secondRow).toHaveAttribute("aria-selected", "true");
  // Into the cells, across to Project, up to its header, and sort.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  const project = grid.getByRole("columnheader", { name: "Project" });
  await expect(project).toBeFocused();
  await expect(project).toHaveAttribute("aria-sort", "ascending");
  await page.keyboard.press("Enter");
  await expect(project).toHaveAttribute("aria-sort", "descending");
  await expect(grid.getByRole("rowheader").first()).toHaveText("Velo Bern");
});

test("data grid, React: a column resizes from the keyboard", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Projects").getByRole("grid", { name: "Studio projects" });
  const client = grid.getByRole("columnheader", { name: "Client" });
  const before = (await client.boundingBox())?.width ?? 0;
  await tabTo(page, grid.getByRole("row").nth(1));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  await expect(client).toBeFocused();
  // React Aria: Enter on a column that is not sortable moves focus to its resizer.
  await page.keyboard.press("Enter");
  await expect(client.locator(".sw-data-grid-resizer")).toHaveAttribute("data-focus-visible", "true");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  const after = (await client.boundingBox())?.width ?? 0;
  expect(after).toBeGreaterThan(before);
});

test("data grid, React: a virtualised grid draws only the rows in view", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Archive").getByRole("grid", { name: "Archive, 5,000 entries" });
  await expect(grid).toHaveAttribute("aria-rowcount", "5001");
  const drawn = await grid.getByRole("row").count();
  expect(drawn).toBeGreaterThan(5);
  expect(drawn).toBeLessThan(60);
});

test("data grid, native: sort links carry aria-sort; Select all checks every row and shows a partial selection", async ({ page }) => {
  await page.goto("/components/data-grid/");
  const grid = example(page, "Projects without React").getByRole("table", { name: "Studio projects" });
  await expect(grid.getByRole("columnheader", { name: /Project/ })).toHaveAttribute("aria-sort", "ascending");
  await expect(grid.getByRole("link", { name: "Project, sort descending" })).toHaveAttribute("href", "?sort=name&dir=desc");
  const all = grid.getByRole("checkbox", { name: "Select all projects" });
  const rows = grid.locator('tbody input[type="checkbox"]');
  await all.check();
  for (const box of await rows.all()) await expect(box).toBeChecked();
  await rows.first().uncheck();
  await expect(all).not.toBeChecked();
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
});
```

- [ ] **Step 2: Run them.**

Run: `pnpm --filter @raster/docs build && cd apps/docs && npx playwright test --project=chromium e2e/keyboard.spec.ts -g "data grid"`
Expected: PASS, 4 tests. Notes if not:
- React Aria's grid moves focus to a row first and to its cells with ArrowRight, and from a cell ArrowUp reaches the column header. If the number of presses differs (for example because the checkbox cell takes a step), adjust the count and keep the assertion that the Project header is focused before Enter.
- If Enter on a non-sortable header does not reach the resizer, read `useTableColumnHeader` and `useTableColumnResize` in `node_modules` for the real keyboard path (it may be Enter, or a menu), follow it, and keep the assertion that the column got wider.
- If the virtualised grid draws all 5,000 rows or none, apply the note at the end of Task 4, Step 2.

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/e2e/keyboard.spec.ts
git commit -m "test(docs): DataGrid keyboard, resizing, virtualisation and native Select all"
```

---

### Task 6: Forced colours and visual baselines

**Files:**
- Modify: `apps/docs/e2e/forced-colors.spec.ts`
- Create: new PNGs under `apps/docs/e2e/__screenshots__/`

- [ ] **Step 1: Add the forced-colours cases.** In `apps/docs/e2e/forced-colors.spec.ts`, add to `CASES`:

```ts
  { path: "/components/data-grid/", title: "Projects", name: "data-grid" },
  { path: "/components/data-grid/", title: "Projects without React", name: "data-grid-native" },
```

- [ ] **Step 2: Generate and check them.**

Run: `cd apps/docs && npx playwright test --project=chromium e2e/forced-colors.spec.ts --update-snapshots`
Expected: 14 passed, 2 new files written. Run again without the flag: 14 passed, nothing written.

- [ ] **Step 3: Generate the visual baselines.**

Run: `cd apps/docs && npx playwright test --project=visual -g "examples on data-grid$" --update-snapshots`
Expected: 12 passed, 48 new PNGs (4 examples × 12 variants). Then `git status --short apps/docs/e2e/__screenshots__` must show only new (`??`) files.

- [ ] **Step 4: Look at the images.** Open each with the Read tool and report briefly what you see:
- `forced-data-grid-darwin.png`: the selected row (Linie 7) is a solid system highlight band with readable text; the checkboxes, sort chevrons and resize lines are visible.
- `forced-data-grid-native-darwin.png`: the checked row (Klangraum) is highlighted; the sort chevrons are visible.
- `data-grid-1-alpine-light-1440-darwin.png`: header and Project column distinct from the rows; Linie 7 has the subtle fill and the 2px bar; chevrons beside Project, Year and Budget only; numbers end-aligned; resize lines at the end of Project and Client; the header separated from the body by the dark rule Table uses.
- `data-grid-1-zurich-dark-360-darwin.png`: the grid scrolls inside its region; the selection column and Project column fit; nothing spills past the example frame.
- `data-grid-2-alpine-light-768-darwin.png`: the empty state sits inside the grid under the header, with its label, heading, sentence and button.
- `data-grid-3-alpine-dark-1440-darwin.png`: the archive shows rows at an even 48px rhythm with text vertically centred, numbers end-aligned, and no overlapping rows.
- `data-grid-4-alpine-light-360-darwin.png`: the native grid matches the React one closely: same caption, rules, chevrons and the selected row's fill and bar.

If something is wrong in the CSS, fix it with a CSS test, rebuild, regenerate only the affected images, look again, and say what changed.

- [ ] **Step 5: Run the full docs browser suite.**

Run: `cd apps/docs && npx playwright test`
Expected: PASS for both projects. Note the counts.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/e2e
git commit -m "test(docs): DataGrid forced-colours cases and visual baselines"
```

---

### Task 7: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what Plan 7e settled.** Append to the spec, adjusting any line the build proved different and saying so in the hand-off:

```markdown

## 15. Settled in Plan 7e

- **DataGrid is Table plus behaviour.** It carries `.sw-table`, so the two read as one family; Table stays for read-only data.
- **Wrappers add the selection column.** `DataGridHeader` and `DataGridRow` read `useTableOptions` and add the Select all and row checkboxes for multiple selection, so apps never place them by hand.
- **Columns are static.** DataGridHeader takes DataGridColumn elements; rows may be static or rendered from `items`.
- **Sorting is the app's.** The grid reports `onSortChange`; the app sorts. On the native route the server sorts from the header links.
- **The native route needs one optional script,** for Select all. Without it every row checkbox still works and submits.
- **No parity screenshots:** native checkboxes and link headers cannot match React Aria's rendering.
```

- [ ] **Step 2: Run everything.**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and both apps' browser tests PASS. Note the counts.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7e's outcomes"
```

---

## Self-review notes

- **Spec coverage (section 14):** sorting, selection, empty state, sticky header and first column, resizing, virtualisation → Tasks 1–2 and 4–5; native sort links, checkboxes and Select all → Tasks 1, 3, 4, 5; visual rules → Task 1; testing → Tasks 2, 3, 5, 6; settled notes → Task 7.
- **Names used across tasks:** CSS `sw-data-grid-wrap`, `sw-data-grid-caption`, `sw-data-grid-scroll`, `sw-data-grid`, `sw-data-grid-selectable`, `sw-data-grid-virtualized`, `sw-data-grid-header`, `sw-data-grid-column`, `sw-data-grid-head`, `sw-data-grid-label`, `sw-data-grid-sort`, `sw-data-grid-sort-icon` (with `data-direction`), `sw-data-grid-resizer`, `sw-data-grid-body`, `sw-data-grid-row`, `sw-data-grid-cell`, `sw-data-grid-select`, `sw-data-grid-sticky`, `sw-data-grid-numeric`; React `DataGrid`, `DataGridHeader`, `DataGridColumn`, `DataGridBody`, `DataGridRow`, `DataGridCell`; docs `installSelectAll`, `PROJECTS`, `formatFrancs`.
- **Page count:** 68 before; 69 after Task 4. **Component count:** 57 + DataGrid = 58.
- **Risks named in the tasks:** the virtualised grid's scroll container (Task 4, Step 2), the keyboard path to a resizer (Task 5), and a sticky first column under virtualisation (the Archive example has no sticky column; if a later need arises, test it then).
