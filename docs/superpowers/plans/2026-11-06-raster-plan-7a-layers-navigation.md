# Raster Plan 7a: Layers and navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Disclosure/Accordion, Popover, Drawer, the Header's compact menu, Pagination and SideNav to Raster on both routes (native HTML and React Aria), prove the routes render alike with parity screenshots, and switch the docs site header to compact mode so it no longer scrolls sideways on phones.

**Architecture:** One CSS contract per component in `@raster/css` styles native elements (`<details>`, `<dialog>` opened by invoker commands, the `popover` attribute) and React Aria output alike. Thin React wrappers in `@raster/react` render the same classes. The docs get a `NativeExample` component for "Without React" examples, and a parity helper that screenshots a React example and its native twin against one shared baseline.

**Tech stack:** Lightning CSS 1.33, React 19.1, React Aria Components 1.22.1, Vitest 3.2 + jsdom, Astro 7.4.1 + MDX, Playwright 1.64 + axe.

**Spec:** [Raster version 2: components for real products](../specs/2026-11-06-raster-v2-components-design.md), sections 2–7. Browser support was checked on 2026-11-06: invoker commands have been Baseline since Safari 26.2 (December 2025) and CSS anchor positioning since Firefox 147 (January 2026), so fallbacks stay small.

**Branch:** `raster/plan-7a-layers-navigation` (already created; the spec commit 5f1e10e is on it).

---

## Conventions every task follows

