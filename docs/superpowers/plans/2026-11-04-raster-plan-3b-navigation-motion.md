# Raster Plan 3b: Navigation and Expressive Motion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- **Navigation set:** Tabs, Breadcrumbs, and Header with a skip link.
- **Link on React Aria:** this settles spec §11, "Link and React Aria". Breadcrumbs need it for current-page state.
- **Expressive motion tier:** an opt-in `motion.css` (scroll-driven column reveals, cross-document view transitions, variable-weight shift) plus a `<Reveal>` component.

**Architecture:**
- **Behaviour:** navigation components use React Aria Components (RAC) 1.22.1.
- **Link:** now wraps RAC `Link`, so RAC's `LinkContext` reaches it, giving Breadcrumbs `aria-current="page"` on the current item.
- **Header:** plain semantic HTML (`header`, `nav`, skip link). It is sticky by default, sits at `--z-sticky`, and sets `scroll-padding` so focused content is never hidden under it (WCAG 2.4.11).
- **Expressive motion:** lives in a separate stylesheet, `@raster/css/motion.css`, built alongside `raster.css`, so sites opt in by loading it. Everything in it is progressive enhancement:
  - **Reveals:** only run where `animation-timeline: view()` is supported.
  - **Reduced motion:** reveals and view transitions are switched off under `prefers-reduced-motion` or `[data-motion="reduce"]`.
  - **Fill:** reveals use `backwards` fill only, so nothing keeps a transform after the animation (see the Plan 3a review).

**Tech Stack:** react-aria-components 1.22.1, Lightning CSS 1.33, plus the existing stack.

**Spec:**
- **§6:** navigation (Tabs, Header with skip link, Breadcrumbs).
- **§7:** the expressive tier: column-staggered scroll reveals, page transitions, Geist weight shift, and reduced motion.
- **§8:** the skip link, focus never obscured (2.4.11), keyboard support and RTL.
- **§11:** Link and React Aria.

**Builds on Plans 1–3a (merged):**
- **Tokens:** `packages/tokens/src/foundation.ts` holds `--z-sticky` (10), `--z-modal` and `--z-toast`, plus `rem()`.
- **CSS build:** `packages/css/build.mjs` exports `buildCss()` and writes `dist/raster.css` and `dist/raster.min.css`. It prepends the canonical `@layer` order.
- **Link:** a native `<a>` with an `external` prop that adds an arrow and announces that it opens in a new tab.
- **Line-height caveat:** base styles give `p`, `li` and headings a font size of `var(--_size)` and an absolute rounded line-height. A component that wants a different text size on `li` children must set `--_size` / `--_leading` on the parent rather than `font-size`.
- **Tests:**
  - **CSS:** `packages/css/test/components.test.ts` has `rule(selector)` (the **first** rule whose selector text ends with the argument; beware of grouped and earlier rules) and `css`.
  - **React:** tests use Vitest, jsdom, user-event and `expectAccessible`. `waitFor` is fine for RAC's asynchronous focus. RAC may call callbacks with extra arguments.

**Lightning CSS behaviour, checked against 1.33.0:**
- **Formatting:** it may drop attribute quotes, reorder declarations, and lowercase system colours.
- **Rewrites:** `transparent` becomes `#0000`, `0ms` becomes `0s`, `::before` becomes `:before`, and `:nth-child(even)` becomes `2n`.
- **Animation timeline:** it **merges `animation-timeline` into the `animation` shorthand**, producing `animation: … view()`, which browsers reject. The workaround, verified: set the timeline through a custom property, `--_reveal-timeline: view(); animation-timeline: var(--_reveal-timeline);`. Lightning then keeps it as a separate longhand after the shorthand.
- **`animation-range`:** `entry 0%` is shortened to `entry`. This is equivalent.
- **`@view-transition`:** passed through unchanged.

**React Aria API notes, checked against 1.22.1:**
- **Link:** `Link` takes `LinkDOMProps` (`href`, `target`, `rel`) and `onPress`, omits `onClick`, and has `isCurrent` / `isDisabled` render props. It renders `<a>` when it has an `href`.
- **Breadcrumbs:** `Breadcrumbs` renders an `<ol>` and takes `onAction` and `isDisabled`. `Breadcrumb` renders an `<li>`, with `{ isCurrent, isDisabled }` render props. RAC passes `aria-current` and `isDisabled` to a `Link` inside the current `Breadcrumb` through `LinkContext`.
- **Tabs:** `Tabs` (with `orientation`, `selectedKey` and `onSelectionChange`), `TabList`, `Tab` (with `id` and `isDisabled`, omitting `onClick`) and `TabPanel` (with `id`). They emit `data-selected`, `data-focus-visible`, `data-disabled` and `data-orientation`.

## Plan series

