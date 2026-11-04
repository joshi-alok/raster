# Raster Plan 3a: Overlays — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship four overlay components: Dialog, Menu, Tooltip and Toast. Alongside them, ship three supporting pieces:
- **Shared overlay stylesheet:** with the core motion tier (fade plus a 4–8px slide, swapped for a plain fade under reduced motion).
- **`ThemeRegion`:** themed sections whose overlays open in the section's own theme and mode.
- **`--scrim` token:** the backdrop colour behind modal dialogs.

**Architecture:**
- **Behaviour:** overlays use React Aria Components (RAC) 1.22.1 for focus trapping, dismissal, positioning, keyboard handling and announcements.
- **Shared styles:** `overlay.css` holds the popover, listbox, menu and motion rules shared by Select, Menu and Tooltip. Those rules move out of `select.css`.
- **ThemeRegion:** renders `data-theme` / `data-mode` plus an in-region portal host. React Aria's `UNSAFE_PortalProvider` portals every overlay opened inside it into that host, so the overlay inherits the region's CSS variables and `color-scheme`. Outside any ThemeRegion, overlays portal to `document.body` and use the root theme, as before.
- **Motion:** all motion is CSS keyed on RAC's `[data-entering]` and `[data-exiting]`. RAC waits for `animationend` before unmounting, so exit animations play.

**Tech Stack:** react-aria-components 1.22.1; react-aria 3.53.1 (`UNSAFE_PortalProvider`, the version RAC 1.22.1 itself depends on); plus the existing stack.

**Spec:**
- **§6:** the Overlays and navigation group, and the one shadow token used for overlays.
- **§7:** the core motion tier, overlay enter/exit (fade plus ≤ 8px translate), and reduced motion.
- **§8:** focus, keyboard and naming.
- **§11:** the shared overlay styles and the theme-aware portal.

**Builds on Plans 1, 2a and 2b (merged):**
- **Button:** wraps RAC `Button` with `onPress` and `isDisabled`, so it can be the trigger child of `DialogTrigger`, `MenuTrigger` and `TooltipTrigger`. `IconButton` passes `label` through as `aria-label`.
- **`select.css`:** currently holds `.sw-popover`, `.sw-listbox` and `.sw-listbox-item`.
- **Tests:**
  - **CSS:** `packages/css/test/components.test.ts` has `rule(selector)` and `css`. `rule()` returns the first rule whose selector text *ends with* the argument, so it can hit the last selector of a grouped rule. Use `css` regexes for grouped selectors.
  - **React:** tests use Vitest, jsdom, user-event and `expectAccessible`.
- **Tokens:** `packages/tokens/src/foundation.ts` builds the foundation tokens. `foundationTokens()` returns a flat map, and `light-dark()` is allowed in values.

**Lightning CSS output quirks.** Write tolerant regexes for these:
- **Formatting:** it may drop attribute quotes, reorder declarations, and lowercase system colours.
- **Rewrites:** `::before` becomes `:before`, `transparent` becomes `#0000`, `0ms` becomes `0s`, and `:nth-child(even)` becomes `2n`.

**React Aria API notes, checked against the 1.22.1 type definitions:**
- **Dialog:** `ModalOverlay` takes `isDismissable` (and `isKeyboardDismissDisabled`). `Dialog` children may be `(opts: { close }) => ReactNode`, and `Heading slot="title"` labels the dialog.
- **Tooltip:** `Tooltip` takes `placement` and `offset`, and `TooltipTrigger` takes `delay`.
- **Menu:** `Menu`, `MenuItem`, `MenuTrigger` and `Separator` exist. `MenuItem` omits `onClick`, so use `onAction` on `Menu` or `MenuItem`.
- **Toast:** the toast API is exported as `UNSTABLE_ToastRegion`, `UNSTABLE_Toast`, `UNSTABLE_ToastContent` and `UNSTABLE_ToastQueue`. `ToastRegion` takes `queue` and a `({ toast })` render child, and `Toast` takes `toast`. `ToastQueue` methods: `add(content, { timeout?, onClose? })` returns a key, and `close(key)` closes a toast. Inside a Toast, `Text slot="title"`, `Text slot="description"` and `Button slot="close"` are wired automatically.
- **Portal:** `UNSAFE_PortalProvider` comes from `react-aria` (not RAC) and takes `{ getContainer: () => HTMLElement | null, children }`.

## Plan series

1. Tokens and CSS foundations (done).
2. React package and static components (done).
3. Forms on React Aria (done).
4. **Plan 3a (this plan):** overlays (Dialog, Menu, Tooltip, Toast), the overlay motion and ThemeRegion.
5. **Plan 3b:** navigation (Tabs, Header with skip link, Breadcrumbs, and the decision on Link with React Aria), plus the expressive motion tier (`motion.css`, `<Reveal>`).
6. **Plan 4:** the docs site and the Playwright gates.