- Run commands from the repository root unless a step says otherwise.
- CSS goes in `packages/css/src/components/<name>.css`, imported in `packages/css/src/index.css` with `layer(raster.components)`. No raw colours (stylelint enforces it); only tokens, `transparent`, `currentColor` and `color-mix()` of tokens.
- React components forward `ref` (via `ComponentPropsWithRef` or React Aria's own ref handling) and merge `className` with `cx`.
- Docs demo headings start at level 3. Landmark names in demos must not repeat the site's ("Main", "Breadcrumbs", "Previous and next component") or each other's.
- After a CSS change, rebuild before running docs tests: `pnpm --filter @raster/css build`.
- Commit at the end of every task with the message given and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

| File | Responsibility |
|---|---|
| `packages/css/src/components/disclosure.css` | Disclosure rows, Accordion group, plus/minus icon, native height animation |
| `packages/css/src/components/popover.css` | Content popovers on both routes; native `popover` anchoring and motion |
| `packages/css/src/components/drawer.css` | Drawer panel docked to the end or bottom; backdrop and slide motion |
| `packages/css/src/components/header.css` | Adds compact mode and the full-screen menu |
| `packages/css/src/components/pagination.css` | Page links, current page, steps, ellipsis |
| `packages/css/src/components/sidenav.css` | Section navigation list, current item, collapsible groups |
| `packages/react/src/disclosure/Disclosure.tsx` | `Disclosure`, `Accordion` |
| `packages/react/src/overlays/Popover.tsx` | `Popover` |
| `packages/react/src/overlays/Drawer.tsx` | `Drawer` |
| `packages/react/src/navigation/Header.tsx` | Adds `compact` and `menuLabel` |
| `packages/react/src/navigation/Pagination.tsx` | `Pagination`, `paginationItems` |
| `packages/react/src/navigation/SideNav.tsx` | `SideNav`, `SideNavLink`, `SideNavGroup` |
| `apps/docs/src/components/NativeExample.astro` | Renders a native HTML example with its HTML code |
| `apps/docs/src/demos/<component>/*.tsx`, `*.html` | React demos and their native twins |
| `apps/docs/src/content/components/*.mdx` | Five new pages; `header.mdx` gains two examples |
| `apps/docs/src/components/SiteHeader.astro` | The docs header in compact mode |
| `apps/docs/e2e/parity.ts`, `e2e/parity.spec.ts` | The parity harness and its checks |
| `apps/docs/e2e/keyboard.spec.ts` | New keyboard walkthroughs |

---

### Task 1: Disclosure CSS

**Files:**
- Create: `packages/css/src/components/disclosure.css`
- Modify: `packages/css/src/index.css`
- Test: `packages/css/test/components.test.ts`

- [ ] **Step 1: Write the failing tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("disclosure", () => {
  it("separates rows with hairlines; an accordion adds one above the first row", () => {
    expect(rule(".sw-disclosure")).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-accordion")).toMatch(/border-block-start:\s*1px solid var\(--border\)/);
  });

  it("makes the trigger a full-width 44px row on both routes", () => {
    const r = rule(".sw-disclosure-trigger");
    expect(r).toMatch(/inline-size:\s*100%/);
    expect(r).toMatch(/min-block-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/list-style:\s*none/);
    expect(css).toMatch(/summary\.sw-disclosure-trigger::?-webkit-details-marker\s*\{[^}]*display:\s*none/);
  });

  it("draws the plus with borders (visible in forced colours) and drops the vertical bar when open", () => {
    expect(css).toMatch(/\.sw-disclosure-icon::?before,\s*\.sw-disclosure-icon::?after\s*\{[^}]*border-block-start:\s*1\.5px solid currentColor/i);
    expect(css).toMatch(/:is\(details\[open\] > summary,\s*\[aria-expanded="?true"?\]\) > \.sw-disclosure-icon::?after\s*\{[^}]*display:\s*none/);
  });

  it("animates the native panel's height, and not under reduced motion", () => {
    expect(css).toMatch(/\.sw-disclosure::details-content\s*\{[^}]*transition:[^}]*block-size var\(--dur-base\)/);
    expect(css).toMatch(/\.sw-disclosure\[open\]::details-content\s*\{[^}]*block-size:\s*auto/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-disclosure::details-content\s*\{[^}]*transition:\s*none/);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-disclosure`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/disclosure.css`:

```css
/*
 * Disclosure: native <details>/<summary>, or React Aria's Disclosure (a heading wrapping a trigger
 * button, then a panel). Both routes share these classes. Accordion is a group of disclosures.
 */
.sw-disclosure {
  border-block-end: 1px solid var(--border);
  interpolate-size: allow-keywords;
}

.sw-accordion {
  border-block-start: 1px solid var(--border);
}

/* React route: the heading only carries semantics; the trigger inside it does the styling. */
.sw-disclosure-heading {
  margin: 0;
  font: inherit;
}

.sw-disclosure-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  inline-size: 100%;
  min-block-size: var(--target-min);
  padding-block: var(--space-4);
  padding-inline: 0;
  border: 0;
  background: none;
  color: var(--text-primary);
  font: inherit;
  font-weight: 500;
  text-align: start;
  list-style: none;
  cursor: pointer;
}

summary.sw-disclosure-trigger::-webkit-details-marker {
  display: none;
}

/* Plus that becomes minus: borders, so the bars survive forced-colours mode. */
.sw-disclosure-icon {
  position: relative;
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
}

.sw-disclosure-icon::before,
.sw-disclosure-icon::after {
  content: "";
  position: absolute;
  inset-block-start: calc(50% - 0.75px);
  inset-inline: 0;
  border-block-start: 1.5px solid currentColor;
}

.sw-disclosure-icon::after {
  transform: rotate(90deg);
}

:is(details[open] > summary, [aria-expanded="true"]) > .sw-disclosure-icon::after {
  display: none;
}

.sw-disclosure-panel {
  padding-block-end: var(--space-5);
}

/* Native route: animate the panel's height where the browser can. React Aria hides its panel
   with the hidden attribute, so the React route opens instantly. */
.sw-disclosure::details-content {
  block-size: 0;
  overflow: clip;
  transition:
    block-size var(--dur-base) var(--ease-standard),
    content-visibility var(--dur-base) allow-discrete;
}

.sw-disclosure[open]::details-content {
  block-size: auto;
}

@media (prefers-reduced-motion: reduce) {
  .sw-disclosure::details-content {
    transition: none;
  }
}

[data-motion="reduce"] .sw-disclosure::details-content {
  transition: none;
}
```

- [ ] **Step 4: Import it.** In `packages/css/src/index.css`, after the `header.css` line, add:

```css
@import "./components/disclosure.css" layer(raster.components);
```

- [ ] **Step 5: Run the tests to see them pass, and lint.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: all CSS tests PASS (including the existing lint test); stylelint reports nothing.

- [ ] **Step 6: Commit.**

```bash
git add packages/css/src/components/disclosure.css packages/css/src/index.css packages/css/test/components.test.ts
git commit -m "feat(css): disclosure and accordion for native details and React Aria"
```

---

### Task 2: Disclosure and Accordion in React

**Files:**
- Create: `packages/react/src/disclosure/Disclosure.tsx`
- Create: `packages/react/test/disclosure.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`

- [ ] **Step 1: Write the failing tests.** Create `packages/react/test/disclosure.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion, Disclosure } from "../src/disclosure/Disclosure";
import { expectAccessible } from "./axe";

describe("Disclosure", () => {
  it("renders the class contract: a heading wrapping the trigger, then the panel", () => {
    const { container } = render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("sw-disclosure");
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("sw-disclosure-heading");
    const trigger = screen.getByRole("button", { name: "Delivery" });
    expect(trigger).toHaveClass("sw-disclosure-trigger");
    expect(trigger.querySelector(".sw-disclosure-icon")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".sw-disclosure-panel")).not.toBeNull();
  });

  it("toggles with the trigger and reports aria-expanded", async () => {
    const user = userEvent.setup();
    render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    const trigger = screen.getByRole("button", { name: "Delivery" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Two to four weeks.")).not.toBeVisible();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Two to four weeks.")).toBeVisible();
  });

  it("accepts a heading level, a default state and a className", () => {
    const { container } = render(
      <Disclosure title="Delivery" headingLevel={2} defaultExpanded className="extra">
        Two to four weeks.
      </Disclosure>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("sw-disclosure", "extra");
    expect(screen.getByRole("button", { name: "Delivery" })).toHaveAttribute("aria-expanded", "true");
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Disclosure title="Delivery">Two to four weeks.</Disclosure>);
    await expectAccessible(container);
  });
});

describe("Accordion", () => {
  function Faq(props: { allowsMultipleExpanded?: boolean }) {
    return (
      <Accordion {...props}>
        <Disclosure id="cost" title="Cost">Fixed fee.</Disclosure>
        <Disclosure id="time" title="Time">Twelve weeks.</Disclosure>
      </Accordion>
    );
  }

  it("is a group with the accordion class", () => {
    const { container } = render(<Faq />);
    expect(container.firstElementChild).toHaveClass("sw-accordion");
  });

  it("opens one item at a time by default", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const cost = screen.getByRole("button", { name: "Cost" });
    const time = screen.getByRole("button", { name: "Time" });
    await user.click(cost);
    await user.click(time);
    expect(cost).toHaveAttribute("aria-expanded", "false");
    expect(time).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps several open when allowsMultipleExpanded is set", async () => {
    const user = userEvent.setup();
    render(<Faq allowsMultipleExpanded />);
    await user.click(screen.getByRole("button", { name: "Cost" }));
    await user.click(screen.getByRole("button", { name: "Time" }));
    expect(screen.getByRole("button", { name: "Cost" })).toHaveAttribute("aria-expanded", "true");
  });
});
```

- [ ] **Step 2: Run the tests to see them fail.**

Run: `pnpm --filter @raster/react test -- disclosure`
Expected: FAIL, cannot resolve `../src/disclosure/Disclosure`.

- [ ] **Step 3: Write the components.** Create `packages/react/src/disclosure/Disclosure.tsx`:

```tsx
import type { Key, ReactNode } from "react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading as AriaHeading,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type DisclosureProps = {
  /** The row's label; also the trigger button's accessible name. */
  title: ReactNode;
  children: ReactNode;
  /** Key within an Accordion. */
  id?: Key;
  /** Level of the heading that wraps the trigger. Defaults to 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  isDisabled?: boolean;
  className?: string;
};

/** A row that shows or hides its panel. Native twin: <details class="sw-disclosure">. */
export function Disclosure({ title, children, headingLevel = 3, className, ...rest }: DisclosureProps) {
  return (
    <AriaDisclosure className={cx("sw-disclosure", className)} {...rest}>
      <AriaHeading level={headingLevel} className="sw-disclosure-heading">
        <AriaButton slot="trigger" className="sw-disclosure-trigger">
          <span className="sw-disclosure-title">{title}</span>
          <span className="sw-disclosure-icon" aria-hidden="true" />
        </AriaButton>
      </AriaHeading>
      <DisclosurePanel className="sw-disclosure-panel">{children}</DisclosurePanel>
    </AriaDisclosure>
  );
}

export type AccordionProps = {
  children: ReactNode;
  /** Let several rows stay open. Defaults to false: opening one closes the others. */
  allowsMultipleExpanded?: boolean;
  defaultExpandedKeys?: Iterable<Key>;
  className?: string;
};

/** A group of Disclosures. Native twin: <details> elements sharing a name attribute. */
export function Accordion({ className, ...rest }: AccordionProps) {
  return <DisclosureGroup className={cx("sw-accordion", className)} {...rest} />;
}
```

- [ ] **Step 4: Export them.** In `packages/react/src/index.ts`, after the `Tag` export line, add:

```ts
export { Accordion, type AccordionProps, Disclosure, type DisclosureProps } from "./disclosure/Disclosure";
```

In `packages/react/test/exports.test.ts`, add `"Accordion", "Disclosure",` to the `expected` array (before `"cx"`).

- [ ] **Step 5: Run the tests to see them pass, and typecheck.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS; no type errors.

- [ ] **Step 6: Commit.**

```bash
git add packages/react/src/disclosure packages/react/src/index.ts packages/react/test/disclosure.test.tsx packages/react/test/exports.test.ts
git commit -m "feat(react): Disclosure and Accordion on React Aria"
```

---

### Task 3: Popover (CSS and React)

**Files:**
- Create: `packages/css/src/components/popover.css`
- Create: `packages/react/src/overlays/Popover.tsx`
- Modify: `packages/css/src/index.css`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`
- Test: `packages/css/test/components.test.ts`, `packages/react/test/overlays.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("popover (content)", () => {
  it("holds content in a padded dialog with a capped width", () => {
    expect(rule(".sw-popover-content")).toMatch(/max-inline-size:\s*min\(20rem/);
    expect(rule(".sw-popover-content")).toMatch(/padding:\s*0/);
    expect(rule(".sw-popover-dialog")).toMatch(/padding:\s*var\(--space-4\)/);
  });

  it("anchors native popovers below their trigger only where anchor positioning exists", () => {
    expect(css).toMatch(/@supports \(position-anchor:\s*--a\)\s*\{[\s\S]*?\[popover\]\.sw-popover\s*\{[^}]*position-area:\s*block-end span-inline-end/);
  });

  it("fades native popovers in with a short slide, from a starting style", () => {
    expect(css).toMatch(/@starting-style\s*\{[\s\S]*?\[popover\]\.sw-popover:popover-open/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-popover-content`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/popover.css`:

```css
/*
 * Content popovers. The floating surface (.sw-popover: border, radius, shadow) is shared with
 * Select and Menu in overlay.css; .sw-popover-content adapts it for text and controls.
 * React route: React Aria Popover + Dialog. Native route: an element with the popover attribute,
 * anchored to its trigger with anchor-name / position-anchor.
 */
.sw-popover-content {
  max-inline-size: min(20rem, calc(100vw - 2 * var(--page-margin)));
  max-block-size: none;
  padding: 0;
  color: var(--text-primary);
}

.sw-popover-dialog {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  outline: none;
}

.sw-popover-title {
  margin: 0;
  font-size: var(--text-body-size);
  font-weight: 500;
  line-height: 1.25;
}

/* Native route. Without anchor positioning the browser's own centring is kept. */
@supports (position-anchor: --a) {
  [popover].sw-popover {
    inset: auto;
    margin: 0;
    margin-block-start: var(--space-2);
    position-area: block-end span-inline-end;
    position-try-fallbacks: flip-block, flip-inline;
  }
}

[popover].sw-popover {
  transition:
    opacity var(--dur-base) var(--ease-standard),
    transform var(--dur-base) var(--ease-standard),
    display var(--dur-base) allow-discrete,
    overlay var(--dur-base) allow-discrete;
}

[popover].sw-popover:not(:popover-open) {
  opacity: 0;
  transform: translateY(-4px);
}

@starting-style {
  [popover].sw-popover:popover-open {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  [popover].sw-popover:not(:popover-open) {
    transform: none;
  }

  @starting-style {
    [popover].sw-popover:popover-open {
      transform: none;
    }
  }
}

[data-motion="reduce"] [popover].sw-popover:not(:popover-open) {
  transform: none;
}
```

Import it in `packages/css/src/index.css` after `disclosure.css`:

```css
@import "./components/popover.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests to see them pass.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/overlays.test.tsx`, add the import `import { Popover } from "../src/overlays/Popover";` next to the Dialog import, and append:

```tsx
describe("Popover", () => {
  function Example() {
    return (
      <DialogTrigger>
        <Button>Grid units</Button>
        <Popover title="Grid units">
          <p>One unit is 4px.</p>
        </Popover>
      </DialogTrigger>
    );
  }

  it("opens a dialog named by its title on the content popover surface", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Grid units" }));
    const dialog = await screen.findByRole("dialog", { name: "Grid units" });
    expect(dialog).toHaveClass("sw-popover-dialog");
    expect(dialog.closest(".sw-popover")).toHaveClass("sw-popover-content");
    expect(screen.getByRole("heading", { level: 3, name: "Grid units" })).toHaveClass("sw-popover-title");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Grid units" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("can be named with aria-label when it has no title", async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>More</Button>
        <Popover aria-label="More options">
          <p>Body</p>
        </Popover>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(await screen.findByRole("dialog", { name: "More options" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- overlays`
Expected: FAIL, cannot resolve `../src/overlays/Popover`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/overlays/Popover.tsx`:

```tsx
import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type PopoverProps = {
  /** Visible title; it also names the popover. Without one, pass aria-label. */
  title?: ReactNode;
  "aria-label"?: string;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Position relative to the trigger. Defaults to "bottom start". */
  placement?: AriaPopoverProps["placement"];
  className?: string;
};

/**
 * A non-modal panel anchored to its trigger. Place inside DialogTrigger after the trigger Button.
 * Native twin: an element with the popover attribute and class "sw-popover sw-popover-content".
 */
export function Popover({ title, children, placement = "bottom start", className, "aria-label": ariaLabel }: PopoverProps) {
  return (
    <AriaPopover className={cx("sw-popover sw-popover-content", className)} placement={placement} offset={8}>
      <AriaDialog className="sw-popover-dialog" aria-label={ariaLabel}>
        {({ close }) => (
          <>
            {title != null && (
              <AriaHeading slot="title" level={3} className="sw-popover-title">
                {title}
              </AriaHeading>
            )}
            {typeof children === "function" ? children({ close }) : children}
          </>
        )}
      </AriaDialog>
    </AriaPopover>
  );
}
```

Export it in `packages/react/src/index.ts`, after the `Dialog` export:

```ts
export { Popover, type PopoverProps } from "./overlays/Popover";
```

Add `"Popover",` to the `expected` array in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: Popover for native popover and React Aria"
```

---

### Task 4: Drawer (CSS and React)

**Files:**
- Create: `packages/css/src/components/drawer.css`
- Create: `packages/react/src/overlays/Drawer.tsx`
- Modify: `packages/css/src/index.css`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`
- Test: `packages/css/test/components.test.ts`, `packages/react/test/overlays.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("drawer", () => {
  it("docks a full-height panel to the inline end with the overlay shadow", () => {
    const r = rule(".sw-drawer");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset-inline:\s*auto 0/);
    expect(r).toMatch(/inline-size:\s*min\(100%,\s*28rem\)/);
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/margin:\s*0/);
  });

  it("docks to the bottom as a sheet", () => {
    const r = rule('.sw-drawer[data-placement="bottom"]');
    expect(r).toMatch(/inset-block:\s*auto 0/);
    expect(r).toMatch(/max-block-size:\s*85dvh/);
  });

  it("dims the page behind on both routes", () => {
    expect(rule(".sw-drawer-overlay")).toMatch(/background-color:\s*var\(--scrim\)/);
    expect(css).toMatch(/dialog\.sw-drawer::backdrop\s*\{[^}]*background-color:\s*var\(--scrim\)/);
  });

  it("slides along one axis, mirrored in RTL, and only fades under reduced motion", () => {
    expect(css).toMatch(/\.sw-drawer:dir\(rtl\)\s*\{[^}]*--_drawer-from:\s*translateX\(-100%\)/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-drawer\s*\{[^}]*--_drawer-from:\s*none/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-drawer`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/drawer.css`:

```css
/*
 * Drawer: a modal panel docked to the inline end (default) or the bottom (a sheet).
 * Native route: <dialog class="sw-drawer"> opened with command="show-modal".
 * React route: ModalOverlay (.sw-drawer-overlay) > Modal (.sw-drawer) > Dialog.
 */
.sw-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background-color: var(--scrim);
}

.sw-drawer {
  --_drawer-from: translateX(100%);
  position: fixed;
  inset-block: 0;
  inset-inline: auto 0;
  z-index: var(--z-modal);
  inline-size: min(100%, 28rem);
  max-inline-size: none;
  block-size: 100dvh;
  max-block-size: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  border: 0;
  border-inline-start: 1px solid var(--border);
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
  color: var(--text-primary);
}

.sw-drawer:dir(rtl) {
  --_drawer-from: translateX(-100%);
}

.sw-drawer[data-placement="bottom"] {
  --_drawer-from: translateY(100%);
  inset-block: auto 0;
  inset-inline: 0;
  inline-size: 100%;
  block-size: auto;
  max-block-size: 85dvh;
  border-inline-start: 0;
  border-block-start: 1px solid var(--border);
}

dialog.sw-drawer::backdrop {
  background-color: var(--scrim);
}

.sw-drawer-dialog {
  display: grid;
  align-content: start;
  gap: var(--space-5);
  padding: var(--space-6);
  outline: none;
}

.sw-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.sw-drawer-head h2 {
  margin: 0;
}

/* Motion: slide in along one axis over --dur-slow. */
@keyframes sw-drawer-in {
  from {
    transform: var(--_drawer-from);
  }
}

.sw-drawer[data-entering] {
  animation: sw-drawer-in var(--dur-slow) var(--ease-standard);
}

.sw-drawer-overlay[data-entering] {
  animation: sw-fade-in var(--dur-slow) var(--ease-linear);
}

:is(.sw-drawer, .sw-drawer-overlay)[data-exiting] {
  animation: sw-overlay-out var(--dur-fast) var(--ease-linear);
}

dialog.sw-drawer {
  transition:
    transform var(--dur-slow) var(--ease-standard),
    display var(--dur-slow) allow-discrete,
    overlay var(--dur-slow) allow-discrete;
}

@starting-style {
  dialog.sw-drawer[open] {
    transform: var(--_drawer-from);
  }
}

/* Reduced motion: no slide; the overlay's fade remains. */
@media (prefers-reduced-motion: reduce) {
  .sw-drawer {
    --_drawer-from: none;
  }
}

[data-motion="reduce"] .sw-drawer {
  --_drawer-from: none;
}
```

Import it in `packages/css/src/index.css` after `popover.css`:

```css
@import "./components/drawer.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests to see them pass.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/overlays.test.tsx`, add `import { Drawer } from "../src/overlays/Drawer";` and append:

```tsx
describe("Drawer", () => {
  function Example({ placement }: { placement?: "end" | "bottom" }) {
    return (
      <DialogTrigger>
        <Button>Project details</Button>
        <Drawer title="Project details" placement={placement}>
          <p>Fourteen stations.</p>
        </Drawer>
      </DialogTrigger>
    );
  }

  it("opens a modal dialog named by its title in a docked panel", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Project details" }));
    const dialog = await screen.findByRole("dialog", { name: "Project details" });
    expect(dialog).toHaveClass("sw-dialog", "sw-drawer-dialog");
    const panel = dialog.closest(".sw-drawer");
    expect(panel).toHaveAttribute("data-placement", "end");
    expect(panel?.parentElement).toHaveClass("sw-drawer-overlay");
  });

  it("supports the bottom placement", async () => {
    const user = userEvent.setup();
    render(<Example placement="bottom" />);
    await user.click(screen.getByRole("button", { name: "Project details" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.closest(".sw-drawer")).toHaveAttribute("data-placement", "bottom");
  });

  it("closes from its Close button and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Project details" });
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("has no structural accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Project details" }));
    await expectAccessible(await screen.findByRole("dialog"));
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- overlays`
Expected: FAIL, cannot resolve `../src/overlays/Drawer`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/overlays/Drawer.tsx`:

```tsx
import type { ReactNode } from "react";
import { Dialog as AriaDialog, Heading as AriaHeading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

export type DrawerProps = {
  /** Visible title; also the drawer's accessible name. */
  title: ReactNode;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** "end" docks to the inline end (default); "bottom" makes a sheet. */
  placement?: "end" | "bottom";
  /** Close on a click outside the panel. Escape always closes. Defaults to true. */
  isDismissable?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Text of the close button. Defaults to "Close". */
  closeLabel?: string;
  className?: string;
};

/**
 * A modal panel docked to one edge. Place inside DialogTrigger after the trigger Button.
 * Native twin: <dialog class="sw-drawer"> opened by a button with command="show-modal".
 */
export function Drawer({
  title,
  children,
  placement = "end",
  isDismissable = true,
  isOpen,
  defaultOpen,
  onOpenChange,
  closeLabel = "Close",
  className,
}: DrawerProps) {
  return (
    <ModalOverlay
      className="sw-drawer-overlay"
      isDismissable={isDismissable}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className="sw-drawer" data-placement={placement}>
        <AriaDialog className={cx("sw-dialog sw-drawer-dialog", className)}>
          {({ close }) => (
            <>
              <div className="sw-drawer-head">
                <AriaHeading slot="title" level={2} className="sw-type-h3">
                  {title}
                </AriaHeading>
                <Button variant="ghost" onPress={close}>
                  {closeLabel}
                </Button>
              </div>
              {typeof children === "function" ? children({ close }) : children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
```

Export it in `packages/react/src/index.ts` after the Popover export:

```ts
export { Drawer, type DrawerProps } from "./overlays/Drawer";
```

Add `"Drawer",` to the `expected` array in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. If the `data-placement` assertion fails, React Aria did not forward the attribute: wrap `children` in the Modal with `<div className="sw-drawer-body" data-placement={placement}>` instead, and move the `[data-placement]` selectors in `drawer.css` to `.sw-drawer:has(> [data-placement="bottom"])` — then re-run Task 4's CSS tests after updating the bottom-placement selector in them.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: Drawer for native dialog and React Aria, docked to the end or bottom"
```

---
### Task 5: Header compact mode and full-screen menu (CSS and React)

**Files:**
- Modify: `packages/css/src/components/header.css`
- Modify: `packages/react/src/navigation/Header.tsx`
- Modify: `apps/docs/src/demos/header/Basic.tsx` (opt out, so the existing static example stays static)
- Test: `packages/css/test/components.test.ts`, `packages/react/test/navigation.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("header compact mode", () => {
  it("makes a compact header a named inline-size container", () => {
    expect(rule(".sw-header[data-compact]")).toMatch(/container:\s*sw-header\s*\/\s*inline-size/);
  });

  it("swaps the links for the menu button below 600px of header width", () => {
    expect(rule(".sw-header-menu-button")).toMatch(/display:\s*none/);
    expect(css).toMatch(
      /@container sw-header \(width < 600px\)\s*\{[\s\S]*?\.sw-header-nav\s*\{[^}]*display:\s*none[\s\S]*?\.sw-header-menu-button\s*\{[^}]*display:\s*inline-flex/,
    );
  });

  it("opens a full-screen menu on the page surface, on both routes", () => {
    const r = rule(".sw-header-menu");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset:\s*0/);
    expect(r).toMatch(/max-inline-size:\s*none/);
    expect(r).toMatch(/background-color:\s*var\(--surface-page\)/);
    expect(rule(".sw-header-menu-overlay")).toMatch(/z-index:\s*var\(--z-modal\)/);
  });

  it("sets links large, numbered in mono without announcing the numbers, with a signal bar on the current one", () => {
    const link = rule(".sw-header-menu-nav .sw-link");
    expect(link).toMatch(/font-size:\s*var\(--text-h2-size\)/);
    expect(link).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(css).toMatch(/\.sw-header-menu-nav \.sw-link::?before\s*\{[^}]*content:\s*counter\(sw-menu,\s*decimal-leading-zero\)\s*\/\s*""/);
    expect(css).toMatch(
      /\.sw-header-menu-nav \.sw-link\[aria-current\]:not\(\[aria-current="?false"?\]\)\s*\{[^}]*border-inline-start-color:\s*var\(--brand-signal\)/,
    );
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-header[data-compact]`.

- [ ] **Step 3: Add the CSS.** Append to `packages/css/src/components/header.css`:

```css
/*
 * Compact mode (data-compact): below 600px of header width the links move into a full-screen menu.
 * Native route: a <dialog class="sw-header-menu"> opened by the menu button with command="show-modal".
 * React route: ModalOverlay (.sw-header-menu-overlay) > Modal (.sw-header-menu) > Dialog.
 */
.sw-header[data-compact] {
  container: sw-header / inline-size;
}

.sw-header-menu-button {
  display: none;
}

.sw-header-actions + .sw-header-menu-button {
  margin-inline-start: 0;
}

@container sw-header (width < 600px) {
  .sw-header-nav {
    display: none;
  }

  .sw-header-menu-button {
    display: inline-flex;
    margin-inline-start: auto;
  }
}

.sw-header-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
}

.sw-header-menu {
  --_menu-from: translateY(-1.5rem);
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  inline-size: 100%;
  max-inline-size: none;
  block-size: 100dvh;
  max-block-size: none;
  margin: 0;
  padding: 0;
  overflow: auto;
  border: 0;
  background-color: var(--surface-page);
  color: var(--text-primary);
}

dialog.sw-header-menu::backdrop {
  background-color: transparent;
}

.sw-header-menu-dialog {
  display: grid;
  align-content: start;
  max-inline-size: calc(var(--content-max) + 2 * var(--page-margin));
  margin-inline: auto;
  padding-inline: var(--page-margin);
  outline: none;
}

.sw-header-menu-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-block-size: var(--header-height);
  border-block-end: 1px solid var(--border);
}

.sw-header-menu-nav {
  display: flex;
  flex-direction: column;
  padding-block: var(--space-6);
  counter-reset: sw-menu;
}

.sw-header-menu-nav .sw-link {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  padding-block: var(--space-4);
  padding-inline-start: var(--space-4);
  border-block-end: 1px solid var(--border);
  border-inline-start: 4px solid transparent;
  color: var(--text-primary);
  font-size: var(--text-h2-size);
  font-weight: 400;
  line-height: var(--text-h2-leading);
  letter-spacing: var(--text-h2-tracking);
  text-decoration-line: none;
  counter-increment: sw-menu;
}

/* The number is decoration: the alternative text after the slash keeps it out of the link's name. */
.sw-header-menu-nav .sw-link::before {
  content: counter(sw-menu, decimal-leading-zero) / "";
  flex: none;
  inline-size: 3ch;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
}

.sw-header-menu-nav .sw-link:focus-visible {
  outline-offset: calc(-1 * var(--focus-width));
}

.sw-header-menu-nav .sw-link[aria-current]:not([aria-current="false"]) {
  border-inline-start-color: var(--brand-signal);
  font-weight: 500;
}

/* Motion: a short slide down with a fade, over --dur-slow. */
@keyframes sw-menu-in {
  from {
    opacity: 0;
    transform: var(--_menu-from);
  }
}

.sw-header-menu[data-entering] {
  animation: sw-menu-in var(--dur-slow) var(--ease-standard);
}

.sw-header-menu[data-exiting] {
  animation: sw-overlay-out var(--dur-fast) var(--ease-linear);
}

dialog.sw-header-menu {
  transition:
    opacity var(--dur-slow) var(--ease-standard),
    transform var(--dur-slow) var(--ease-standard),
    display var(--dur-slow) allow-discrete,
    overlay var(--dur-slow) allow-discrete;
}

@starting-style {
  dialog.sw-header-menu[open] {
    opacity: 0;
    transform: var(--_menu-from);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sw-header-menu {
    --_menu-from: none;
  }
}

[data-motion="reduce"] .sw-header-menu {
  --_menu-from: none;
}
```

- [ ] **Step 4: Run the CSS tests to see them pass.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/navigation.test.tsx`, inside `describe("Header", …)` after the existing tests, add:

```tsx
  it("collapses its links into a full-screen menu in compact mode (the default)", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-compact");
    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveClass("sw-button", "sw-header-menu-button");
    await user.click(menuButton);
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    expect(menu).toHaveClass("sw-header-menu-dialog");
    expect(menu.closest(".sw-header-menu")?.parentElement).toHaveClass("sw-header-menu-overlay");
    const nav = within(menu).getByRole("navigation", { name: "Main" });
    expect(nav).toHaveClass("sw-header-menu-nav");
    expect(within(nav).getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the menu when a link is chosen", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = await screen.findByRole("dialog", { name: "Menu" });
    await user.click(within(menu).getByRole("link", { name: "Foundations" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes the menu from Close and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const menuButton = screen.getByRole("button", { name: "Menu" });
    await user.click(menuButton);
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(menuButton).toHaveFocus();
  });

  it("renders no menu when compact is false", () => {
    render(
      <Header compact={false} brand={<a href="/">Raster</a>}>
        <Link href="/foundations">Foundations</Link>
      </Header>,
    );
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-compact");
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
  });
```

Update the imports at the top of the file: change `import { render, screen } from "@testing-library/react";` to `import { render, screen, waitFor, within } from "@testing-library/react";`.

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- navigation`
Expected: FAIL, the banner has no `data-compact` attribute.

- [ ] **Step 7: Rewrite the component.** Replace `packages/react/src/navigation/Header.tsx` with:

```tsx
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { Dialog as AriaDialog, DialogTrigger, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

export type HeaderProps = Omit<ComponentPropsWithRef<"header">, "children"> & {
  /** Logo or site name, usually a link home. */
  brand: ReactNode;
  /** Navigation links (Link components; mark the current page with aria-current="page"). */
  children?: ReactNode;
  /** Controls at the inline end, such as a theme switch. */
  actions?: ReactNode;
  /** Name of the navigation landmark. Defaults to "Main". */
  navLabel?: string;
  /** Target of the skip link. Defaults to "#main"; give the main element that id and tabIndex={-1}. */
  skipTo?: string;
  /** Stick to the top of the viewport. Defaults to true. */
  sticky?: boolean;
  /** Below 600px of header width, move the links into a full-screen menu. Defaults to true. */
  compact?: boolean;
  /** Text of the menu button and name of the menu dialog. Defaults to "Menu". */
  menuLabel?: string;
};

/** The site banner: skip link, brand, primary navigation and actions; compact on narrow screens. */
export function Header({
  brand,
  children,
  actions,
  navLabel = "Main",
  skipTo = "#main",
  sticky = true,
  compact = true,
  menuLabel = "Menu",
  className,
  ...rest
}: HeaderProps) {
  const hasMenu = compact && children != null;
  return (
    <header
      className={cx("sw-header", className)}
      data-sticky={sticky ? "" : undefined}
      data-compact={hasMenu ? "" : undefined}
      {...rest}
    >
      <a className="sw-skip-link" href={skipTo}>
        Skip to content
      </a>
      <div className="sw-header-inner">
        <div className="sw-header-brand">{brand}</div>
        {children != null && (
          <nav className="sw-header-nav" aria-label={navLabel}>
            {children}
          </nav>
        )}
        {actions != null && <div className="sw-header-actions">{actions}</div>}
        {hasMenu && (
          <DialogTrigger>
            <Button variant="ghost" className="sw-header-menu-button">
              {menuLabel}
            </Button>
            <ModalOverlay className="sw-header-menu-overlay" isDismissable>
              <Modal className="sw-header-menu">
                <AriaDialog className="sw-header-menu-dialog" aria-label={menuLabel}>
                  {({ close }) => (
                    <>
                      <div className="sw-header-menu-bar">
                        <span className="sw-type-label sw-text-secondary">{menuLabel}</span>
                        <Button variant="ghost" onPress={close}>
                          Close
                        </Button>
                      </div>
                      <nav
                        className="sw-header-menu-nav"
                        aria-label={navLabel}
                        onClick={(event: MouseEvent<HTMLElement>) => {
                          if ((event.target as Element).closest("a")) close();
                        }}
                      >
                        {children}
                      </nav>
                    </>
                  )}
                </AriaDialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 8: Keep the existing static docs example static.** In `apps/docs/src/demos/header/Basic.tsx`, add `compact={false}` as the first prop of `<Header`:

```tsx
    <Header
      compact={false}
      sticky={false}
```

- [ ] **Step 9: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS, including the existing Header tests.

- [ ] **Step 10: Commit.**

```bash
git add packages/css packages/react apps/docs/src/demos/header/Basic.tsx
git commit -m "feat: Header compact mode with a full-screen menu on both routes"
```

---

### Task 6: Pagination (CSS and React)

**Files:**
- Create: `packages/css/src/components/pagination.css`
- Create: `packages/react/src/navigation/Pagination.tsx`
- Modify: `packages/css/src/index.css`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`
- Test: `packages/css/test/components.test.ts`, `packages/react/test/navigation.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("pagination", () => {
  it("gives every page link a 44px target in tabular mono figures", () => {
    const r = rule(".sw-pagination-link");
    expect(r).toMatch(/min-inline-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/min-block-size:\s*var\(--target-min\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  it("marks the current page with weight and a 2px underline, not colour alone", () => {
    const r = rule('.sw-pagination-link[aria-current="page"]');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mirrors the step arrows in RTL", () => {
    expect(css).toMatch(/\.sw-pagination-step svg:dir\(rtl\)\s*\{[^}]*transform:\s*scaleX\(-1\)/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-pagination-link`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/pagination.css`:

```css
/* Pagination: a named nav of page links. The same markup serves both routes; it has no behaviour. */
.sw-pagination-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sw-pagination-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-inline-size: var(--target-min);
  min-block-size: var(--target-min);
  padding-inline: var(--space-2);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-decoration-line: none;
  text-underline-offset: 0.35em;
}

@media (hover: hover) {
  .sw-pagination-link:hover {
    background-color: var(--surface-subtle);
  }
}

.sw-pagination-link:focus-visible {
  outline-offset: calc(-1 * var(--focus-width));
}

.sw-pagination-link[aria-current="page"] {
  font-weight: 500;
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
}

.sw-pagination-step {
  font-family: var(--font-sans);
}

.sw-pagination-step svg {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

.sw-pagination-step svg:dir(rtl) {
  transform: scaleX(-1);
}

.sw-pagination-ellipsis {
  display: inline-flex;
  justify-content: center;
  min-inline-size: var(--target-min);
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
```

Import it in `packages/css/src/index.css` after `drawer.css`:

```css
@import "./components/pagination.css" layer(raster.components);
```

- [ ] **Step 4: Run the CSS tests to see them pass.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/navigation.test.tsx`, add `import { Pagination, paginationItems } from "../src/navigation/Pagination";` and append:

```tsx
describe("paginationItems", () => {
  it("shows every page when the gaps are single pages", () => {
    expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses distant ranges into ellipses around the current page", () => {
    expect(paginationItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("keeps the opening pages together on the first page", () => {
    expect(paginationItems(1, 12)).toEqual([1, 2, "ellipsis", 12]);
  });

  it("widens the window with more siblings", () => {
    expect(paginationItems(6, 12, 2)).toEqual([1, "ellipsis", 4, 5, 6, 7, 8, "ellipsis", 12]);
  });

  it("clamps the page into range and handles no pages", () => {
    expect(paginationItems(99, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(1, 0)).toEqual([]);
  });
});

describe("Pagination", () => {
  const href = (page: number) => `?page=${page}`;

  it("is a named navigation landmark of page links", () => {
    render(<Pagination page={6} total={12} href={href} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toHaveClass("sw-pagination");
    expect(nav.querySelector("ul")).toHaveClass("sw-pagination-list");
    expect(screen.getByRole("link", { name: "Page 12" })).toHaveAttribute("href", "?page=12");
  });

  it("marks the current page and hides the ellipses from screen readers", () => {
    const { container } = render(<Pagination page={6} total={12} href={href} />);
    expect(screen.getByRole("link", { name: "Page 6" })).toHaveAttribute("aria-current", "page");
    const ellipses = container.querySelectorAll(".sw-pagination-ellipsis");
    expect(ellipses).toHaveLength(2);
    for (const e of ellipses) expect(e).toHaveAttribute("aria-hidden", "true");
  });

  it("links the previous and next pages, and omits a step that does not exist", () => {
    const { rerender } = render(<Pagination page={6} total={12} href={href} />);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "?page=5");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("rel", "next");
    rerender(<Pagination page={1} total={12} href={href} />);
    expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
    rerender(<Pagination page={12} total={12} href={href} />);
    expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
  });

  it("accepts a landmark name, labels and a className", () => {
    render(
      <Pagination aria-label="Results" previousLabel="Back" nextLabel="More" className="extra" page={2} total={3} href={href} />,
    );
    const nav = screen.getByRole("navigation", { name: "Results" });
    expect(nav).toHaveClass("sw-pagination", "extra");
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "More" })).toBeInTheDocument();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Pagination page={6} total={12} href={href} />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- navigation`
Expected: FAIL, cannot resolve `../src/navigation/Pagination`.

- [ ] **Step 7: Write the component.** Create `packages/react/src/navigation/Pagination.tsx`:

```tsx
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type PaginationItem = number | "ellipsis";

/**
 * The pages to show: the first, the last, and `siblings` pages either side of the current one.
 * A gap of one page shows that page; a longer gap becomes "ellipsis".
 */
export function paginationItems(page: number, total: number, siblings = 1): PaginationItem[] {
  if (total < 1) return [];
  const current = Math.min(Math.max(1, page), total);
  const shown = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) shown.add(p);
  const items: PaginationItem[] = [];
  let previous = 0;
  for (const p of [...shown].sort((a, b) => a - b)) {
    if (p - previous === 2) items.push(previous + 1);
    else if (p - previous > 2) items.push("ellipsis");
    items.push(p);
    previous = p;
  }
  return items;
}

export type PaginationProps = Omit<ComponentPropsWithRef<"nav">, "children"> & {
  /** The current page, counted from 1. */
  page: number;
  /** The number of pages. */
  total: number;
  /** The URL of a page. */
  href: (page: number) => string;
  /** Pages shown either side of the current one. Defaults to 1. */
  siblings?: number;
  previousLabel?: string;
  nextLabel?: string;
};

/** Links between the pages of a list. Markup only, so the HTML route is the same markup. */
export function Pagination({
  page,
  total,
  href,
  siblings = 1,
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
  "aria-label": ariaLabel = "Pagination",
  ...rest
}: PaginationProps) {
  const current = Math.min(Math.max(1, page), Math.max(total, 1));
  return (
    <nav className={cx("sw-pagination", className)} aria-label={ariaLabel} {...rest}>
      <ul className="sw-pagination-list">
        {current > 1 && (
          <li>
            <a className="sw-pagination-link sw-pagination-step" href={href(current - 1)} rel="prev">
              <ArrowLeft aria-hidden="true" />
              {previousLabel}
            </a>
          </li>
        )}
        {paginationItems(current, total, siblings).map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`}>
              <span className="sw-pagination-ellipsis" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              <a
                className="sw-pagination-link"
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
              >
                {item}
              </a>
            </li>
          ),
        )}
        {current < total && (
          <li>
            <a className="sw-pagination-link sw-pagination-step" href={href(current + 1)} rel="next">
              {nextLabel}
              <ArrowRight aria-hidden="true" />
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
```

Export it in `packages/react/src/index.ts` after the `Header` export:

```ts
export { Pagination, type PaginationItem, paginationItems, type PaginationProps } from "./navigation/Pagination";
```

Add `"Pagination", "paginationItems",` to the `expected` array in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: Pagination with collapsed ranges and 44px page targets"
```

---

### Task 7: SideNav (CSS and React)

**Files:**
- Create: `packages/css/src/components/sidenav.css`
- Create: `packages/react/src/navigation/SideNav.tsx`
- Modify: `packages/css/src/index.css`, `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`
- Test: `packages/css/test/components.test.ts`, `packages/react/test/navigation.test.tsx`

- [ ] **Step 1: Write the failing CSS tests.** Append to `packages/css/test/components.test.ts`:

```ts
describe("sidenav", () => {
  it("hangs the list from a hairline on the inline-start edge", () => {
    const r = rule(".sw-sidenav-list");
    expect(r).toMatch(/border-inline-start:\s*1px solid var\(--border\)/);
    expect(r).toMatch(/list-style:\s*none/);
  });

  it("gives links and group titles a 44px row with room for the current-item bar", () => {
    expect(css).toMatch(/\.sw-sidenav-link,\s*\.sw-sidenav-group-title\s*\{[^}]*min-block-size:\s*var\(--target-min\)[^}]*border-inline-start:\s*2px solid transparent/);
  });

  it("marks the current item with an accent bar and weight, not colour alone", () => {
    const r = rule('.sw-sidenav-link[aria-current]:not([aria-current="false"])');
    expect(r).toMatch(/border-inline-start-color:\s*var\(--accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `pnpm --filter @raster/css test -- components`
Expected: FAIL with `No rule for .sw-sidenav-list`.

- [ ] **Step 3: Write the CSS.** Create `packages/css/src/components/sidenav.css`:

```css
/*
 * SideNav: section navigation for documentation and app layouts. Groups are <details> on the native
 * route and React Aria Disclosures on the React route; both reuse .sw-disclosure-icon.
 */
.sw-sidenav-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border-inline-start: 1px solid var(--border);
}

.sw-sidenav-list .sw-sidenav-list {
  padding-inline-start: var(--space-4);
  border-inline-start: 0;
}

.sw-sidenav-link,
.sw-sidenav-group-title {
  display: flex;
  align-items: center;
  min-block-size: var(--target-min);
  margin-inline-start: -1px;
  padding-inline-start: var(--space-4);
  border-inline-start: 2px solid transparent;
}

.sw-sidenav-link {
  color: var(--text-secondary);
  text-decoration-line: none;
}

@media (hover: hover) {
  .sw-sidenav-link:hover {
    color: var(--text-primary);
  }
}

.sw-sidenav-link[aria-current]:not([aria-current="false"]) {
  border-inline-start-color: var(--accent);
  color: var(--text-primary);
  font-weight: 500;
}

.sw-sidenav-group-title {
  justify-content: space-between;
  gap: var(--space-3);
  inline-size: calc(100% + 1px);
  padding-inline-end: 0;
  border-block: 0;
  border-inline-end: 0;
  background: none;
  color: var(--text-primary);
  font: inherit;
  font-weight: 500;
  text-align: start;
  list-style: none;
  cursor: pointer;
}

summary.sw-sidenav-group-title::-webkit-details-marker {
  display: none;
}

:is(.sw-sidenav-link, .sw-sidenav-group-title):focus-visible {
  outline-offset: calc(-1 * var(--focus-width));
}

@media (forced-colors: active) {
  .sw-sidenav-link[aria-current]:not([aria-current="false"]) {
    border-inline-start-color: Highlight;
  }
}
```

Import it in `packages/css/src/index.css` after `pagination.css`:

```css
@import "./components/sidenav.css" layer(raster.components);
```

`Highlight` is a system colour; `overlay.css` already uses it under `forced-colors`, and the colour lint accepts it.

- [ ] **Step 4: Run the CSS tests to see them pass.**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 5: Write the failing React tests.** In `packages/react/test/navigation.test.tsx`, add `import { SideNav, SideNavGroup, SideNavLink } from "../src/navigation/SideNav";` and append:

```tsx
describe("SideNav", () => {
  function Docs() {
    return (
      <SideNav aria-label="Documentation">
        <SideNavLink href="/">Principles</SideNavLink>
        <SideNavGroup title="Foundations">
          <SideNavLink href="/grid">Grid</SideNavLink>
          <SideNavLink href="/type" current>
            Type
          </SideNavLink>
        </SideNavGroup>
        <SideNavGroup title="Components" defaultExpanded={false}>
          <SideNavLink href="/components">All components</SideNavLink>
        </SideNavGroup>
      </SideNav>
    );
  }

  it("is a named navigation landmark with a list of links", () => {
    render(<Docs />);
    const nav = screen.getByRole("navigation", { name: "Documentation" });
    expect(nav).toHaveClass("sw-sidenav");
    expect(nav.querySelector("ul")).toHaveClass("sw-sidenav-list");
    expect(screen.getByRole("link", { name: "Principles" })).toHaveClass("sw-sidenav-link");
  });

  it("marks the current page", () => {
    render(<Docs />);
    expect(screen.getByRole("link", { name: "Type" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Grid" })).not.toHaveAttribute("aria-current");
  });

  it("opens groups by default and toggles them", async () => {
    const user = userEvent.setup();
    render(<Docs />);
    const foundations = screen.getByRole("button", { name: "Foundations" });
    const components = screen.getByRole("button", { name: "Components" });
    expect(foundations).toHaveClass("sw-sidenav-group-title");
    expect(foundations).toHaveAttribute("aria-expanded", "true");
    expect(components).toHaveAttribute("aria-expanded", "false");
    await user.click(components);
    expect(screen.getByRole("link", { name: "All components" })).toBeVisible();
  });

  it("names the landmark Section by default", () => {
    render(
      <SideNav>
        <SideNavLink href="/">Home</SideNavLink>
      </SideNav>,
    );
    expect(screen.getByRole("navigation", { name: "Section" })).toBeInTheDocument();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Docs />);
    await expectAccessible(container);
  });
});
```

- [ ] **Step 6: Run them to see them fail.**

Run: `pnpm --filter @raster/react test -- navigation`
Expected: FAIL, cannot resolve `../src/navigation/SideNav`.

- [ ] **Step 7: Write the components.** Create `packages/react/src/navigation/SideNav.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel } from "react-aria-components";
import { cx } from "../utils/cx";

export type SideNavProps = ComponentPropsWithRef<"nav"> & {
  /** SideNavLink and SideNavGroup elements. */
  children: ReactNode;
};

/** Section navigation. Name the landmark with aria-label; it defaults to "Section". */
export function SideNav({ children, className, "aria-label": ariaLabel = "Section", ...rest }: SideNavProps) {
  return (
    <nav className={cx("sw-sidenav", className)} aria-label={ariaLabel} {...rest}>
      <ul className="sw-sidenav-list">{children}</ul>
    </nav>
  );
}

export type SideNavLinkProps = Omit<ComponentPropsWithRef<"a">, "aria-current"> & {
  href: string;
  /** Marks this link as the current page. */
  current?: boolean;
};

export function SideNavLink({ current = false, className, children, ...rest }: SideNavLinkProps) {
  return (
    <li>
      <a className={cx("sw-sidenav-link", className)} aria-current={current ? "page" : undefined} {...rest}>
        {children}
      </a>
    </li>
  );
}

export type SideNavGroupProps = {
  /** The group's label; also its toggle button's name. */
  title: ReactNode;
  children: ReactNode;
  /** Defaults to true. */
  defaultExpanded?: boolean;
  className?: string;
};

/** A collapsible group of links. Native twin: <details class="sw-sidenav-group" open>. */
export function SideNavGroup({ title, children, defaultExpanded = true, className }: SideNavGroupProps) {
  return (
    <li>
      <AriaDisclosure className={cx("sw-sidenav-group", className)} defaultExpanded={defaultExpanded}>
        <AriaButton slot="trigger" className="sw-sidenav-group-title">
          <span>{title}</span>
          <span className="sw-disclosure-icon" aria-hidden="true" />
        </AriaButton>
        <DisclosurePanel className="sw-sidenav-panel">
          <ul className="sw-sidenav-list">{children}</ul>
        </DisclosurePanel>
      </AriaDisclosure>
    </li>
  );
}
```

Export them in `packages/react/src/index.ts` after the Pagination export:

```ts
export {
  SideNav,
  SideNavGroup,
  type SideNavGroupProps,
  SideNavLink,
  type SideNavLinkProps,
  type SideNavProps,
} from "./navigation/SideNav";
```

Add `"SideNav", "SideNavGroup", "SideNavLink",` to the `expected` array in `packages/react/test/exports.test.ts`.

- [ ] **Step 8: Run the tests to see them pass.**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add packages/css packages/react
git commit -m "feat: SideNav with collapsible groups on both routes"
```

---
### Task 8: Docs support for native examples

**Files:**
- Create: `apps/docs/src/components/NativeExample.astro`
- Create: `apps/docs/e2e/examples.ts`
- Modify: `apps/docs/src/styles/docs.css`
- Modify: `apps/docs/e2e/components.spec.ts`

- [ ] **Step 1: Write the component.** Create `apps/docs/src/components/NativeExample.astro`:

```astro
---
import CodeBlock from "./CodeBlock.astro";

interface Props {
  /** Caption, unique on the page; it also names the code region. Convention: "<React title> without React". */
  title: string;
  /** The example's HTML, imported from a demo .html file with ?raw. Rendered as is and shown as code. */
  html: string;
}

const { title, html } = Astro.props;
const code = html.trim();
---
<figure class="docs-example" data-native>
  <figcaption class="docs-example-title sw-type-label sw-text-secondary">{title}</figcaption>
  <div class="docs-example-demo"><Fragment set:html={code} /></div>
  <div class="docs-example-code">
    <p class="sw-type-label sw-text-secondary">HTML</p>
    <CodeBlock code={code} label={`HTML code: ${title}`} />
  </div>
</figure>
```

- [ ] **Step 2: Add the narrow frame.** Append to `apps/docs/src/styles/docs.css`:

```css
/* Examples that need a narrow container, such as the compact header. */
.docs-frame-narrow {
  max-inline-size: 22.5rem;
  border: 1px solid var(--border);
}
```

- [ ] **Step 3: Add the example locator.** Create `apps/docs/e2e/examples.ts`:

```ts
import type { Locator, Page } from "@playwright/test";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The docs example figure whose caption is exactly `title`. */
export function example(page: Page, title: string): Locator {
  return page
    .locator("figure.docs-example")
    .filter({ has: page.locator("figcaption", { hasText: new RegExp(`^${escape(title)}$`) }) });
}

/** The rendered demo area of that example. */
export function demo(page: Page, title: string): Locator {
  return example(page, title).locator(".docs-example-demo");
}
```

- [ ] **Step 4: Let component pages hold HTML-only examples.** In `apps/docs/e2e/components.spec.ts`, replace:

```ts
      await expect(example.getByRole("region", { name: /^React code: / })).toBeVisible();
```

with:

```ts
      await expect(example.getByRole("region", { name: /^(React|HTML) code: / }).first()).toBeVisible();
```

and rename the test title from `has examples with code, props, accessibility notes and breadcrumbs` to `has examples with code (React, or HTML for native examples), props, accessibility notes and breadcrumbs`.

- [ ] **Step 5: Check the docs still typecheck and build.**

Run: `pnpm --filter @raster/docs typecheck && pnpm --filter @raster/docs build`
Expected: no type errors; `43 page(s) built`.

- [ ] **Step 6: Commit.**

```bash
git add apps/docs/src/components/NativeExample.astro apps/docs/e2e/examples.ts apps/docs/src/styles/docs.css apps/docs/e2e/components.spec.ts
git commit -m "docs: native HTML examples and an example locator for tests"
```

---

### Task 9: Docs pages for Disclosure, Popover and Drawer

**Files:**
- Create: `apps/docs/src/demos/disclosure/Faq.tsx`, `apps/docs/src/demos/disclosure/faq.html`
- Create: `apps/docs/src/demos/popover/GridUnits.tsx`, `apps/docs/src/demos/popover/grid-units.html`
- Create: `apps/docs/src/demos/drawer/ProjectDetails.tsx`, `apps/docs/src/demos/drawer/project-details.html`, `apps/docs/src/demos/drawer/Filters.tsx`
- Create: `apps/docs/src/content/components/disclosure.mdx`, `popover.mdx`, `drawer.mdx`

The React demo and its native twin must render identical text and structure: Task 13's parity tests compare them pixel for pixel.

- [ ] **Step 1: Disclosure demos.** Create `apps/docs/src/demos/disclosure/Faq.tsx`:

```tsx
import { Accordion, Disclosure } from "@raster/react";

export default function Faq() {
  return (
    <Accordion>
      <Disclosure id="cost" title="What does a project cost?">
        <p>Most identity projects start at CHF 40,000. We quote a fixed fee after the first meeting.</p>
      </Disclosure>
      <Disclosure id="time" title="How long does it take?">
        <p>Twelve to sixteen weeks from the first interview to the hand-over.</p>
      </Disclosure>
      <Disclosure id="after" title="What happens after launch?">
        <p>We stay on call for a year and review the system with your team after six months.</p>
      </Disclosure>
    </Accordion>
  );
}
```

Create `apps/docs/src/demos/disclosure/faq.html`:

```html
<div class="sw-accordion">
  <details class="sw-disclosure" name="faq">
    <summary class="sw-disclosure-trigger">
      <span class="sw-disclosure-title">What does a project cost?</span>
      <span class="sw-disclosure-icon" aria-hidden="true"></span>
    </summary>
    <div class="sw-disclosure-panel">
      <p>Most identity projects start at CHF 40,000. We quote a fixed fee after the first meeting.</p>
    </div>
  </details>
  <details class="sw-disclosure" name="faq">
    <summary class="sw-disclosure-trigger">
      <span class="sw-disclosure-title">How long does it take?</span>
      <span class="sw-disclosure-icon" aria-hidden="true"></span>
    </summary>
    <div class="sw-disclosure-panel">
      <p>Twelve to sixteen weeks from the first interview to the hand-over.</p>
    </div>
  </details>
  <details class="sw-disclosure" name="faq">
    <summary class="sw-disclosure-trigger">
      <span class="sw-disclosure-title">What happens after launch?</span>
      <span class="sw-disclosure-icon" aria-hidden="true"></span>
    </summary>
    <div class="sw-disclosure-panel">
      <p>We stay on call for a year and review the system with your team after six months.</p>
    </div>
  </details>
</div>
```

- [ ] **Step 2: Disclosure page.** Create `apps/docs/src/content/components/disclosure.mdx`:

```mdx
---
title: Disclosure
group: Overlay and navigation
order: 8
summary: Rows that show or hide their content; grouped, they make an accordion that opens one row at a time.
interactive: true
props:
  - name: title
    type: ReactNode
    description: Required. The row's label and the trigger's accessible name.
  - name: headingLevel
    type: 2 | 3 | 4 | 5 | 6
    default: "3"
    description: Level of the heading that wraps the trigger.
  - name: defaultExpanded / isExpanded / onExpandedChange
    type: boolean / boolean / (isExpanded) => void
    description: Starting state, or controlled state and its change handler.
  - name: id
    type: Key
    description: The row's key inside an Accordion.
  - name: Accordion allowsMultipleExpanded
    type: boolean
    default: "false"
    description: Lets several rows stay open; by default opening one closes the others.
a11y:
  - The trigger is a button with aria-expanded, wrapped in a heading so each row appears in the page outline.
  - Without React, details and summary give the same keyboard behaviour (Enter and Space toggle). The summary is the button, so put a heading above the group if the outline needs one.
  - A shared name attribute on the details elements makes a native group open one row at a time.
  - The plus and minus are drawn with borders, so they stay visible in forced-colours mode.
  - Native panels animate their height where the browser supports it; under reduced motion they open at once.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Faq from "../../demos/disclosure/Faq";
import faqSource from "../../demos/disclosure/Faq.tsx?raw";
import faqHtml from "../../demos/disclosure/faq.html?raw";

<Example title="Questions" source={faqSource}>
  <Faq client:load />
</Example>

<NativeExample title="Questions without React" html={faqHtml} />
```

- [ ] **Step 3: Popover demos.** Create `apps/docs/src/demos/popover/GridUnits.tsx`:

```tsx
import { Button, DialogTrigger, Link, Popover } from "@raster/react";

export default function GridUnits() {
  return (
    <DialogTrigger>
      <Button>Grid units</Button>
      <Popover title="Grid units">
        <p>One unit is 4px. Spacing runs in nine steps from 4 to 96px.</p>
        <Link href="/foundations/grid/">Read about the grid</Link>
      </Popover>
    </DialogTrigger>
  );
}
```

Create `apps/docs/src/demos/popover/grid-units.html`:

```html
<button type="button" class="sw-button" data-variant="secondary" popovertarget="grid-units" style="anchor-name: --grid-units">Grid units</button>
<div class="sw-popover sw-popover-content" id="grid-units" popover style="position-anchor: --grid-units">
  <div class="sw-popover-dialog" role="dialog" aria-labelledby="grid-units-title">
    <h3 class="sw-popover-title" id="grid-units-title">Grid units</h3>
    <p>One unit is 4px. Spacing runs in nine steps from 4 to 96px.</p>
    <a class="sw-link" href="/foundations/grid/">Read about the grid</a>
  </div>
</div>
```

- [ ] **Step 4: Popover page.** Create `apps/docs/src/content/components/popover.mdx`:

```mdx
---
title: Popover
group: Overlay and navigation
order: 9
summary: A small non-modal panel anchored to the button that opens it, for extra detail or a few controls.
interactive: true
props:
  - name: title
    type: ReactNode
    description: Visible title that also names the popover. Without one, pass aria-label.
  - name: aria-label
    type: string
    description: Names a popover that has no visible title.
  - name: children
    type: "ReactNode | ({ close }) => ReactNode"
    description: The content.
  - name: placement
    type: string
    default: '"bottom start"'
    description: Position relative to the trigger; it flips when there is no room.
a11y:
  - React route: focus moves into the popover when it opens and returns to the trigger on Escape or an outside click.
  - Without React, popovertarget gives the button aria-expanded; Tab moves from the button into the popover, and Escape or a click outside closes it.
  - The native popover is placed with CSS anchor positioning (anchor-name on the button, position-anchor on the panel). Browsers without it centre the panel instead.
  - Use a Dialog instead when the content needs a decision before the page can be used again.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import GridUnits from "../../demos/popover/GridUnits";
import gridUnitsSource from "../../demos/popover/GridUnits.tsx?raw";
import gridUnitsHtml from "../../demos/popover/grid-units.html?raw";

<Example title="Grid units" source={gridUnitsSource}>
  <GridUnits client:load />
</Example>

<NativeExample title="Grid units without React" html={gridUnitsHtml} />
```

- [ ] **Step 5: Drawer demos.** Create `apps/docs/src/demos/drawer/ProjectDetails.tsx`:

```tsx
import { Button, DialogTrigger, Drawer } from "@raster/react";

export default function ProjectDetails() {
  return (
    <DialogTrigger>
      <Button>Project details</Button>
      <Drawer title="Linie 7">
        <p>A sign family for fourteen stations, legible from a moving train and a wheelchair alike.</p>
        <p>Wayfinding and identity for a regional rail line, delivered in eleven months.</p>
      </Drawer>
    </DialogTrigger>
  );
}
```

Create `apps/docs/src/demos/drawer/project-details.html`:

```html
<button type="button" class="sw-button" data-variant="secondary" commandfor="project-drawer" command="show-modal">Project details</button>
<dialog class="sw-drawer" id="project-drawer" data-placement="end" aria-labelledby="project-drawer-title" closedby="any">
  <div class="sw-dialog sw-drawer-dialog">
    <div class="sw-drawer-head">
      <h2 class="sw-type-h3" id="project-drawer-title">Linie 7</h2>
      <button type="button" class="sw-button" data-variant="ghost" commandfor="project-drawer" command="close">Close</button>
    </div>
    <p>A sign family for fourteen stations, legible from a moving train and a wheelchair alike.</p>
    <p>Wayfinding and identity for a regional rail line, delivered in eleven months.</p>
  </div>
</dialog>
```

Create `apps/docs/src/demos/drawer/Filters.tsx`:

```tsx
import { Button, DialogTrigger, Drawer } from "@raster/react";

export default function Filters() {
  return (
    <DialogTrigger>
      <Button>Show filters</Button>
      <Drawer title="Filters" placement="bottom">
        {({ close }) => (
          <>
            <p>A sheet rises from the bottom edge, which suits phones and short sets of controls.</p>
            <Button variant="primary" onPress={close}>
              Apply
            </Button>
          </>
        )}
      </Drawer>
    </DialogTrigger>
  );
}
```

- [ ] **Step 6: Drawer page.** Create `apps/docs/src/content/components/drawer.mdx`:

```mdx
---
title: Drawer
group: Overlay and navigation
order: 10
summary: A modal panel docked to the inline end or the bottom edge, for details and filters beside the current page.
interactive: true
props:
  - name: title
    type: ReactNode
    description: Required. The heading that names the drawer.
  - name: children
    type: "ReactNode | ({ close }) => ReactNode"
    description: The content; the function form receives close.
  - name: placement
    type: '"end" | "bottom"'
    default: '"end"'
    description: The edge it docks to; "bottom" makes a sheet.
  - name: isDismissable
    type: boolean
    default: "true"
    description: Closes on a click outside the panel. Escape always closes.
  - name: isOpen / defaultOpen / onOpenChange
    type: boolean / boolean / (isOpen) => void
    description: Controlled or starting state, for opening without a DialogTrigger.
  - name: closeLabel
    type: string
    default: '"Close"'
    description: Text of the close button.
a11y:
  - A modal dialog named by its title. Focus moves inside, stays there, and returns to the trigger when the drawer closes.
  - Escape closes it on both routes. Without React, closedby="any" adds closing on an outside click where browsers support it.
  - The page behind is dimmed and inert while the drawer is open.
  - Under reduced motion the drawer appears without sliding.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Filters from "../../demos/drawer/Filters";
import filtersSource from "../../demos/drawer/Filters.tsx?raw";
import ProjectDetails from "../../demos/drawer/ProjectDetails";
import projectDetailsSource from "../../demos/drawer/ProjectDetails.tsx?raw";
import projectDetailsHtml from "../../demos/drawer/project-details.html?raw";

<Example title="Project details" source={projectDetailsSource}>
  <ProjectDetails client:load />
</Example>

<NativeExample title="Project details without React" html={projectDetailsHtml} />

<Example title="Bottom sheet" source={filtersSource}>
  <Filters client:load />
</Example>
```

- [ ] **Step 7: Build and run the page checks.**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(disclosure|popover|drawer)/"`
Expected: `46 page(s) built`; the structure, reflow, axe (four combinations) and component-page tests for the three pages PASS.

- [ ] **Step 8: Commit.**

```bash
git add apps/docs/src/demos/disclosure apps/docs/src/demos/popover apps/docs/src/demos/drawer apps/docs/src/content/components/disclosure.mdx apps/docs/src/content/components/popover.mdx apps/docs/src/content/components/drawer.mdx
git commit -m "docs: Disclosure, Popover and Drawer pages with native examples"
```

---

### Task 10: Docs pages for Pagination and SideNav, and the Header page's compact menu

**Files:**
- Create: `apps/docs/src/demos/pagination/Middle.tsx`, `apps/docs/src/demos/pagination/First.tsx`
- Create: `apps/docs/src/demos/side-nav/Docs.tsx`, `apps/docs/src/demos/side-nav/docs.html`
- Create: `apps/docs/src/demos/header/Compact.tsx`, `apps/docs/src/demos/header/compact.html`
- Create: `apps/docs/src/content/components/pagination.mdx`, `side-nav.mdx`
- Modify: `apps/docs/src/content/components/header.mdx`

- [ ] **Step 1: Pagination demos.** Create `apps/docs/src/demos/pagination/Middle.tsx`:

```tsx
import { Pagination } from "@raster/react";

export default function Middle() {
  return <Pagination aria-label="Example pagination" page={6} total={12} href={(page) => `?page=${page}`} />;
}
```

Create `apps/docs/src/demos/pagination/First.tsx`:

```tsx
import { Pagination } from "@raster/react";

export default function First() {
  return <Pagination aria-label="Example pagination, first page" page={1} total={4} href={(page) => `?page=${page}`} />;
}
```

- [ ] **Step 2: Pagination page.** Create `apps/docs/src/content/components/pagination.mdx`:

```mdx
---
title: Pagination
group: Overlay and navigation
order: 11
summary: Links between the pages of a long list, with distant ranges collapsed and the current page underlined.
props:
  - name: page
    type: number
    description: Required. The current page, counted from 1.
  - name: total
    type: number
    description: Required. The number of pages.
  - name: href
    type: (page) => string
    description: Required. The URL of a page.
  - name: siblings
    type: number
    default: "1"
    description: Pages shown either side of the current one; the first and last are always shown.
  - name: aria-label
    type: string
    default: '"Pagination"'
    description: Name of the navigation landmark; give each one on a page a different name.
  - name: previousLabel / nextLabel
    type: string
    default: '"Previous" / "Next"'
    description: Text of the step links. A step that does not exist is left out.
a11y:
  - A named navigation landmark. Page links are named "Page 6" and the current one has aria-current="page".
  - The current page is marked by weight and a 2px underline, not colour alone.
  - The ellipses are hidden from screen readers; every link is at least 44px square.
  - It is plain links, so the HTML below is the whole component.
---
import Example from "../../components/Example.astro";
import First from "../../demos/pagination/First";
import firstSource from "../../demos/pagination/First.tsx?raw";
import Middle from "../../demos/pagination/Middle";
import middleSource from "../../demos/pagination/Middle.tsx?raw";

<Example title="Page 6 of 12" source={middleSource} of={Middle}>
  <Middle />
</Example>

<Example title="First page" source={firstSource} of={First}>
  <First />
</Example>
```

- [ ] **Step 3: SideNav demos.** Create `apps/docs/src/demos/side-nav/Docs.tsx`:

```tsx
import { SideNav, SideNavGroup, SideNavLink } from "@raster/react";

export default function Docs() {
  return (
    <SideNav aria-label="Example section">
      <SideNavLink href="/">Principles</SideNavLink>
      <SideNavGroup title="Foundations">
        <SideNavLink href="/foundations/grid/">Grid</SideNavLink>
        <SideNavLink href="/foundations/type/" current>
          Type
        </SideNavLink>
        <SideNavLink href="/foundations/colour/">Colour</SideNavLink>
      </SideNavGroup>
      <SideNavGroup title="Components" defaultExpanded={false}>
        <SideNavLink href="/components/">All components</SideNavLink>
      </SideNavGroup>
    </SideNav>
  );
}
```

Create `apps/docs/src/demos/side-nav/docs.html`:

```html
<nav class="sw-sidenav" aria-label="Example section without React">
  <ul class="sw-sidenav-list">
    <li><a class="sw-sidenav-link" href="/">Principles</a></li>
    <li>
      <details class="sw-sidenav-group" open>
        <summary class="sw-sidenav-group-title">
          <span>Foundations</span>
          <span class="sw-disclosure-icon" aria-hidden="true"></span>
        </summary>
        <ul class="sw-sidenav-list">
          <li><a class="sw-sidenav-link" href="/foundations/grid/">Grid</a></li>
          <li><a class="sw-sidenav-link" href="/foundations/type/" aria-current="page">Type</a></li>
          <li><a class="sw-sidenav-link" href="/foundations/colour/">Colour</a></li>
        </ul>
      </details>
    </li>
    <li>
      <details class="sw-sidenav-group">
        <summary class="sw-sidenav-group-title">
          <span>Components</span>
          <span class="sw-disclosure-icon" aria-hidden="true"></span>
        </summary>
        <ul class="sw-sidenav-list">
          <li><a class="sw-sidenav-link" href="/components/">All components</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>
```

- [ ] **Step 4: SideNav page.** Create `apps/docs/src/content/components/side-nav.mdx`:

```mdx
---
title: SideNav
group: Overlay and navigation
order: 12
summary: Section navigation for documentation and app layouts, hung from a hairline with collapsible groups.
interactive: true
props:
  - name: aria-label
    type: string
    default: '"Section"'
    description: Name of the navigation landmark.
  - name: SideNavLink href / current
    type: string / boolean
    description: The link target; current marks it with aria-current="page".
  - name: SideNavGroup title
    type: ReactNode
    description: Required. The group's label and its toggle's name.
  - name: SideNavGroup defaultExpanded
    type: boolean
    default: "true"
    description: Whether the group starts open.
a11y:
  - A named navigation landmark of nested lists, so screen readers announce the structure and counts.
  - The current page has aria-current="page" and an accent bar with weight 500, never colour alone; in forced-colours mode the bar uses the system highlight.
  - Group toggles are buttons with aria-expanded on the React route and summary elements without React; Enter and Space toggle both.
---
import Example from "../../components/Example.astro";
import NativeExample from "../../components/NativeExample.astro";
import Docs from "../../demos/side-nav/Docs";
import docsSource from "../../demos/side-nav/Docs.tsx?raw";
import docsHtml from "../../demos/side-nav/docs.html?raw";

<Example title="Documentation sections" source={docsSource}>
  <Docs client:load />
</Example>

<NativeExample title="Documentation sections without React" html={docsHtml} />
```

- [ ] **Step 5: Header compact demos.** Create `apps/docs/src/demos/header/Compact.tsx`:

```tsx
import { Header, Link } from "@raster/react";

/** Shown in a 360px frame, so the header is compact at every screen width. */
export default function Compact() {
  return (
    <div className="docs-frame-narrow">
      <Header sticky={false} navLabel="Compact example" brand={<Link href="/">Studio</Link>}>
        <Link href="/components/header/" aria-current="page">
          Work
        </Link>
        <Link href="/templates/">Templates</Link>
        <Link href="/">About</Link>
      </Header>
    </div>
  );
}
```

Create `apps/docs/src/demos/header/compact.html`:

```html
<div class="docs-frame-narrow">
  <header class="sw-header" data-compact>
    <a class="sw-skip-link" href="#main">Skip to content</a>
    <div class="sw-header-inner">
      <div class="sw-header-brand"><a class="sw-link" href="/">Studio</a></div>
      <nav class="sw-header-nav" aria-label="Compact example without React">
        <a class="sw-link" href="/components/header/" aria-current="page">Work</a>
        <a class="sw-link" href="/templates/">Templates</a>
        <a class="sw-link" href="/">About</a>
      </nav>
      <button type="button" class="sw-button sw-header-menu-button" data-variant="ghost" commandfor="compact-menu" command="show-modal">Menu</button>
    </div>
    <dialog class="sw-header-menu" id="compact-menu" aria-label="Menu">
      <div class="sw-header-menu-dialog">
        <div class="sw-header-menu-bar">
          <span class="sw-type-label sw-text-secondary">Menu</span>
          <button type="button" class="sw-button" data-variant="ghost" commandfor="compact-menu" command="close">Close</button>
        </div>
        <nav class="sw-header-menu-nav" aria-label="Compact example without React">
          <a class="sw-link" href="/components/header/" aria-current="page">Work</a>
          <a class="sw-link" href="/templates/">Templates</a>
          <a class="sw-link" href="/">About</a>
        </nav>
      </div>
    </dialog>
  </header>
</div>
```

- [ ] **Step 6: Update the Header page.** In `apps/docs/src/content/components/header.mdx`:

1. Add `interactive: true` after the `summary:` line.
2. Add these entries at the end of the `props:` list:

```yaml
  - name: compact
    type: boolean
    default: "true"
    description: Below 600px of header width, moves the links into a full-screen menu opened by a Menu button.
  - name: menuLabel
    type: string
    default: '"Menu"'
    description: Text of the menu button and name of the menu dialog.
```

3. Add these entries at the end of the `a11y:` list:

```yaml
  - The compact menu is a modal dialog named "Menu". Focus moves inside, Escape closes it, and focus returns to the Menu button.
  - Menu links are numbered in mono as decoration; the numbers are left out of each link's accessible name.
  - Without React, the Menu button opens a native dialog with invoker commands (commandfor and command), so no script is needed in browsers from December 2025 on.
```

4. After the existing imports, add:

```mdx
import CodeBlock from "../../components/CodeBlock.astro";
import NativeExample from "../../components/NativeExample.astro";
import Compact from "../../demos/header/Compact";
import compactSource from "../../demos/header/Compact.tsx?raw";
import compactHtml from "../../demos/header/compact.html?raw";

export const invokerFallback = `// Invoker commands for browsers released before December 2025.
if (!("command" in HTMLButtonElement.prototype)) {
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button[commandfor]") : null;
    const target = button && document.getElementById(button.getAttribute("commandfor"));
    if (!(target instanceof HTMLDialogElement)) return;
    const command = button.getAttribute("command");
    if (command === "show-modal") target.showModal();
    else if (command === "close") target.close();
  });
}`;
```

5. At the end of the file, add:

```mdx
<Example title="Compact menu" source={compactSource}>
  <Compact client:load />
</Example>

<NativeExample title="Compact menu without React" html={compactHtml} />

To support browsers released before December 2025, add this script once per page:

<CodeBlock code={invokerFallback} label="Invoker commands fallback" />
```

- [ ] **Step 7: Build and run the page checks.**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium -g "/components/(pagination|side-nav|header)/"`
Expected: `48 page(s) built`; all tests for the three pages PASS.

- [ ] **Step 8: Commit.**

```bash
git add apps/docs/src/demos/pagination apps/docs/src/demos/side-nav apps/docs/src/demos/header apps/docs/src/content/components/pagination.mdx apps/docs/src/content/components/side-nav.mdx apps/docs/src/content/components/header.mdx
git commit -m "docs: Pagination and SideNav pages; the Header page shows the compact menu"
```

---

### Task 11: The docs site header in compact mode

**Files:**
- Modify: `apps/docs/src/components/SiteHeader.astro`
- Modify: `apps/docs/e2e/site.spec.ts`

- [ ] **Step 1: Write the failing test.** Append to `apps/docs/e2e/site.spec.ts`:

```ts
test("on a phone the header shows a Menu button instead of the links, and the menu lists them all", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/components/");
  const header = page.locator("body > .sw-header");
  await expect(header.getByRole("navigation", { name: "Main" })).toBeHidden();
  await header.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  const links = menu.getByRole("navigation", { name: "Main" }).getByRole("link");
  await expect(links).toHaveText(["Principles", "Foundations", "Components", "Templates", "Themes"]);
  await expect(menu.getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("on a wide screen the header shows the links and no Menu button", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.locator("body > .sw-header");
  await expect(header.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Menu" })).toBeHidden();
});
```

- [ ] **Step 2: Run it to see it fail.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/site.spec.ts -g "phone|wide screen"`
Expected: the phone test FAILS (the links are still visible).

- [ ] **Step 3: Rewrite the site header.** Replace `apps/docs/src/components/SiteHeader.astro` with:

```astro
---
import { ariaCurrent, NAV } from "../lib/nav";
const path = Astro.url.pathname;
---
<header class="sw-header" data-sticky data-compact>
  <a class="sw-skip-link" href="#main">Skip to content</a>
  <div class="sw-header-inner">
    <div class="sw-header-brand"><a class="docs-brand" href="/">Raster</a></div>
    <nav class="sw-header-nav" aria-label="Main">
      {NAV.map((item) => <a class="sw-link" href={item.href} aria-current={ariaCurrent(path, item)}>{item.label}</a>)}
    </nav>
    <div class="sw-header-actions">
      <button type="button" class="sw-button docs-toggle" data-variant="ghost" data-setting="grid" data-value="on" data-toggle aria-pressed="false">Grid</button>
    </div>
    <button type="button" class="sw-button sw-header-menu-button" data-variant="ghost" commandfor="site-menu" command="show-modal">Menu</button>
  </div>
  <dialog class="sw-header-menu" id="site-menu" aria-label="Menu">
    <div class="sw-header-menu-dialog">
      <div class="sw-header-menu-bar">
        <span class="sw-type-label sw-text-secondary">Menu</span>
        <button type="button" class="sw-button" data-variant="ghost" commandfor="site-menu" command="close">Close</button>
      </div>
      <nav class="sw-header-menu-nav" aria-label="Main">
        {NAV.map((item) => <a class="sw-link" href={item.href} aria-current={ariaCurrent(path, item)}>{item.label}</a>)}
      </nav>
    </div>
  </dialog>
</header>
```

- [ ] **Step 4: Run the tests to see them pass, plus the existing site tests.**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium e2e/site.spec.ts e2e/a11y.spec.ts`
Expected: all PASS, including the 320px reflow and the four axe combinations on every page.

- [ ] **Step 5: Commit.**

```bash
git add apps/docs/src/components/SiteHeader.astro apps/docs/e2e/site.spec.ts
git commit -m "docs: the site header uses compact mode, so phones get a menu instead of a scrolling row"
```

---

### Task 12: Keyboard walkthroughs on both routes

**Files:**
- Modify: `apps/docs/e2e/keyboard.spec.ts`

- [ ] **Step 1: Write the tests.** At the top of `apps/docs/e2e/keyboard.spec.ts`, add `import { example } from "./examples";`. Append:

```ts
/** True when focus sits outside every open dialog (focus on <body> counts as inside). */
const focusEscapedDialog = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return false;
    const open = [...document.querySelectorAll("dialog[open], [role=dialog]")];
    return !open.some((d) => d.contains(active));
  });

test("compact menu, native (docs header at 360px): opens, holds focus, Escape returns it", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const menuButton = page.locator("body > .sw-header").getByRole("button", { name: "Menu" });
  await tabTo(page, menuButton);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await focusEscapedDialog(page)).toBe(false);
  }
  await expectNoViolations(page, "dialog.sw-header-menu[open]");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("compact menu, React: opens, holds focus, Escape returns it", async ({ page }) => {
  await page.goto("/components/header/");
  await waitForIslands(page);
  const menuButton = example(page, "Compact menu").getByRole("button", { name: "Menu" });
  await tabTo(page, menuButton);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await expect.poll(() => menu.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await focusEscapedDialog(page)).toBe(false);
  }
  await expectNoViolations(page, ".sw-header-menu-overlay");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(menuButton).toBeFocused();
});

test("disclosure, React: Enter and Space toggle; the accordion keeps one row open", async ({ page }) => {
  await page.goto("/components/disclosure/");
  await waitForIslands(page);
  const faq = example(page, "Questions");
  const cost = faq.getByRole("button", { name: "What does a project cost?" });
  const time = faq.getByRole("button", { name: "How long does it take?" });
  await tabTo(page, cost);
  await page.keyboard.press("Enter");
  await expect(cost).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(time).toBeFocused();
  await page.keyboard.press("Space");
  await expect(time).toHaveAttribute("aria-expanded", "true");
  await expect(cost).toHaveAttribute("aria-expanded", "false");
});

test("disclosure, native: Enter and Space toggle; a shared name keeps one row open", async ({ page }) => {
  await page.goto("/components/disclosure/");
  const faq = example(page, "Questions without React");
  const rows = faq.locator("details");
  const first = faq.locator("summary").nth(0);
  await tabTo(page, first);
  await page.keyboard.press("Enter");
  await expect(rows.nth(0)).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(rows.nth(1)).toHaveAttribute("open", "");
  await expect(faq.locator("details[open]")).toHaveCount(1);
});

test("popover, React: focus moves in, Escape returns it to the trigger", async ({ page }) => {
  await page.goto("/components/popover/");
  await waitForIslands(page);
  const trigger = example(page, "Grid units").getByRole("button", { name: "Grid units" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Grid units" });
  await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await expectNoViolations(page, ".sw-popover-content:not(#grid-units)");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("popover, native: Tab moves from the button into the popover, Escape returns focus", async ({ page }) => {
  await page.goto("/components/popover/");
  const trigger = example(page, "Grid units without React").getByRole("button", { name: "Grid units" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const popover = page.locator("#grid-units");
  await expect(popover).toBeVisible();
  // popovertarget exposes the expanded state in the accessibility tree, not as a DOM attribute.
  await expect(example(page, "Grid units without React").getByRole("button", { name: "Grid units", expanded: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(popover.getByRole("link", { name: "Read about the grid" })).toBeFocused();
  await expectNoViolations(page, "#grid-units");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const route of ["React", "native"] as const) {
  test(`drawer, ${route}: opens as a modal, holds focus, Escape returns it`, async ({ page }) => {
    await page.goto("/components/drawer/");
    await waitForIslands(page);
    const title = route === "React" ? "Project details" : "Project details without React";
    const trigger = example(page, title).getByRole("button", { name: "Project details" });
    await tabTo(page, trigger);
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Linie 7" });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      expect(await focusEscapedDialog(page)).toBe(false);
    }
    await expectNoViolations(page, route === "React" ? ".sw-drawer-overlay" : "dialog.sw-drawer[open]");
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

for (const route of ["React", "native"] as const) {
  test(`side nav, ${route}: a group toggles from the keyboard`, async ({ page }) => {
    await page.goto("/components/side-nav/");
    await waitForIslands(page);
    const nav = example(page, route === "React" ? "Documentation sections" : "Documentation sections without React");
    const toggle = route === "React" ? nav.getByRole("button", { name: "Components" }) : nav.locator("summary", { hasText: "Components" });
    await tabTo(page, toggle);
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("link", { name: "All components" })).toBeVisible();
  });
}
```

- [ ] **Step 2: Run them.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/keyboard.spec.ts`
Expected: all PASS (the five existing walkthroughs and the twelve new ones). If a native walkthrough fails because headless Chromium moves focus out of a modal dialog into browser UI, `focusEscapedDialog` already treats `<body>` as inside; check the failure's `activeElement` before changing anything else.

- [ ] **Step 3: Commit.**

```bash
git add apps/docs/e2e/keyboard.spec.ts
git commit -m "test(docs): keyboard walkthroughs for the compact menu, disclosure, popover, drawer and side nav on both routes"
```

---

### Task 13: Parity tests between the two routes

**Files:**
- Create: `apps/docs/e2e/parity.ts`
- Create: `apps/docs/e2e/parity.spec.ts`

- [ ] **Step 1: Write the helper.** Create `apps/docs/e2e/parity.ts`:

```ts
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Screenshots the React rendering and its native twin against one shared baseline, so the test
 * fails when the two routes differ by more than the visual tolerance. Focus and hover are cleared
 * first: a native dialog focuses its first control on open, while React Aria focuses the dialog.
 */
export async function expectSameRendering(page: Page, name: string, react: Locator, native: Locator): Promise<void> {
  await expectParityBaseline(page, name, react);
  await expectParityBaseline(page, name, native);
}

/** One side of a pair, for overlays that cannot be open at the same time as their twin. */
export async function expectParityBaseline(page: Page, name: string, target: Locator): Promise<void> {
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await expect(target).toHaveScreenshot(`parity-${name}.png`);
}
```

- [ ] **Step 2: Write the checks.** Create `apps/docs/e2e/parity.spec.ts`:

```ts
import { test } from "@playwright/test";
import { demo } from "./examples";
import { waitForIslands } from "./islands";
import { expectParityBaseline, expectSameRendering } from "./parity";
import { useSettings } from "./settings";

const COMBOS = [
  { theme: "alpine", mode: "light" },
  { theme: "zurich", mode: "dark" },
] as const;

for (const combo of COMBOS) {
  const variant = `${combo.theme}-${combo.mode}`;

  test.describe(variant, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await useSettings(page, { ...combo, motion: "reduce" });
    });

    async function open(page: import("@playwright/test").Page, path: string) {
      await page.goto(path);
      await waitForIslands(page);
      await page.evaluate(() => document.fonts.ready);
    }

    test("disclosure renders alike, closed and with a row open", async ({ page }) => {
      await open(page, "/components/disclosure/");
      const react = demo(page, "Questions");
      const native = demo(page, "Questions without React");
      await expectSameRendering(page, `disclosure-closed-${variant}`, react, native);
      await react.getByRole("button", { name: "How long does it take?" }).click();
      await native.locator("summary", { hasText: "How long does it take?" }).click();
      await expectSameRendering(page, `disclosure-open-${variant}`, react, native);
    });

    test("popover renders alike when open", async ({ page }) => {
      await open(page, "/components/popover/");
      await demo(page, "Grid units").getByRole("button", { name: "Grid units" }).click();
      const react = page.locator(".sw-popover-content:not(#grid-units)");
      await react.waitFor();
      await test.step("React", () => expectParityBaseline(page, `popover-${variant}`, react));
      await page.keyboard.press("Escape");
      await demo(page, "Grid units without React").getByRole("button", { name: "Grid units" }).click();
      const native = page.locator("#grid-units");
      await test.step("native", () => expectParityBaseline(page, `popover-${variant}`, native));
    });

    test("drawer renders alike when open", async ({ page }) => {
      await open(page, "/components/drawer/");
      await demo(page, "Project details").getByRole("button", { name: "Project details" }).click();
      const react = page.locator(".sw-drawer-overlay .sw-drawer");
      await react.waitFor();
      await test.step("React", () => expectParityBaseline(page, `drawer-${variant}`, react));
      await page.keyboard.press("Escape");
      await react.waitFor({ state: "detached" });
      await demo(page, "Project details without React").getByRole("button", { name: "Project details" }).click();
      const native = page.locator("dialog.sw-drawer[open]");
      await test.step("native", () => expectParityBaseline(page, `drawer-${variant}`, native));
    });

    test("compact header renders alike, closed and with the menu open", async ({ page }) => {
      await open(page, "/components/header/");
      await expectSameRendering(page, `header-compact-${variant}`, demo(page, "Compact menu"), demo(page, "Compact menu without React"));
      await demo(page, "Compact menu").getByRole("button", { name: "Menu" }).click();
      const react = page.locator(".sw-header-menu-overlay .sw-header-menu");
      await react.waitFor();
      await test.step("React", () => expectParityBaseline(page, `header-menu-${variant}`, react));
      await page.keyboard.press("Escape");
      await react.waitFor({ state: "detached" });
      await demo(page, "Compact menu without React").getByRole("button", { name: "Menu" }).click();
      const native = page.locator("#compact-menu");
      await test.step("native", () => expectParityBaseline(page, `header-menu-${variant}`, native));
    });

    test("side nav renders alike", async ({ page }) => {
      await open(page, "/components/side-nav/");
      await expectSameRendering(
        page,
        `sidenav-${variant}`,
        demo(page, "Documentation sections"),
        demo(page, "Documentation sections without React"),
      );
    });
  });
}
```

The overlay tests cannot show both routes at once (each is modal or light-dismissing), so each route is screenshotted in its own step against the same baseline name: the React step writes or checks the baseline, and the native step must match it.

- [ ] **Step 3: Generate the baselines, then check them without updating.**

Run: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/parity.spec.ts --update-snapshots`
Then: `pnpm --filter @raster/docs exec playwright test --project=chromium e2e/parity.spec.ts`
Expected: the second run PASSES with no snapshot written: the React and native renderings match the same images.

If a pair differs, open `apps/docs/test-results/*/parity-*-diff.png` and fix the difference in markup or CSS (a missing class, a stray wrapper, a heading margin). Do not loosen the tolerance for these six components: none of them uses a browser-drawn control that could legitimately differ.

- [ ] **Step 4: Look at four baselines.** Open `apps/docs/e2e/__screenshots__/parity-header-menu-alpine-light-darwin.png`, `parity-drawer-zurich-dark-darwin.png`, `parity-disclosure-open-alpine-light-darwin.png` and `parity-popover-alpine-light-darwin.png` and confirm each shows the intended component: numbered menu rows with a signal bar on Work; a docked panel with its title and Close; the second row open with a minus; the popover title, text and link.

- [ ] **Step 5: Commit.**

```bash
git add apps/docs/e2e/parity.ts apps/docs/e2e/parity.spec.ts apps/docs/e2e/__screenshots__/parity-*
git commit -m "test(docs): parity screenshots prove native and React routes render alike"
```

---

### Task 14: Visual baselines

**Files:**
- Modify: `apps/docs/e2e/__screenshots__/` (new and regenerated images)

- [ ] **Step 1: Generate baselines for new and changed examples and templates.** The new pages are new; the Header page has two new examples; the docs header is now compact at 360px, which changes every full-page template screenshot at that width.

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=visual -g "examples on (disclosure|popover|drawer|header|pagination|side-nav)|template " --update-snapshots`
Expected: PASS, writing the new and changed images.

- [ ] **Step 2: Check the whole visual suite is stable.**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual`
Expected: PASS with no differences.

- [ ] **Step 3: Review the changes by eye.** Run `git status --short apps/docs/e2e/__screenshots__ | wc -l` and `du -ch apps/docs/e2e/__screenshots__/*-darwin.png | tail -1` and note both. Open `template-article-alpine-light-360-darwin.png` (the header now shows Raster, Grid and Menu and no scrolling link row) and `disclosure-1-zurich-dark-1440-darwin.png`.

- [ ] **Step 4: Commit.**

```bash
git add apps/docs/e2e/__screenshots__
git commit -m "test(docs): visual baselines for the new components and the compact docs header"
```

---

### Task 15: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Record what the build settled.** In the spec's section 4, replace the Disclosure motion bullet with:

```markdown
- Disclosure animates its height over `dur-base` on the native route where `interpolate-size` and `::details-content` are supported. React Aria hides a closed panel with the `hidden` attribute, so the React route opens instantly.
```

In section 9, replace the three open questions with:

```markdown
- **Invoker commands:** Baseline since Safari 26.2 (December 2025). The docs publish a 12-line fallback for older browsers; Raster ships no script.
- **Anchor positioning:** Baseline since Firefox 147 (January 2026). Native popovers are anchored inside `@supports (position-anchor: --a)`; elsewhere the browser centres them.
- **Parity tolerance:** the default `maxDiffPixelRatio` of 0.001 holds for every Plan 7a component; no exceptions were needed.
```

- [ ] **Step 2: Run everything.**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and both apps' browser tests PASS. Note the counts (unit tests per package, docs and studio browser tests) for the hand-off.

- [ ] **Step 3: Check the docs header in a browser at 360px.** Start the docs preview (`pnpm --filter @raster/docs exec astro preview --port 4389 --ignore-lock`), open http://localhost:4389/components/ at a 360px width, press Menu, and confirm the numbered full-screen menu with a signal bar on Components; then switch to Zürich dark from the footer and check again.

- [ ] **Step 4: Commit.**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 7a's motion and browser-support outcomes"
```

---

## Self-review notes

- **Spec coverage:** section 3 rows 1–6 → Tasks 1–7; section 6 (docs, native examples, compact docs header) → Tasks 8–11; section 7 (unit tests, keyboard walkthroughs, parity, visual baselines) → Tasks 1–7 and 12–14; success criterion 4 → Task 11. Plans 7b and 7c cover rows 7–21.
- **Names used across tasks:** `sw-disclosure`, `sw-disclosure-trigger`, `sw-disclosure-icon`, `sw-accordion`, `sw-popover-content`, `sw-popover-dialog`, `sw-popover-title`, `sw-drawer`, `sw-drawer-overlay`, `sw-drawer-dialog`, `sw-drawer-head`, `sw-header-menu-button`, `sw-header-menu`, `sw-header-menu-overlay`, `sw-header-menu-dialog`, `sw-header-menu-bar`, `sw-header-menu-nav`, `sw-pagination`, `sw-pagination-list`, `sw-pagination-link`, `sw-pagination-step`, `sw-pagination-ellipsis`, `sw-sidenav`, `sw-sidenav-list`, `sw-sidenav-link`, `sw-sidenav-group`, `sw-sidenav-group-title`, `sw-sidenav-panel`; React exports `Disclosure`, `Accordion`, `Popover`, `Drawer`, `Pagination`, `paginationItems`, `SideNav`, `SideNavLink`, `SideNavGroup`; Header props `compact`, `menuLabel`.
- **Page count:** 43 docs pages before; +5 (disclosure, popover, drawer, pagination, side-nav) = 48.
