# Raster Plan 5: Manifesto template

> **For agentic workers:** executed inline (executing-plans). Steps use checkbox (`- [ ]`) syntax.

**Goal:** A fourth docs template, `/templates/manifesto/`, that sets the "Raster: Why We Are Redrawing the Grid" document as a long editorial page, with theme-aware placeholder graphics and an on-page theme switch, so both themes can be judged on real content.

**Architecture:** One Astro page on `Base.astro`, HTML class contract only (no React island). Graphics are inline SVG components in `src/components/manifesto/` whose colours come from theme roles through CSS classes (presentation attributes cannot take `var()`), so they re-theme with `data-theme` and `data-mode`. The on-page switch reuses `bindSettings` (`button[data-setting][data-value]`), so it stays in sync with the footer toggles.

**Tech stack:** Astro 7.4.1, `@raster/css`, Playwright.

## Content source

The doc text as of 2026-11-04 (rev 12), copied verbatim. Later doc edits do not flow through.

## Graphics (no imitation of historical posters)

| Name | Where | Shows |
|---|---|---|
| Composition I | under the masthead | A 12-column field with blocks on column spans and one signal bar |
| Modular page | §2 | A fixed 1:√2 page with a 4 × 6 module grid |
| Many formats | §4 | One fixed sheet against phone, tablet and desktop frames at 4, 8 and 12 columns |
| Type scale | §6 | The eight type steps as bars, display to label |
| Baseline | §7 | Text lines snapping to a 4px field |
| Composition II | §9 | A closing arrangement of rules and blocks |

Each is `role="img"` with an `aria-label`, inside `.sw-figure` with a numbered caption.

## Tasks

### Task 1: Graphics
- [ ] Create `src/components/manifesto/Graphic.astro` taking `kind` and rendering one of the six SVGs.
- [ ] Add `.mf-*` colour classes to `docs.css` mapping to `--accent`, `--brand-signal`, `--text-primary`, `--border`, `--border-strong`, `--surface-subtle`.

### Task 2: Page
- [ ] Create `src/pages/templates/manifesto.astro`: masthead (label, display h1, lead, byline), on-page switch, Composition I, then sections 01–09 on the hanging grid (label column = number + short name; content column = h2 + prose, lists, tables, figures).
- [ ] Tables use `.sw-table` inside a focusable `.sw-table-wrap` region with a name.
- [ ] Refusals set as large single statements.
- [ ] Add the template to `templates/index.astro`.

### Task 3: Tests
- [ ] `e2e/templates.spec.ts`: index lists four templates; manifesto has the h1, nine numbered h2 sections, six figures with captions, three tables, and the on-page switch changes `data-theme` on `<html>` and marks the pressed button.
- [ ] The a11y spec covers the page automatically (axe in four combinations, 320px reflow).
- [ ] Generate the 12 visual baselines for the template (`--update-snapshots` on that test only) and check them by eye.

### Task 4: Verify
- [ ] `pnpm verify` passes. Browser check in both themes and modes at 360 and 1440px.