---

## File structure

```
packages/tokens/src/foundation.ts              + --scrim
packages/tokens/test/foundation.test.ts        + scrim assertion

packages/css/src/components/overlay.css        popover, listbox, menu, overlay motion (moved + new)
packages/css/src/components/select.css         trimmed to trigger/value only
packages/css/src/components/modal.css          modal overlay, modal, dialog
packages/css/src/components/tooltip.css
packages/css/src/components/toast.css
packages/css/src/components/theme-region.css   portal host
packages/css/test/components.test.ts           + overlay, modal, tooltip, toast tests

packages/react/src/overlays/ThemeRegion.tsx
packages/react/src/overlays/Dialog.tsx         Dialog (+ re-exported DialogTrigger)
packages/react/src/overlays/Menu.tsx           Menu, MenuItem, MenuSeparator (+ MenuTrigger)
packages/react/src/overlays/Tooltip.tsx        Tooltip (+ TooltipTrigger)
packages/react/src/overlays/Toast.tsx          ToastRegion, toastQueue, ToastContent type
packages/react/test/overlays.test.tsx
packages/react/src/index.ts, test/exports.test.ts
packages/css/playground/index.html             + "07 / Overlays" static samples
```

---

### Task 1: Scrim token and shared overlay stylesheet with motion

**Files:**
- Modify: `packages/tokens/src/foundation.ts`, `packages/tokens/test/foundation.test.ts`
- Create: `packages/css/src/components/overlay.css`
- Modify: `packages/css/src/components/select.css`, `packages/css/src/index.css`, `packages/css/test/components.test.ts`

- [ ] **Step 1: Scrim token (test first)**

In `packages/tokens/test/foundation.test.ts`, inside the test `"emits grid, control, focus and motion tokens"`, add:

```ts
    expect(t["scrim"]).toBe("light-dark(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6))");
```

Run: `pnpm --filter @raster/tokens test`
Expected: FAIL.

In `packages/tokens/src/foundation.ts`, add this entry to the `Object.assign(t, { … })` block, right after `"shadow-overlay"`:

```ts
    scrim: "light-dark(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6))",
```

Run: `pnpm --filter @raster/tokens test && pnpm --filter @raster/tokens build`
Expected: PASS; the build reports 0 contrast violations.