1. Tokens and CSS foundations (done).
2. React package and static components (done).
3. Forms on React Aria (done).
4. Overlays (done).
5. **Plan 3b (this plan):** navigation and expressive motion.
6. **Plan 4:** the docs site and the Playwright gates.

---

## File structure

```
packages/tokens/src/foundation.ts                 + --header-height
packages/css/src/components/link.css              + current and disabled states
packages/css/src/components/breadcrumbs.css
packages/css/src/components/tabs.css
packages/css/src/components/header.css
packages/css/src/motion.css                        expressive tier (separate output)
packages/css/build.mjs                             + buildMotionCss(), dist/motion.css
packages/css/package.json                          + "./motion.css" export
packages/css/test/components.test.ts               + link, breadcrumbs, tabs, header tests
packages/css/test/motion.test.ts                   new

packages/react/src/actions/Link.tsx                now wraps RAC Link
packages/react/src/navigation/Breadcrumbs.tsx      Breadcrumbs, Breadcrumb
packages/react/src/navigation/Tabs.tsx             Tabs, TabList, Tab, TabPanel
packages/react/src/navigation/Header.tsx           Header (skip link, brand, nav, actions)
packages/react/src/motion/Reveal.tsx
packages/react/test/navigation.test.tsx            new
packages/react/src/index.ts, test/exports.test.ts
packages/css/playground/index.html                 + motion.css link, "08 / Navigation", "09 / Motion"
```

---

### Task 1: Link on React Aria

**Files:**
- Modify: `packages/react/src/actions/Link.tsx`, `packages/react/test/actions.test.tsx`
- Modify: `packages/css/src/components/link.css`, `packages/css/test/components.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the `describe("Link", …)` block in `packages/react/test/actions.test.tsx`:

```tsx
  it("supports onPress and reports disabled links", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <>
        <Link href="/a" onPress={onPress}>
          Pressable
        </Link>
        <Link href="/b" isDisabled>
          Disabled
        </Link>
      </>,
    );
    await user.click(screen.getByText("Pressable"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Disabled").closest(".sw-link")).toHaveAttribute("data-disabled");
  });
```

Append to `packages/css/test/components.test.ts`:

```ts
describe("link states", () => {
  it("marks the current page with weight and a thick underline", () => {
    const r = rule('.sw-link[aria-current="page"]');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mutes disabled links", () => {
    expect(rule(".sw-link[data-disabled]")).toMatch(/color:\s*var\(--text-muted\)/);
  });
});
```

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/css test`
Expected: FAIL. `onPress` and `isDisabled` are unknown on a native `<a>`, and the CSS rules are missing.

- [ ] **Step 2: Rewrite Link**

`packages/react/src/actions/Link.tsx`:

```tsx
import { ArrowUpRight } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type LinkProps = Omit<AriaLinkProps, "className" | "children"> &
  RefAttributes<HTMLAnchorElement> & {
    className?: string;
    children?: ReactNode;
    /** Open in a new tab, show an arrow, and announce it to screen readers. */
    external?: boolean;
  };

/** React Aria link: `onPress` (not onClick), `isDisabled`; gets aria-current inside Breadcrumbs. */
export function Link({ external, className, children, target, rel, ...rest }: LinkProps) {
  return (
    <AriaLink
      className={cx("sw-link", className)}
      target={external ? "_blank" : target}
      rel={external ? cx("noopener noreferrer", rel) : rel}
      {...rest}
    >
      {children}
      {external && (
        <>
          <ArrowUpRight aria-hidden="true" strokeWidth={1.5} />
          <span className="sw-sr-only"> (opens in a new tab)</span>
        </>
      )}
    </AriaLink>
  );
}
```

- [ ] **Step 3: Add the link states**

Append to `packages/css/src/components/link.css`:

```css
.sw-link[aria-current="page"] {
  font-weight: 500;
  text-decoration-thickness: 2px;
}

.sw-link[data-disabled] {
  color: var(--text-muted);
  text-decoration-line: none;
  cursor: not-allowed;
}
```

- [ ] **Step 4: Run everything**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint && pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS. The earlier Link tests (plain link, external announcement, `rel` merge, axe) keep passing unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css
git commit -m "feat!: Link wraps React Aria Link (onPress, isDisabled, current state)"
```

---

### Task 2: Breadcrumbs

**Files:**
- Create: `packages/css/src/components/breadcrumbs.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/navigation/Breadcrumbs.tsx`
- Test: `packages/react/test/navigation.test.tsx`

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("breadcrumbs", () => {
  it("sets the trail in caption size through the type variables, so li children follow", () => {
    const r = rule(".sw-breadcrumbs");
    expect(r).toMatch(/--_size:\s*var\(--text-caption-size\)/);
    expect(r).toMatch(/list-style:\s*none/);
    expect(r).toMatch(/flex-wrap:\s*wrap/);
  });

  it("mutes the separator and sets it in mono", () => {
    const r = rule(".sw-breadcrumb-separator");
    expect(r).toMatch(/color:\s*var\(--text-muted\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("shows the current page as plain primary text", () => {
    const r = rule('.sw-breadcrumb .sw-link[aria-current="page"]');
    expect(r).toMatch(/color:\s*var\(--text-primary\)/);
    expect(r).toMatch(/text-decoration-line:\s*none/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/breadcrumbs.css`:

```css
/* Caption size via the type variables so the base li rule follows (see the line-height caveat). */
.sw-breadcrumbs {
  --_size: var(--text-caption-size);
  --_leading: var(--text-caption-leading);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sw-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.sw-breadcrumb-separator {
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.sw-breadcrumb .sw-link[aria-current="page"] {
  color: var(--text-primary);
  text-decoration-line: none;
  cursor: default;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/breadcrumbs.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

`packages/react/test/navigation.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb, Breadcrumbs } from "../src/navigation/Breadcrumbs";
import { expectAccessible } from "./axe";

describe("Breadcrumbs", () => {
  function Trail() {
    return (
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/components">Components</Breadcrumb>
        <Breadcrumb>Button</Breadcrumb>
      </Breadcrumbs>
    );
  }

  it("is a named navigation landmark holding an ordered list", () => {
    render(<Trail />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumbs" });
    const list = nav.querySelector("ol");
    expect(list).toHaveClass("sw-breadcrumbs");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the last item as the current page and draws separators only between items", () => {
    const { container } = render(<Trail />);
    expect(screen.getByText("Button").closest("[aria-current]")).toHaveAttribute("aria-current", "page");
    const seps = container.querySelectorAll(".sw-breadcrumb-separator");
    expect(seps).toHaveLength(2);
    for (const s of seps) expect(s).toHaveAttribute("aria-hidden", "true");
  });

  it("links earlier items", () => {
    render(<Trail />);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("href", "/components");
  });

  it("accepts a custom landmark label", () => {
    render(
      <Breadcrumbs aria-label="You are here">
        <Breadcrumb>Only</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });

  it("has no structural violations", async () => {
    const { container } = render(<Trail />);
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the component**

`packages/react/src/navigation/Breadcrumbs.tsx`:

```tsx
import type { ReactNode } from "react";
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
  type Key,
} from "react-aria-components";
import { Link } from "../actions/Link";
import { cx } from "../utils/cx";

export type BreadcrumbsProps = Omit<AriaBreadcrumbsProps<object>, "className" | "children" | "aria-label"> & {
  className?: string;
  children: ReactNode;
  /** Landmark name. Defaults to "Breadcrumbs". */
  "aria-label"?: string;
};

/** A trail of links to the current page, inside a named navigation landmark. */
export function Breadcrumbs({ className, children, "aria-label": label = "Breadcrumbs", ...rest }: BreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <AriaBreadcrumbs className={cx("sw-breadcrumbs", className)} {...rest}>
        {children}
      </AriaBreadcrumbs>
    </nav>
  );
}

export type BreadcrumbProps = {
  /** Omit for the current page (normally the last item). */
  href?: string;
  children: ReactNode;
  className?: string;
  id?: Key;
};

export function Breadcrumb({ href, children, className, id }: BreadcrumbProps) {
  return (
    <AriaBreadcrumb id={id} className={cx("sw-breadcrumb", className)}>
      {({ isCurrent }) => (
        <>
          <Link href={href}>{children}</Link>
          {!isCurrent && (
            <span className="sw-breadcrumb-separator" aria-hidden="true">
              /
            </span>
          )}
        </>
      )}
    </AriaBreadcrumb>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

If `aria-current` lands on a different element than the one `closest("[aria-current]")` finds from the text, adjust only the query to the element RAC marks (for example the `li` or the link), keep the `"page"` assertion, and report it.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Breadcrumbs on React Aria"
```

---

### Task 3: Tabs

**Files:**
- Create: `packages/css/src/components/tabs.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/navigation/Tabs.tsx`
- Test: `packages/react/test/navigation.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("tabs", () => {
  it("underlines the list with a hairline and gives tabs a 44px target", () => {
    expect(rule(".sw-tab-list")).toMatch(/border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-tab")).toMatch(/min-block-size:\s*var\(--target-min\)/);
  });

  it("marks the selected tab with an accent underline and weight, not colour alone", () => {
    const r = rule(".sw-tab[data-selected]");
    expect(r).toMatch(/border-block-end-color:\s*var\(--accent\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("moves the indicator to the inline end in vertical tabs", () => {
    expect(rule('.sw-tab-list[data-orientation="vertical"] .sw-tab[data-selected]')).toMatch(
      /border-inline-end-color:\s*var\(--accent\)/,
    );
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/tabs.css`:

```css
.sw-tabs {
  display: grid;
  gap: var(--space-5);
}

.sw-tabs[data-orientation="vertical"] {
  grid-template-columns: auto minmax(0, 1fr);
}

.sw-tab-list {
  display: flex;
  gap: var(--space-5);
  overflow-x: auto;
  border-block-end: 1px solid var(--border);
}

.sw-tab-list[data-orientation="vertical"] {
  flex-direction: column;
  gap: 0;
  border-block-end: 0;
  border-inline-end: 1px solid var(--border);
}

.sw-tab {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--target-min);
  margin-block-end: -1px;
  border-block-end: 2px solid transparent;
  color: var(--text-secondary);
  font-size: var(--text-body-size);
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  transition-property: color, border-color;
  transition-duration: var(--dur-fast);
  transition-timing-function: var(--ease-standard);
}

@media (hover: hover) {
  .sw-tab:hover:not([data-selected], [data-disabled]) {
    color: var(--text-primary);
  }
}

.sw-tab[data-selected] {
  border-block-end-color: var(--accent);
  color: var(--text-primary);
  font-weight: 500;
}

.sw-tab[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-tab[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-tab-list[data-orientation="vertical"] .sw-tab {
  margin-block-end: 0;
  margin-inline-end: -1px;
  padding-inline-end: var(--space-4);
  border-block-end: 0;
  border-inline-end: 2px solid transparent;
}

.sw-tab-list[data-orientation="vertical"] .sw-tab[data-selected] {
  border-inline-end-color: var(--accent);
}

.sw-tab-panel {
  outline: none;
}

.sw-tab-panel[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/tabs.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/navigation.test.tsx` (add `import { Tab, TabList, TabPanel, Tabs } from "../src/navigation/Tabs";`):

```tsx
describe("Tabs", () => {
  function Example({ onSelectionChange }: { onSelectionChange?: (key: unknown) => void }) {
    return (
      <Tabs onSelectionChange={onSelectionChange}>
        <TabList aria-label="Foundations">
          <Tab id="grid">Grid</Tab>
          <Tab id="type">Type</Tab>
          <Tab id="colour" isDisabled>
            Colour
          </Tab>
        </TabList>
        <TabPanel id="grid">Grid panel</TabPanel>
        <TabPanel id="type">Type panel</TabPanel>
        <TabPanel id="colour">Colour panel</TabPanel>
      </Tabs>
    );
  }

  it("renders a named tablist with the first tab selected", () => {
    render(<Example />);
    expect(screen.getByRole("tablist", { name: "Foundations" })).toHaveClass("sw-tab-list");
    const grid = screen.getByRole("tab", { name: "Grid" });
    expect(grid).toHaveClass("sw-tab");
    expect(grid).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Grid panel");
  });

  it("switches panels with the arrow keys and skips disabled tabs", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Example onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Type panel");
    expect(onSelectionChange.mock.calls.at(-1)?.[0]).toBe("type");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Grid" })).toHaveAttribute("aria-selected", "true");
  });

  it("exposes vertical orientation for styling", () => {
    render(
      <Tabs orientation="vertical">
        <TabList aria-label="Side">
          <Tab id="a">A</Tab>
        </TabList>
        <TabPanel id="a">A panel</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("data-orientation", "vertical");
  });

  it("has no structural violations", async () => {
    const { container } = render(<Example />);
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the components**

`packages/react/src/navigation/Tabs.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type TabsProps = Omit<AriaTabsProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function Tabs({ className, ...rest }: TabsProps) {
  return <AriaTabs className={cx("sw-tabs", className)} {...rest} />;
}

export type TabListProps = Omit<AriaTabListProps<object>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

/** Requires an accessible name: aria-label or aria-labelledby. */
export function TabList({ className, ...rest }: TabListProps) {
  return <AriaTabList className={cx("sw-tab-list", className)} {...rest} />;
}

export type TabProps = Omit<AriaTabProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function Tab({ className, ...rest }: TabProps) {
  return <AriaTab className={cx("sw-tab", className)} {...rest} />;
}

export type TabPanelProps = Omit<AriaTabPanelProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function TabPanel({ className, ...rest }: TabPanelProps) {
  return <AriaTabPanel className={cx("sw-tab-panel", className)} {...rest} />;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

If RAC's default keyboard handling does not wrap from the last enabled tab back to the first, change only the final `ArrowRight` assertion to the tab RAC actually selects, keep the "skips disabled" intent (Colour is never selected), and report it.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Tabs on React Aria"
```

---

### Task 4: Header with skip link

**Files:**
- Modify: `packages/tokens/src/foundation.ts`, `packages/tokens/test/foundation.test.ts`
- Create: `packages/css/src/components/header.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/navigation/Header.tsx`
- Test: `packages/react/test/navigation.test.tsx` (append)

- [ ] **Step 1: Header height token (test first)**

In `packages/tokens/test/foundation.test.ts`, inside `"emits grid, control, focus and motion tokens"`, add:

```ts
    expect(t["header-height"]).toBe("4rem");
```

In `packages/tokens/src/foundation.ts`, add `"header-height": rem(64),` after `"target-min"` in the `Object.assign` block.

Run: `pnpm --filter @raster/tokens test && pnpm --filter @raster/tokens build`
Expected: PASS.

- [ ] **Step 2: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("header", () => {
  it("sticks to the top below modals and toasts", () => {
    const r = rule(".sw-header[data-sticky]");
    expect(r).toMatch(/position:\s*sticky/);
    expect(r).toMatch(/z-index:\s*var\(--z-sticky\)/);
  });

  it("keeps focused content clear of the sticky header (WCAG 2.4.11)", () => {
    expect(css).toMatch(
      /:root:has\(\.sw-header\[data-sticky\]\)\s*\{[^}]*scroll-padding-block-start:\s*calc\(var\(--header-height\) \+ var\(--space-4\)\)/,
    );
  });

  it("hides the skip link off-screen until it is focused", () => {
    expect(rule(".sw-skip-link")).toMatch(/transform:\s*translateY\(/);
    expect(rule(".sw-skip-link:focus")).toMatch(/transform:\s*none/);
  });

  it("marks the current nav item with weight and underline", () => {
    const r = rule('.sw-header-nav .sw-link[aria-current="page"]');
    expect(r).toMatch(/font-weight:\s*500/);
    expect(r).toMatch(/text-decoration-line:\s*underline/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 3: Write the CSS**

`packages/css/src/components/header.css`:

```css
.sw-header {
  position: relative;
  border-block-end: 1px solid var(--border);
  background-color: var(--surface-page);
}

.sw-header[data-sticky] {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--z-sticky);
}

/* Focused targets scrolled into view are never hidden under the sticky header. */
:root:has(.sw-header[data-sticky]) {
  scroll-padding-block-start: calc(var(--header-height) + var(--space-4));
}

.sw-header-inner {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  min-block-size: var(--header-height);
  max-inline-size: calc(var(--content-max) + 2 * var(--page-margin));
  margin-inline: auto;
  padding-inline: var(--page-margin);
}

.sw-header-brand {
  flex: none;
  font-weight: 500;
}

.sw-header-nav {
  display: flex;
  flex: 1;
  gap: var(--space-5);
  min-inline-size: 0;
  overflow-x: auto;
}

.sw-header-nav .sw-link {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--target-min);
  color: var(--text-secondary);
  text-decoration-line: none;
  white-space: nowrap;
}

@media (hover: hover) {
  .sw-header-nav .sw-link:hover {
    color: var(--text-primary);
  }
}

.sw-header-nav .sw-link[aria-current="page"] {
  color: var(--text-primary);
  font-weight: 500;
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
}

.sw-header-actions {
  display: flex;
  flex: none;
  gap: var(--space-2);
  margin-inline-start: auto;
}

.sw-skip-link {
  position: absolute;
  inset-block-start: var(--space-2);
  inset-inline-start: var(--space-2);
  z-index: var(--z-toast);
  padding-block: var(--space-2);
  padding-inline: var(--space-3);
  border-radius: var(--radius);
  background-color: var(--accent);
  color: var(--on-accent);
  font-weight: 500;
  text-decoration: none;
  transform: translateY(calc(-100% - var(--space-4)));
}

.sw-skip-link:focus {
  transform: none;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/header.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 4: Write the failing React tests**

Append to `packages/react/test/navigation.test.tsx` (add `import { Header } from "../src/navigation/Header";` and `import { Link } from "../src/actions/Link";`):

```tsx
describe("Header", () => {
  function Page() {
    return (
      <>
        <Header
          brand={<a href="/">Raster</a>}
          actions={<button type="button">Theme</button>}
        >
          <Link href="/foundations">Foundations</Link>
          <Link href="/components" aria-current="page">
            Components
          </Link>
        </Header>
        <main id="main" tabIndex={-1}>
          Content
        </main>
      </>
    );
  }

  it("is a banner with a skip link first, then brand, nav and actions", () => {
    render(<Page />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("sw-header");
    expect(banner).toHaveAttribute("data-sticky");
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(skip).toHaveClass("sw-skip-link");
    expect(banner.querySelector("a")).toBe(skip);
    expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("sw-header-nav");
    expect(screen.getByRole("button", { name: "Theme" }).closest(".sw-header-actions")).not.toBeNull();
  });

  it("puts the skip link first in the tab order", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveFocus();
  });

  it("marks the current page link", () => {
    render(<Page />);
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  });

  it("can opt out of sticky and rename the landmark and skip target", () => {
    render(
      <Header brand="Raster" sticky={false} navLabel="Primary" skipTo="#content">
        <Link href="/">Home</Link>
      </Header>,
    );
    expect(screen.getByRole("banner")).not.toHaveAttribute("data-sticky");
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
  });

  it("has no structural violations", async () => {
    const { container } = render(<Page />);
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 5: Write the component**

`packages/react/src/navigation/Header.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
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
};

/** The site banner: skip link, brand, primary navigation and actions. */
export function Header({
  brand,
  children,
  actions,
  navLabel = "Main",
  skipTo = "#main",
  sticky = true,
  className,
  ...rest
}: HeaderProps) {
  return (
    <header className={cx("sw-header", className)} data-sticky={sticky ? "" : undefined} {...rest}>
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
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm --filter @raster/tokens test && pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

If `aria-current` does not reach the `<a>` through RAC `Link` (the types or the DOM-prop filter reject it), stop and report: the nav current-page styling depends on it.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens packages/css packages/react
git commit -m "feat: add Header with skip link, sticky banner and current-page nav"
```

---

### Task 5: Expressive motion tier and Reveal

**Files:**
- Create: `packages/css/src/motion.css`
- Modify: `packages/css/build.mjs`, `packages/css/package.json`
- Test: `packages/css/test/motion.test.ts`
- Create: `packages/react/src/motion/Reveal.tsx`
- Test: `packages/react/test/navigation.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS tests**

`packages/css/test/motion.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { buildCss, buildMotionCss } from "../build.mjs";

let motion = "";
let core = "";
beforeAll(async () => {
  motion = await buildMotionCss();
  core = await buildCss();
});

describe("motion.css (expressive tier)", () => {
  it("is a separate opt-in stylesheet, not part of raster.css", () => {
    expect(motion).toContain(".sw-reveal");
    expect(core).not.toContain("sw-reveal-in");
  });

  it("reveals on scroll only where view timelines are supported", () => {
    expect(motion).toMatch(/@supports \(animation-timeline: view\(\)\)/);
    expect(motion).toMatch(/--_reveal-timeline:\s*view\(\)/);
    expect(motion).toMatch(/animation-timeline:\s*var\(--_reveal-timeline\)/);
  });

  it("never merges the timeline into the animation shorthand (browsers reject that)", () => {
    expect(motion).not.toMatch(/animation:[^;]*view\(\)/);
  });

  it("uses backwards fill only, so no transform lingers after the reveal", () => {
    expect(motion).toMatch(/animation:[^;]*sw-reveal-in[^;]*;/);
    expect(motion).toMatch(/animation:[^;]*backwards/);
    expect(motion).not.toMatch(/animation:[^;]*(forwards|both)/);
  });

  it("staggers children column by column", () => {
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > :nth-child\(2\)\s*\{\s*--_i:\s*1/);
    expect(motion).toMatch(/\.sw-reveal\[data-stagger\] > :nth-child\(12\)\s*\{\s*--_i:\s*11/);
  });

  it("turns page transitions on, and everything off under reduced motion", () => {
    expect(motion).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*@view-transition\s*\{\s*navigation:\s*none/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation:\s*none/);
    expect(motion).toMatch(/\[data-motion="?reduce"?\] :is\([^)]*\.sw-reveal[^{]*\{\s*animation:\s*none/);
  });

  it("offers the variable-weight shift", () => {
    expect(motion).toMatch(/\.sw-weight-shift\s*\{[^}]*transition:\s*font-weight var\(--dur-base\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `buildMotionCss` is not exported.

- [ ] **Step 2: Write motion.css and the build**

`packages/css/src/motion.css`:

```css
/*
 * Raster expressive motion tier — opt in by loading @raster/css/motion.css after raster.css.
 * Progressive enhancement only; switched off by prefers-reduced-motion and [data-motion="reduce"].
 */

@layer raster.components {
  @keyframes sw-reveal-in {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  /* The timeline goes through a custom property: Lightning CSS would otherwise fold it into the
     animation shorthand, which browsers reject. Backwards fill only, so no transform lingers. */
  @supports (animation-timeline: view()) {
    .sw-reveal:not([data-stagger]),
    .sw-reveal[data-stagger] > * {
      --_reveal-timeline: view();
      animation: sw-reveal-in linear backwards;
      animation-timeline: var(--_reveal-timeline);
      animation-range: entry calc(var(--_i, 0) * 4%) cover calc(25% + var(--_i, 0) * 4%);
    }

    .sw-reveal[data-stagger] > :nth-child(2) { --_i: 1; }
    .sw-reveal[data-stagger] > :nth-child(3) { --_i: 2; }
    .sw-reveal[data-stagger] > :nth-child(4) { --_i: 3; }
    .sw-reveal[data-stagger] > :nth-child(5) { --_i: 4; }
    .sw-reveal[data-stagger] > :nth-child(6) { --_i: 5; }
    .sw-reveal[data-stagger] > :nth-child(7) { --_i: 6; }
    .sw-reveal[data-stagger] > :nth-child(8) { --_i: 7; }
    .sw-reveal[data-stagger] > :nth-child(9) { --_i: 8; }
    .sw-reveal[data-stagger] > :nth-child(10) { --_i: 9; }
    .sw-reveal[data-stagger] > :nth-child(11) { --_i: 10; }
    .sw-reveal[data-stagger] > :nth-child(12) { --_i: 11; }
  }

  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: var(--dur-slow);
    animation-timing-function: var(--ease-standard);
  }

  .sw-weight-shift {
    transition: font-weight var(--dur-base) var(--ease-standard);
  }

  .sw-weight-shift:is(:hover, :focus-visible) {
    font-weight: 500;
  }

  @media (prefers-reduced-motion: reduce) {
    .sw-reveal:not([data-stagger]),
    .sw-reveal[data-stagger] > * {
      animation: none;
    }

    .sw-weight-shift {
      transition: none;
    }
  }

  [data-motion="reduce"] :is(.sw-reveal:not([data-stagger]), .sw-reveal[data-stagger] > *) {
    animation: none;
  }
}

/* Cross-document page transitions (same-origin navigations). */
@view-transition {
  navigation: auto;
}

@media (prefers-reduced-motion: reduce) {
  @view-transition {
    navigation: none;
  }
}
```

In `packages/css/build.mjs`, refactor the bundling into a helper and add `buildMotionCss`:
- **New helper:** add `async function bundle(entry, minify)`. It holds the existing `bundleAsync({ filename: resolve(root, entry), minify, resolver: … })` call and returns `code.toString()`.
- **`buildCss`:** change it to `return \`${LAYER_ORDER}\n${await bundle("src/index.css", minify)}\`;`.
- **`buildMotionCss`:** add `export async function buildMotionCss({ minify = false } = {}) { return bundle("src/motion.css", minify); }`.
- **CLI block:** also write `dist/motion.css` with `await buildMotionCss()`, and update the log line to `Wrote dist/raster.css, dist/raster.min.css and dist/motion.css`.

In `packages/css/package.json` `exports`, add `"./motion.css": "./dist/motion.css"`.

Do not add `src/motion.css` to `src/index.css`; it must stay out of `raster.css`.

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint && pnpm --filter @raster/css build && ls packages/css/dist`
Expected: PASS. `dist/` contains `motion.css`.

The lint run covers `src/**/*.css`, so `motion.css` is checked for raw colours too: it contains none.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/navigation.test.tsx` (add `import { Reveal } from "../src/motion/Reveal";`):

```tsx
describe("Reveal", () => {
  it("wraps content in the reveal class, staggering children when asked", () => {
    render(
      <>
        <Reveal data-testid="a">One block</Reveal>
        <Reveal as="ul" stagger data-testid="b">
          <li>1</li>
          <li>2</li>
        </Reveal>
      </>,
    );
    expect(screen.getByTestId("a")).toHaveClass("sw-reveal");
    expect(screen.getByTestId("a")).not.toHaveAttribute("data-stagger");
    expect(screen.getByTestId("b").tagName).toBe("UL");
    expect(screen.getByTestId("b")).toHaveAttribute("data-stagger");
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the component**

`packages/react/src/motion/Reveal.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type RevealProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Reveal direct children one after another (column by column in a grid). */
    stagger?: boolean;
  }
>;

/**
 * Fades and lifts content in as it scrolls into view. Requires @raster/css/motion.css;
 * does nothing without it, in browsers without scroll-driven animations, or under reduced motion.
 * Never wrap a ThemeRegion's overlays in it: they portal to <body> and are unaffected anyway.
 */
export function Reveal<E extends ElementType = "div">({ as, className, stagger, ...rest }: RevealProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-reveal", className)} data-stagger={stagger ? "" : undefined} {...rest} />;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: expressive motion tier (motion.css) and Reveal"
```

---

### Task 6: Exports, playground sections, and verification

**Files:**
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/css/playground/index.html`

- [ ] **Step 1: Extend the exports test (failing)**

Add these names to the `expected` array in `packages/react/test/exports.test.ts`:

```ts
      "Breadcrumbs", "Breadcrumb", "Tabs", "TabList", "Tab", "TabPanel", "Header", "Reveal",
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL.

- [ ] **Step 2: Add the exports**

Append to `packages/react/src/index.ts`:

```ts
export { Reveal, type RevealProps } from "./motion/Reveal";
export { Breadcrumb, type BreadcrumbProps, Breadcrumbs, type BreadcrumbsProps } from "./navigation/Breadcrumbs";
export { Header, type HeaderProps } from "./navigation/Header";
export { Tab, TabList, type TabListProps, TabPanel, type TabPanelProps, type TabProps, Tabs, type TabsProps } from "./navigation/Tabs";
```

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build`
Expected: PASS; `dist/navigation/` and `dist/motion/` exist.

- [ ] **Step 3: Add the playground sections**

In `packages/css/playground/index.html`:

1. **Stylesheet:** add `<link rel="stylesheet" href="../dist/motion.css" />` on the line after the `raster.css` link.
2. **Two new sections:** inside the `data-layout="hanging"` grid, insert these two pairs right after the `07 / Overlays` content element and before the grid's closing `</div>`. The grid's direct children must stay alternating label / content pairs, 18 in total.

```html
        <p class="sw-type-label sw-text-secondary">08 / Navigation</p>
        <div class="sw-stack" data-gap="6">
          <div style="position: relative; border: 1px solid var(--border)">
            <header class="sw-header">
              <a class="sw-skip-link" href="#main">Skip to content</a>
              <div class="sw-header-inner">
                <div class="sw-header-brand"><a class="sw-link" href="#">Raster</a></div>
                <nav class="sw-header-nav" aria-label="Main">
                  <a class="sw-link" href="#">Foundations</a>
                  <a class="sw-link" href="#" aria-current="page">Components</a>
                  <a class="sw-link" href="#">Patterns</a>
                </nav>
                <div class="sw-header-actions">
                  <button type="button" class="sw-button" data-variant="ghost">Theme</button>
                </div>
              </div>
            </header>
          </div>
          <nav aria-label="Breadcrumbs">
            <ol class="sw-breadcrumbs">
              <li class="sw-breadcrumb"><a class="sw-link" href="#">Home</a><span class="sw-breadcrumb-separator" aria-hidden="true">/</span></li>
              <li class="sw-breadcrumb"><a class="sw-link" href="#">Components</a><span class="sw-breadcrumb-separator" aria-hidden="true">/</span></li>
              <li class="sw-breadcrumb"><span class="sw-link" aria-current="page">Button</span></li>
            </ol>
          </nav>
          <div class="sw-tabs">
            <div class="sw-tab-list" role="tablist" aria-label="Foundations">
              <div class="sw-tab" role="tab" aria-selected="true" data-selected>Grid</div>
              <div class="sw-tab" role="tab" aria-selected="false">Type</div>
              <div class="sw-tab" role="tab" aria-selected="false" aria-disabled="true" data-disabled>Colour</div>
            </div>
            <div class="sw-tab-panel" role="tabpanel">Grid panel content.</div>
          </div>
        </div>

        <p class="sw-type-label sw-text-secondary">09 / Motion</p>
        <div class="sw-grid sw-reveal" data-stagger>
          <div class="sw-col sw-card" style="--span-8: 4; --span-12: 4"><p class="sw-weight-shift">Column one</p></div>
          <div class="sw-col sw-card" style="--span-8: 4; --span-12: 4"><p class="sw-weight-shift">Column two</p></div>
          <div class="sw-col sw-card" style="--span-8: 8; --span-12: 4"><p class="sw-weight-shift">Column three</p></div>
        </div>
```

- [ ] **Step 4: Run every gate**

Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`
Expected: all succeed.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css/playground
git commit -m "feat(react): export navigation and Reveal; add navigation and motion to playground"
```

- [ ] **Step 6: Browser check**

This step is for whoever has a browser. In the playground:
- **Header:** the current nav item ("Components") is underlined and weighted. Pressing Tab from the top of the page shows the skip link.
- **Breadcrumbs:** slashes are muted mono, and "Button" is plain text.
- **Tabs:** the selected tab has an accent underline and weight 500, and the disabled tab is muted.
- **Motion section:** scrolling to it fades and lifts the three cards in one after another. In Chrome, check that `getComputedStyle(card).animationTimeline` reports a view timeline. Under `data-motion="reduce"` on `<html>`, nothing animates.
- **Themes:** repeat in Zürich dark.

---

## Spec coverage for this plan

| Spec item | Covered by |
|---|---|
| §6 navigation: Tabs, Header (skip link), Breadcrumbs | Tasks 2–4 |
| §7 expressive tier: column-staggered scroll reveals, page transitions, variable weight shift, progressive enhancement, no JS animation library | Task 5 |
| §7 reduced motion disables the expressive tier | Task 5 |
| §8 skip link; focus not obscured by sticky header (2.4.11); keyboard; state not by colour alone; RTL via logical properties | Tasks 3–4 |
| §11 Link and React Aria | Task 1 |

**Deferred:** a responsive Header menu for narrow screens (the nav scrolls horizontally for now) and visual regression across real browsers (Plan 4).