- [ ] **Step 2: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("overlay stylesheet", () => {
  it("keeps popover and listbox styles, now shared", () => {
    expect(rule(".sw-popover")).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(css).toMatch(/\.sw-listbox-item,\s*\.sw-menu-item\s*\{[^}]*min-block-size:\s*var\(--control-height\)/);
    expect(css).toMatch(/\.sw-listbox-item\[data-focused\],\s*\.sw-menu-item\[data-focused\]\s*\{[^}]*var\(--surface-subtle\)/);
  });

  it("animates overlays in with a fade and short slide, and out with a fade", () => {
    expect(css).toMatch(/@keyframes sw-overlay-in\s*\{[^}]*from\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/:is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-entering\]\s*\{[^}]*animation:\s*sw-overlay-in var\(--dur-base\) var\(--ease-standard\)/);
    expect(css).toMatch(/:is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-exiting\]\s*\{[^}]*animation:\s*sw-overlay-out var\(--dur-fast\)/);
  });

  it("slides from the trigger side for each placement", () => {
    expect(css).toMatch(/\[data-placement="?top"?\]\s*\{\s*--_overlay-from:\s*translateY\(4px\)/);
    expect(css).toMatch(/\[data-placement="?left"?\]\s*\{\s*--_overlay-from:\s*translateX\(4px\)/);
  });

  it("falls back to a plain fade under reduced motion", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[^{]*\{[^@]*\[data-entering\]\s*\{\s*animation-name:\s*sw-fade-in/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] :is\(\.sw-popover, \.sw-tooltip, \.sw-modal\)\[data-entering\]\s*\{\s*animation-name:\s*sw-fade-in/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL. The menu, motion and keyframe assertions fail; the `.sw-popover` assertion still passes.

- [ ] **Step 3: Move and extend the styles**

In `packages/css/src/components/select.css`, delete the `.sw-popover` rule and every rule from `.sw-listbox` to the end of the file. Keep only `.sw-select-trigger`, `.sw-select-trigger svg`, `.sw-select-value`, `.sw-select-value[data-placeholder]` and the `.sw-select[data-invalid] …` rules.

Create `packages/css/src/components/overlay.css`:

```css
/* Floating surfaces shared by Select, Menu and other popovers. */
.sw-popover {
  min-inline-size: var(--trigger-width);
  max-block-size: 20rem;
  padding: var(--space-1);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
}

.sw-listbox,
.sw-menu {
  display: grid;
  outline: none;
}

.sw-listbox-item,
.sw-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-block-size: var(--control-height);
  padding-inline: var(--space-3);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: var(--text-body-size);
  line-height: 1.25;
  cursor: pointer;
  outline: none;
}

.sw-listbox-item[data-focused],
.sw-menu-item[data-focused] {
  background-color: var(--surface-subtle);
}

.sw-listbox-item[data-focus-visible],
.sw-menu-item[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width));
}

/* Selected: weight plus a check icon, never colour alone. */
.sw-listbox-item[data-selected] {
  font-weight: 500;
}

.sw-listbox-item svg,
.sw-menu-item svg {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

.sw-listbox-item[data-disabled],
.sw-menu-item[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-menu-item[data-variant="danger"] {
  color: var(--danger);
}

.sw-menu-separator {
  block-size: 1px;
  margin-block: var(--space-1);
  background-color: var(--border);
}

/* Core motion tier: fade plus a short slide away from the trigger. */
@keyframes sw-overlay-in {
  from {
    opacity: 0;
    transform: var(--_overlay-from);
  }
}

@keyframes sw-fade-in {
  from {
    opacity: 0;
  }
}

@keyframes sw-overlay-out {
  to {
    opacity: 0;
  }
}

.sw-popover,
.sw-tooltip {
  --_overlay-from: translateY(-4px);
}

.sw-modal {
  --_overlay-from: translateY(8px);
}

:is(.sw-popover, .sw-tooltip)[data-placement="top"] {
  --_overlay-from: translateY(4px);
}

:is(.sw-popover, .sw-tooltip)[data-placement="left"] {
  --_overlay-from: translateX(4px);
}

:is(.sw-popover, .sw-tooltip)[data-placement="right"] {
  --_overlay-from: translateX(-4px);
}

:is(.sw-popover, .sw-tooltip, .sw-modal)[data-entering] {
  animation: sw-overlay-in var(--dur-base) var(--ease-standard);
}

:is(.sw-popover, .sw-tooltip, .sw-modal)[data-exiting] {
  animation: sw-overlay-out var(--dur-fast) var(--ease-linear);
}

/* Reduced motion: keep the fade, drop the slide (durations are already capped by base.css). */
@media (prefers-reduced-motion: reduce) {
  :is(.sw-popover, .sw-tooltip, .sw-modal)[data-entering] {
    animation-name: sw-fade-in;
  }
}

[data-motion="reduce"] :is(.sw-popover, .sw-tooltip, .sw-modal)[data-entering] {
  animation-name: sw-fade-in;
}
```

In `packages/css/src/index.css`, insert this immediately **before** the `select.css` import line:

```css
@import "./components/overlay.css" layer(raster.components);
```

- [ ] **Step 4: Run everything**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint && pnpm --filter @raster/react test`
Expected: PASS.

The earlier `select` CSS tests used `rule(".sw-popover")` and `rule(".sw-listbox-item")`. They still pass, because the styles now live in `overlay.css`, which is still in the bundle. If `rule(".sw-listbox-item")` or `rule(".sw-listbox-item[data-focused]")` now fails because the selector is grouped, change only those assertions to `css` regexes like the new ones above, and report it.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens packages/css
git commit -m "feat(css): shared overlay stylesheet with core motion tier; add scrim token"
```

---

### Task 2: ThemeRegion with a theme-aware portal

**Files:**
- Modify: `packages/react/package.json`
- Create: `packages/css/src/components/theme-region.css`
- Modify: `packages/css/src/index.css`
- Create: `packages/react/src/overlays/ThemeRegion.tsx`
- Test: `packages/react/test/overlays.test.tsx`

- [ ] **Step 1: Dependency**

In `packages/react/package.json`, add `"react-aria": "3.53.1"` to `dependencies`. This is the exact version react-aria-components 1.22.1 depends on, so there is one shared copy. Run `pnpm install`, then check with `pnpm --filter @raster/react why react-aria`. It must show a single version, 3.53.1. If it shows two, stop and report.

- [ ] **Step 2: Write the failing tests**

`packages/react/test/overlays.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select, SelectItem } from "../src/forms/Select";
import { ThemeRegion } from "../src/overlays/ThemeRegion";

describe("ThemeRegion", () => {
  it("sets theme and mode attributes on its element", () => {
    render(
      <ThemeRegion theme="zurich" mode="dark" data-testid="r">
        <p>Inside</p>
      </ThemeRegion>,
    );
    const r = screen.getByTestId("r");
    expect(r).toHaveAttribute("data-theme", "zurich");
    expect(r).toHaveAttribute("data-mode", "dark");
    expect(r).toHaveClass("sw-theme-region");
  });

  it("portals overlays opened inside it into the region, so they inherit its theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeRegion theme="zurich" mode="dark">
        <Select label="Theme">
          <SelectItem id="a">Alpine</SelectItem>
        </Select>
      </ThemeRegion>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.closest('[data-theme="zurich"]')).not.toBeNull();
    expect(listbox.closest(".sw-portal-host")).not.toBeNull();
  });

  it("leaves overlays outside any region portalled to the body", async () => {
    const user = userEvent.setup();
    render(
      <Select label="Theme">
        <SelectItem id="a">Alpine</SelectItem>
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox.closest(".sw-portal-host")).toBeNull();
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved `../src/overlays/ThemeRegion`.

- [ ] **Step 3: Write the CSS and component**

`packages/css/src/components/theme-region.css`:

```css
/* Overlays opened inside a ThemeRegion are portalled here, inheriting its theme tokens and color-scheme. */
.sw-portal-host {
  display: contents;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/theme-region.css" layer(raster.components);
```

`packages/react/src/overlays/ThemeRegion.tsx`:

```tsx
import { type ElementType, type ReactNode, useCallback, useRef } from "react";
import { UNSAFE_PortalProvider } from "react-aria";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type ThemeRegionProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    theme?: "alpine" | "zurich";
    mode?: "light" | "dark";
    children?: ReactNode;
  }
>;

/**
 * A section with its own theme and/or mode. Overlays (Select, Menu, Dialog, Tooltip) opened
 * inside it are portalled into the region, so they render in the region's theme too.
 */
export function ThemeRegion<E extends ElementType = "div">({
  as,
  className,
  theme,
  mode,
  children,
  ...rest
}: ThemeRegionProps<E>) {
  const Component: ElementType = as ?? "div";
  const hostRef = useRef<HTMLDivElement>(null);
  const getContainer = useCallback(() => hostRef.current, []);
  return (
    <Component className={cx("sw-theme-region", className)} data-theme={theme} data-mode={mode} {...rest}>
      <UNSAFE_PortalProvider getContainer={getContainer}>{children}</UNSAFE_PortalProvider>
      <div ref={hostRef} className="sw-portal-host" />
    </Component>
  );
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint && pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css pnpm-lock.yaml
git commit -m "feat: ThemeRegion portals overlays into themed sections"
```

---

### Task 3: Dialog

**Files:**
- Create: `packages/css/src/components/modal.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/overlays/Dialog.tsx`
- Test: `packages/react/test/overlays.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("modal dialog", () => {
  it("covers the viewport with the scrim and centres the modal", () => {
    const r = rule(".sw-modal-overlay");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/background-color:\s*var\(--scrim\)/);
    expect(r).toMatch(/place-items:\s*center/);
  });

  it("is a raised surface with the overlay shadow that scrolls when tall", () => {
    const r = rule(".sw-modal");
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
    expect(r).toMatch(/overflow:\s*auto/);
  });

  it("fades the scrim in and out", () => {
    expect(rule(".sw-modal-overlay[data-entering]")).toMatch(/animation:\s*sw-fade-in/);
    expect(rule(".sw-modal-overlay[data-exiting]")).toMatch(/animation:\s*sw-overlay-out/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/modal.css`:

```css
.sw-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--page-margin);
  background-color: var(--scrim);
}

.sw-modal-overlay[data-entering] {
  animation: sw-fade-in var(--dur-base) var(--ease-linear);
}

.sw-modal-overlay[data-exiting] {
  animation: sw-overlay-out var(--dur-fast) var(--ease-linear);
}

.sw-modal {
  inline-size: min(100%, 32rem);
  max-block-size: calc(100dvh - 2 * var(--page-margin));
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
  color: var(--text-primary);
}

.sw-dialog {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
  outline: none;
}

.sw-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-block-start: var(--space-2);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/modal.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/overlays.test.tsx`. Add these imports:
- `import { Button } from "../src/actions/Button";`
- `import { Dialog, DialogTrigger } from "../src/overlays/Dialog";`
- `import { expectAccessible } from "./axe";`

```tsx
describe("Dialog", () => {
  function Example({ dismissable = true }: { dismissable?: boolean }) {
    return (
      <DialogTrigger>
        <Button>Delete file</Button>
        <Dialog title="Delete this file?" isDismissable={dismissable}>
          {({ close }) => (
            <>
              <p>This can't be undone.</p>
              <div className="sw-dialog-actions">
                <Button onPress={close}>Cancel</Button>
                <Button variant="danger" onPress={close}>
                  Delete
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </DialogTrigger>
    );
  }

  it("opens from its trigger, is named by its title, and traps focus inside", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete this file?" });
    expect(dialog).toHaveClass("sw-dialog");
    expect(dialog.closest(".sw-modal")).not.toBeNull();
    expect(dialog.closest(".sw-modal-overlay")).not.toBeNull();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Delete file" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes from an action via the render-prop close()", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can be an alert dialog", async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <Dialog title="Session expired" role="alertdialog">
          <p>Sign in again.</p>
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByRole("alertdialog", { name: "Session expired" })).toBeInTheDocument();
  });

  it("has no structural violations when open", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Delete file" }));
    await expectAccessible((await screen.findByRole("dialog")).closest(".sw-modal-overlay")!);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the component**

`packages/react/src/overlays/Dialog.tsx`:

```tsx
import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading as AriaHeading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { DialogTrigger };

export type DialogProps = {
  /** Visible title; also the dialog's accessible name. */
  title: ReactNode;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Close on outside click (Escape always closes). Defaults to true. */
  isDismissable?: boolean;
  /** "alertdialog" for interruptions that need a response. */
  role?: "dialog" | "alertdialog";
  className?: string;
};

/** A modal dialog. Place inside DialogTrigger after the trigger Button. */
export function Dialog({ title, children, isDismissable = true, role = "dialog", className }: DialogProps) {
  return (
    <ModalOverlay className="sw-modal-overlay" isDismissable={isDismissable}>
      <Modal className="sw-modal">
        <AriaDialog className={cx("sw-dialog", className)} role={role}>
          {({ close }) => (
            <>
              <AriaHeading slot="title" level={2} className="sw-type-h3">
                {title}
              </AriaHeading>
              {typeof children === "function" ? children({ close }) : children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

If the Escape test sees the dialog still mounted, RAC is waiting for an exit animation that jsdom never fires. In that case wrap the assertion in `await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())` (import `waitFor` from Testing Library) and report it. Do not change the CSS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add modal Dialog on React Aria"
```

---

### Task 4: Menu

**Files:**
- Create: `packages/react/src/overlays/Menu.tsx`
- Test: `packages/react/test/overlays.test.tsx` (append)

The styles already exist in `overlay.css` (Task 1).

- [ ] **Step 1: Write the failing tests**

Append to `packages/react/test/overlays.test.tsx` (add `import { Menu, MenuItem, MenuSeparator, MenuTrigger } from "../src/overlays/Menu";` and add `vi` to the vitest import):

```tsx
describe("Menu", () => {
  function Example({ onAction }: { onAction?: (key: unknown) => void }) {
    return (
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu onAction={onAction}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem id="delete" variant="danger">
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  }

  it("opens a menu of items from its trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveClass("sw-menu");
    expect(menu.closest(".sw-popover")).not.toBeNull();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("separator")).toHaveClass("sw-menu-separator");
  });

  it("reports the chosen item and closes", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
    expect(onAction).toHaveBeenCalledWith("duplicate");
  });

  it("marks destructive items", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "danger");
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 2: Write the component**

`packages/react/src/overlays/Menu.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  MenuTrigger,
  Popover,
  type Placement,
  Separator,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { MenuTrigger };

export type MenuProps<T extends object> = Omit<AriaMenuProps<T>, "className"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    /** Where the menu opens relative to its trigger. Defaults to "bottom start". */
    placement?: Placement;
  };

/** A menu of actions. Place inside MenuTrigger after the trigger Button. */
export function Menu<T extends object>({ className, placement = "bottom start", ...rest }: MenuProps<T>) {
  return (
    <Popover className="sw-popover" placement={placement}>
      <AriaMenu className={cx("sw-menu", className)} {...rest} />
    </Popover>
  );
}

export type MenuItemProps = Omit<AriaMenuItemProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
    /** "danger" for destructive actions. */
    variant?: "default" | "danger";
  };

export function MenuItem({ className, children, variant = "default", ...rest }: MenuItemProps) {
  return (
    <AriaMenuItem
      className={cx("sw-menu-item", className)}
      data-variant={variant === "danger" ? "danger" : undefined}
      textValue={typeof children === "string" ? children : undefined}
      {...rest}
    >
      {children}
    </AriaMenuItem>
  );
}

export function MenuSeparator() {
  return <Separator className="sw-menu-separator" />;
}
```

- [ ] **Step 3: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

If `data-variant` does not reach the menu item's DOM node, RAC's prop filter dropped it. Stop and report: do not wrap the item in another element.

- [ ] **Step 4: Commit**

```bash
git add packages/react
git commit -m "feat: add Menu, MenuItem and MenuSeparator on React Aria"
```

---

### Task 5: Tooltip

**Files:**
- Create: `packages/css/src/components/tooltip.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/overlays/Tooltip.tsx`
- Test: `packages/react/test/overlays.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS test**

Append to `packages/css/test/components.test.ts`:

```ts
describe("tooltip", () => {
  it("inverts the page colours for a compact, high-contrast label", () => {
    const r = rule(".sw-tooltip");
    expect(r).toMatch(/background-color:\s*var\(--text-primary\)/);
    expect(r).toMatch(/color:\s*var\(--surface-page\)/);
    expect(r).toMatch(/font-size:\s*var\(--text-caption-size\)/);
    expect(r).toMatch(/max-inline-size:\s*16rem/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/tooltip.css`:

```css
/* Inverted colours: text-primary on surface-page contrast is already verified by the token build. */
.sw-tooltip {
  max-inline-size: 16rem;
  padding-block: var(--space-1);
  padding-inline: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius);
  background-color: var(--text-primary);
  color: var(--surface-page);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
  box-shadow: var(--shadow-overlay);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/tooltip.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/overlays.test.tsx`. Add these imports:
- `import { X } from "lucide-react";`
- `import { IconButton } from "../src/actions/IconButton";`
- `import { Tooltip, TooltipTrigger } from "../src/overlays/Tooltip";`

```tsx
describe("Tooltip", () => {
  it("appears on keyboard focus and describes its trigger", async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <IconButton label="Close">
          <X />
        </IconButton>
        <Tooltip>Close panel (Esc)</Tooltip>
      </TooltipTrigger>,
    );
    await user.tab();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveClass("sw-tooltip");
    expect(tip).toHaveTextContent("Close panel (Esc)");
    expect(screen.getByRole("button", { name: "Close" })).toHaveAccessibleDescription("Close panel (Esc)");
  });

  it("hides on Escape", async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <IconButton label="Close">
          <X />
        </IconButton>
        <Tooltip>Close panel</Tooltip>
      </TooltipTrigger>,
    );
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the component**

`packages/react/src/overlays/Tooltip.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  TooltipTrigger,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { TooltipTrigger };

export type TooltipProps = Omit<AriaTooltipProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
  };

/**
 * A short description of its trigger, shown on hover and keyboard focus.
 * Never put essential information or interactive content in a tooltip.
 */
export function Tooltip({ className, children, placement = "top", offset = 8, ...rest }: TooltipProps) {
  return (
    <AriaTooltip className={cx("sw-tooltip", className)} placement={placement} offset={offset} {...rest}>
      {children}
    </AriaTooltip>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

The Escape test may see the tooltip still mounted, because of the exit-animation wait in jsdom. If so, use `await waitFor(...)` and report it.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Tooltip on React Aria"
```

---

### Task 6: Toast

**Files:**
- Create: `packages/css/src/components/toast.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/overlays/Toast.tsx`
- Test: `packages/react/test/overlays.test.tsx` (append)

RAC's toast API is marked `UNSTABLE_`. Raster wraps it so that only `Toast.tsx` imports it. A future RAC change then touches one file.

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("toast", () => {
  it("pins the region to the inline-end bottom corner", () => {
    const r = rule(".sw-toast-region");
    expect(r).toMatch(/position:\s*fixed/);
    expect(r).toMatch(/inset-inline-end:\s*var\(--space-5\)/);
    expect(r).toMatch(/inset-block-end:\s*var\(--space-5\)/);
  });

  it("is a raised surface with icon, content and close button in a row", () => {
    const r = rule(".sw-toast");
    expect(r).toMatch(/grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/);
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
  });

  it("colours the tone icon from role tokens", () => {
    expect(rule('.sw-toast[data-tone="danger"] .sw-toast-icon')).toMatch(/color:\s*var\(--danger\)/);
    expect(rule('.sw-toast[data-tone="success"] .sw-toast-icon')).toMatch(/color:\s*var\(--success\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/toast.css`:

```css
.sw-toast-region {
  position: fixed;
  inset-block-end: var(--space-5);
  inset-inline-end: var(--space-5);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  inline-size: min(calc(100vw - 2 * var(--space-5)), 24rem);
  outline: none;
}

.sw-toast {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: var(--space-3);
  padding: var(--space-3);
  padding-inline-start: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  box-shadow: var(--shadow-overlay);
  color: var(--text-primary);
  outline: none;
  animation: sw-overlay-in var(--dur-base) var(--ease-standard);
  --_overlay-from: translateY(8px);
}

.sw-toast[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

.sw-toast-icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin-block-start: var(--space-2);
  color: var(--accent);
  stroke-width: 1.5;
}

.sw-toast[data-tone="success"] .sw-toast-icon {
  color: var(--success);
}

.sw-toast[data-tone="warning"] .sw-toast-icon {
  color: var(--warning);
}

.sw-toast[data-tone="danger"] .sw-toast-icon {
  color: var(--danger);
}

.sw-toast-content {
  display: grid;
  gap: var(--space-1);
  padding-block: var(--space-2);
}

.sw-toast-title {
  font-weight: 500;
  line-height: 1.25;
}

.sw-toast-description {
  color: var(--text-secondary);
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
}

@media (prefers-reduced-motion: reduce) {
  .sw-toast {
    animation-name: sw-fade-in;
  }
}

[data-motion="reduce"] .sw-toast {
  animation-name: sw-fade-in;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/toast.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/overlays.test.tsx` (add `import { act } from "@testing-library/react";` and `import { createToastQueue, ToastRegion } from "../src/overlays/Toast";`):

```tsx
describe("Toast", () => {
  it("shows queued toasts with title, description and tone, and dismisses them", async () => {
    const user = userEvent.setup();
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: "File saved", description: "All changes synced.", tone: "success" });
    });
    const title = await screen.findByText("File saved");
    const toast = title.closest(".sw-toast")!;
    expect(toast).toHaveAttribute("data-tone", "success");
    expect(screen.getByText("All changes synced.")).toHaveClass("sw-toast-description");
    expect(toast.querySelector(".sw-toast-icon")).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("File saved")).toBeNull();
  });

  it("names the region for assistive tech", () => {
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} />);
    act(() => {
      queue.add({ title: "Hello" });
    });
    expect(screen.getByRole("region", { name: /notifications/i })).toHaveClass("sw-toast-region");
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the component**

`packages/react/src/overlays/Toast.tsx`:

```tsx
import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint, X } from "lucide-react";
import {
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";
import { IconButton } from "../actions/IconButton";
import { cx } from "../utils/cx";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastContent = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

export type ToastQueue = AriaToastQueue<ToastContent>;

/** Create a queue; call queue.add({ title, … }, { timeout }) to show a toast. */
export function createToastQueue(maxVisibleToasts = 5): ToastQueue {
  return new AriaToastQueue<ToastContent>({ maxVisibleToasts });
}

/** A shared app-wide queue for the common case of one ToastRegion. */
export const toastQueue: ToastQueue = createToastQueue();

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

export type ToastRegionProps = {
  queue?: ToastQueue;
  className?: string;
};

/** Render once near the app root; shows toasts added to its queue. */
export function ToastRegion({ queue = toastQueue, className }: ToastRegionProps) {
  return (
    <AriaToastRegion queue={queue} className={cx("sw-toast-region", className)}>
      {({ toast }) => {
        const tone = toast.content.tone ?? "info";
        const Icon = ICONS[tone];
        return (
          <AriaToast toast={toast} className="sw-toast" data-tone={tone}>
            <Icon className="sw-toast-icon" aria-hidden="true" />
            <AriaToastContent className="sw-toast-content">
              <Text slot="title" className="sw-toast-title">
                {toast.content.title}
              </Text>
              {toast.content.description && (
                <Text slot="description" className="sw-toast-description">
                  {toast.content.description}
                </Text>
              )}
            </AriaToastContent>
            <IconButton slot="close" label="Dismiss" variant="ghost">
              <X />
            </IconButton>
          </AriaToast>
        );
      }}
    </AriaToastRegion>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: PASS.

Known risks, with the allowed adjustments:
- **Region name:** if the region's accessible name is not "Notifications" (RAC's default label may vary by locale or version), match the name RAC actually renders with a case-insensitive regex, and report the actual name.
- **Dismissed toast still mounted:** if the toast is still mounted after Dismiss, wrap that assertion in `waitFor`.
- **`data-tone` dropped:** if `data-tone` does not reach the toast DOM node, stop and report.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Toast region and queue on React Aria"
```

---

### Task 7: Exports, playground overlays section, and verification

**Files:**
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/css/playground/index.html`

- [ ] **Step 1: Extend the exports test (failing)**

Add these names to the `expected` array in `packages/react/test/exports.test.ts`:

```ts
      "ThemeRegion", "Dialog", "DialogTrigger", "Menu", "MenuItem", "MenuSeparator", "MenuTrigger",
      "Tooltip", "TooltipTrigger", "ToastRegion", "createToastQueue",
```

Also add, as its own test in the same file:

```ts
  it("exports a shared toast queue", () => {
    expect(typeof (raster as Record<string, unknown>).toastQueue).toBe("object");
  });
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL.

- [ ] **Step 2: Add the exports**

Append to `packages/react/src/index.ts`:

```ts
export { Dialog, type DialogProps, DialogTrigger } from "./overlays/Dialog";
export { Menu, MenuItem, type MenuItemProps, type MenuProps, MenuSeparator, MenuTrigger } from "./overlays/Menu";
export { ThemeRegion, type ThemeRegionProps } from "./overlays/ThemeRegion";
export {
  createToastQueue,
  type ToastContent,
  type ToastQueue,
  ToastRegion,
  type ToastRegionProps,
  type ToastTone,
  toastQueue,
} from "./overlays/Toast";
export { Tooltip, type TooltipProps, TooltipTrigger } from "./overlays/Tooltip";
```

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build`
Expected: PASS; `dist/overlays/` exists.

- [ ] **Step 3: Add static overlay samples to the playground**

In `packages/css/playground/index.html`, inside the `data-layout="hanging"` grid, insert this pair right after the `06 / Forms` content element and before the grid's closing `</div>`. The grid's direct children must stay alternating label / content pairs, 14 in total. The overlays are shown statically and inline: the playground checks CSS only.

```html
        <p class="sw-type-label sw-text-secondary">07 / Overlays</p>
        <div class="sw-stack" data-gap="6">
          <div class="sw-popover" style="position: static; inline-size: 14rem">
            <div class="sw-menu" role="menu" aria-label="Actions">
              <div class="sw-menu-item" role="menuitem">Edit</div>
              <div class="sw-menu-item" role="menuitem" data-focused>Duplicate</div>
              <div class="sw-menu-separator" role="separator"></div>
              <div class="sw-menu-item" role="menuitem" data-variant="danger">Delete</div>
            </div>
          </div>
          <div class="sw-tooltip" role="tooltip" style="inline-size: max-content">Close panel (Esc)</div>
          <div style="position: relative; block-size: 16rem; overflow: hidden">
            <div class="sw-modal-overlay" style="position: absolute">
              <div class="sw-modal">
                <div class="sw-dialog" role="dialog" aria-labelledby="pg-dlg">
                  <h2 class="sw-type-h3" id="pg-dlg">Delete this file?</h2>
                  <p>This can't be undone.</p>
                  <div class="sw-dialog-actions">
                    <button type="button" class="sw-button" data-variant="secondary">Cancel</button>
                    <button type="button" class="sw-button" data-variant="danger">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="sw-toast" data-tone="success" style="max-inline-size: 24rem">
            <svg class="sw-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
            <div class="sw-toast-content">
              <span class="sw-toast-title">File saved</span>
              <span class="sw-toast-description">All changes synced.</span>
            </div>
            <button type="button" class="sw-button sw-icon-button" data-variant="ghost" aria-label="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
```

- [ ] **Step 4: Run every gate**

Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`
Expected: all succeed.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css/playground
git commit -m "feat(react): export overlays; add overlay samples to playground"
```

- [ ] **Step 6: Browser check**

This step is for whoever has a browser. In the playground, in Alpine and Zürich, light and dark, check:
- **Menu:** the focused item is on the subtle surface, and the danger item is red.
- **Tooltip:** it is inverted (dark on light pages, light on dark pages).
- **Modal:** the scrim darkens the backdrop, and the modal has square corners in Zürich.
- **Toast:** the toast has a green icon.

Then add `data-motion="reduce"` to `<html>` and confirm nothing in the samples depends on motion.

---

## Spec coverage for this plan

| Spec item | Covered by |
|---|---|
| §6 overlays: Dialog, Menu, Tooltip, Toast | Tasks 3–6 |
| §6 "only floating overlays get one soft shadow" | `shadow-overlay` on popover, modal, tooltip, toast (1, 3, 5, 6) |
| §7 core tier: overlay enter/exit, fade + ≤ 8px translate | Task 1 (popover, tooltip, modal), 3 (scrim), 6 (toast) |
| §7 reduced motion: transforms removed, fades kept | Tasks 1 and 6 |
| §8 keyboard, focus trap/return, naming, tone not colour alone | Tasks 3–6 (tests), 6 (tone icon + title) |
| §11 shared overlay styles; theme-aware portal | Tasks 1 and 2 |

**Deferred to Plan 3b:** Tabs, Header (skip link), Breadcrumbs, the decision on Link and React Aria, and the expressive motion tier.
