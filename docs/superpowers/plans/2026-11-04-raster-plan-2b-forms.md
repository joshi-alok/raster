# Raster Plan 2b: Forms on React Aria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- **Form controls:** ship the version 1 set on React Aria Components (Field parts, TextField, TextArea, Checkbox, Switch, RadioGroup + Radio, Select + SelectItem).
- **Button:** migrate `Button` and `IconButton` to React Aria's `Button`, so Plan 3's dialog, menu and tooltip triggers work. This settles the open decision in spec section 11.

**Architecture:**
- **Behaviour:** React Aria Components (RAC) provides it — labelling, `aria-describedby` wiring, validation, keyboard, focus-visible and pressed state.
- **Styling:** Raster provides it. Each RAC part gets an `sw-` class, and CSS keys off the `data-*` state attributes RAC sets: `data-selected`, `data-focus-visible`, `data-invalid`, `data-disabled`, `data-pressed`, `data-placeholder` and `data-focused`.
- **Class names:** components accept only string `className` (merged with `cx`), never RAC's function form, so the class contract stays stable.
- **"Field":** the spec's Field is realised as three exported parts (`FieldLabel`, `FieldDescription`, `FieldError`) that every form control composes.

**Tech Stack:** react-aria-components 1.22.1 (peer: react, react-dom), @testing-library/user-event 14.6.8, plus the Plan 2a stack.

**Spec:** `docs/superpowers/specs/2026-11-04-raster-design-system-design.md` — section 6 (forms group, React Aria, 40px controls, 44px targets), section 8 (states never by colour alone, RTL, reduced motion), section 11 (Button decision).

**Builds on Plans 1 and 2a (merged):**
- **Tokens and CSS:** as in Plan 2a.
- **`packages/css/test/components.test.ts`:** has `rule(selector)` (the body of the first rule whose selector is exactly `selector`; attribute quotes optional) and `css` (the bundle).
- **`packages/react`:** has `cx`, `expectAccessible(container)`, and tests in jsdom.
- **Current `Button`:** a native `<button>` with `data-variant` and `type="button"`. `IconButton` wraps it with `aria-label`.

**Lightning CSS output quirks.** Write tolerant regexes for these:
- It may drop attribute quotes.
- It reorders declarations.
- It rewrites `::before` to `:before`.
- It rewrites `:nth-child(even)` to `2n`.
- It rewrites `transparent` to `#0000`.
- It rewrites `0ms` to `0s`.

**React Aria API notes, checked against the 1.22.1 type definitions:**
- **Prop shapes:** RAC components take `className?: string | (renderProps) => string`. `Button`, `Checkbox`, `Radio`, `Switch` and `ListBoxItem` **omit `onClick`**, so use `onPress`. Disabled is `isDisabled`. Invalid is `isInvalid`.
- **Select:** `Select<T, M>` omits `items`; items go on `ListBox`. The Popover sets the CSS variable `--trigger-width`.
- **Select selection props:** use `defaultValue` / `value` / `onChange`. If the types reject `defaultValue`, use `defaultSelectedKey` / `selectedKey` / `onSelectionChange` and report it.

**Known limitation, recorded for Plan 3:** RAC's Popover renders into `document.body`. A Select inside a nested `[data-theme]` or `[data-mode]` region will open its list in the root theme. Plan 3 owns overlays and will add a theme-aware portal container.

## Plan series

1. Tokens and CSS foundations (done).
2. **Plan 2a:** React package and static components (done).
3. **Plan 2b (this plan):** forms on React Aria, plus the Button migration.
4. **Plan 3:** overlays and navigation, plus the expressive motion tier.
5. **Plan 4:** the docs site and the Playwright quality gates.

---

## File structure

```
packages/css/src/components/
  field.css      .sw-field, .sw-field-label, .sw-field-description, .sw-field-error, .sw-input, .sw-textarea
  choice.css     .sw-checkbox, .sw-radio, .sw-radio-group, .sw-switch (+ box, dot, track, thumb)
  select.css     .sw-select-trigger, .sw-select-value, .sw-popover, .sw-listbox, .sw-listbox-item
  button.css     + [data-pressed] state
packages/css/test/components.test.ts        + field, choice, select, pressed tests

packages/react/src/actions/Button.tsx        now wraps RAC Button
packages/react/src/forms/FieldParts.tsx      FieldLabel, FieldDescription, FieldError
packages/react/src/forms/TextField.tsx       TextField, TextArea
packages/react/src/forms/Checkbox.tsx
packages/react/src/forms/Switch.tsx
packages/react/src/forms/RadioGroup.tsx      RadioGroup, Radio
packages/react/src/forms/Select.tsx          Select, SelectItem
packages/react/src/index.ts                  + exports
packages/react/test/actions.test.tsx         Button tests move to onPress / isDisabled
packages/react/test/forms.test.tsx           new
packages/react/test/exports.test.ts          + new names
packages/css/playground/index.html           + "06 / Forms" section
```

---

### Task 1: Dependencies and Button on React Aria

**Files:**
- Modify: `packages/react/package.json`, `packages/react/src/actions/Button.tsx`, `packages/react/test/actions.test.tsx`
- Modify: `packages/css/src/components/button.css`, `packages/css/test/components.test.ts`

- [ ] **Step 1: Add dependencies**

In `packages/react/package.json`:
- **`dependencies`:** add `"react-aria-components": "1.22.1"`.
- **`peerDependencies`:** add `"react-dom": "^19.0.0"` back, because RAC's popovers portal through react-dom.
- **`devDependencies`:** add `"@testing-library/user-event": "14.6.8"`.

Run: `pnpm install`
Expected: installs without errors.

- [ ] **Step 2: Update the Button tests (failing)**

In `packages/react/test/actions.test.tsx`:
- Add `import userEvent from "@testing-library/user-event";` to the imports.
- Replace the test `it("calls onClick, but not when disabled", …)` with:

```tsx
  it("calls onPress, but not when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Button onPress={onPress}>Go</Button>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(
      <Button onPress={onPress} isDisabled>
        Go
      </Button>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("exposes pressed and focus-visible state for styling", async () => {
    const user = userEvent.setup();
    render(<Button>State</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveAttribute("data-focus-visible");
  });
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL. `onPress` is not a valid prop yet, so the press is never called. `isDisabled` is ignored, so the button is not disabled. Typecheck would also fail.

- [ ] **Step 3: Rewrite Button on React Aria**

`packages/react/src/actions/Button.tsx`:

```tsx
import type { RefAttributes } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = Omit<AriaButtonProps, "className"> &
  RefAttributes<HTMLButtonElement> & {
    /** Use "primary" at most once per view. Defaults to "secondary". */
    variant?: ButtonVariant;
    className?: string;
  };

/**
 * React Aria button: use `onPress` (not onClick) and `isDisabled`. Defaults to type="button".
 * Works as the trigger child of React Aria dialogs, menus and tooltips.
 */
export function Button({ variant = "secondary", className, ...rest }: ButtonProps) {
  return <AriaButton className={cx("sw-button", className)} data-variant={variant} {...rest} />;
}
```

`IconButton.tsx` keeps working unchanged: it passes `aria-label` and children through `ButtonProps`.

- [ ] **Step 4: Add the pressed state to button.css (test first)**

Append to `packages/css/test/components.test.ts`:

```ts
describe("button pressed state", () => {
  it("darkens filled and outline buttons while pressed", () => {
    expect(css).toMatch(/\.sw-button\[data-pressed\]\s*\{[^}]*background-color:\s*var\(--border\)/);
    expect(css).toMatch(
      /\.sw-button\[data-variant="?primary"?\]\[data-pressed\]\s*\{[^}]*color-mix\(in srgb,\s*var\(--accent\) 75%/,
    );
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

Insert into `packages/css/src/components/button.css`, immediately before the `.sw-button:is(:disabled, [aria-disabled="true"])` rule, so disabled still wins:

```css
.sw-button[data-pressed] {
  background-color: var(--border);
}

.sw-button[data-variant="primary"][data-pressed] {
  background-color: color-mix(in srgb, var(--accent) 75%, var(--text-primary));
}

.sw-button[data-variant="danger"][data-pressed] {
  background-color: color-mix(in srgb, var(--danger) 75%, var(--text-primary));
}
```

`data-pressed` is never set on a disabled RAC button, so no `:not()` guard is needed.

- [ ] **Step 5: Run everything**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint && pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS. The existing Button tests also pass: default `type="button"`, `data-variant`, variant, submit type, ref, the IconButton name and axe. RAC Button keeps `type` and passes `data-*` attributes through.

If `data-variant` does not reach the DOM, RAC's DOM-prop filter has dropped it. Stop and report: do not work around it with a wrapper element.

- [ ] **Step 6: Commit**

```bash
git add packages/react packages/css pnpm-lock.yaml
git commit -m "feat!: Button wraps React Aria Button (onPress, isDisabled, pressed state)"
```

---

### Task 2: Field styles, field parts, TextField and TextArea

**Files:**
- Create: `packages/css/src/components/field.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/forms/FieldParts.tsx`, `packages/react/src/forms/TextField.tsx`
- Test: `packages/react/test/forms.test.tsx`

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("field", () => {
  it("stacks label, control, description and error", () => {
    expect(rule(".sw-field")).toMatch(/display:\s*grid/);
    expect(rule(".sw-field-label")).toMatch(/font-weight:\s*500/);
    expect(rule(".sw-field-description")).toMatch(/color:\s*var\(--text-secondary\)/);
    expect(rule(".sw-field-error")).toMatch(/color:\s*var\(--danger\)/);
  });

  it("makes inputs 40px controls with a control-strength border", () => {
    const r = rule(".sw-input");
    expect(r).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
  });

  it("marks invalid inputs with colour and a thicker leading edge", () => {
    expect(css).toMatch(/\.sw-input\[aria-invalid="?true"?\]\s*\{[^}]*border-color:\s*var\(--danger\)/);
    expect(css).toMatch(/\.sw-input\[aria-invalid="?true"?\]\s*\{[^}]*border-inline-start-width:\s*4px/);
  });

  it("lets text areas grow vertically", () => {
    expect(rule(".sw-textarea")).toMatch(/resize:\s*vertical/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-field`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/field.css`:

```css
.sw-field {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}

.sw-field-label {
  color: var(--text-primary);
  font-size: var(--text-body-size);
  font-weight: 500;
  line-height: 1.25;
}

.sw-field-description,
.sw-field-error {
  font-size: var(--text-caption-size);
  line-height: var(--text-caption-leading);
}

.sw-field-description {
  color: var(--text-secondary);
}

.sw-field-error {
  color: var(--danger);
}

.sw-input {
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding-block: var(--space-2);
  padding-inline: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--text-primary);
  font-size: var(--text-body-size);
  line-height: 1.5;
  transition: border-color var(--dur-fast) var(--ease-standard);
}

.sw-input::placeholder {
  color: var(--text-muted);
}

@media (hover: hover) {
  .sw-input:hover:not(:disabled, [aria-invalid="true"]) {
    border-color: var(--text-secondary);
  }
}

/* Invalid: colour plus a thicker leading edge, so the state never relies on colour alone. */
.sw-input[aria-invalid="true"] {
  border-color: var(--danger);
  border-inline-start-width: 4px;
}

.sw-input:disabled {
  background-color: var(--surface-subtle);
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-textarea {
  min-block-size: calc(var(--control-height) * 2.5);
  resize: vertical;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/field.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

`packages/react/test/forms.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextArea, TextField } from "../src/forms/TextField";
import { expectAccessible } from "./axe";

describe("TextField", () => {
  it("labels the input and wires the description", () => {
    render(<TextField label="Email" description="We never share it." placeholder="name@company.com" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveClass("sw-input");
    expect(input).toHaveAttribute("placeholder", "name@company.com");
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(input.closest(".sw-field")).not.toBeNull();
  });

  it("shows the error message and marks the input invalid", () => {
    render(<TextField label="Email" isInvalid errorMessage="Enter an email address." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter an email address.")).toHaveClass("sw-field-error");
    expect(input).toHaveAccessibleDescription("Enter an email address.");
  });

  it("reports typed values", async () => {
    const user = userEvent.setup();
    let value = "";
    render(<TextField label="Name" onChange={(v) => (value = v)} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    expect(value).toBe("Ada");
  });

  it("merges className onto the field wrapper", () => {
    render(<TextField label="Name" className="extra" />);
    expect(screen.getByRole("textbox").closest(".sw-field")).toHaveClass("extra");
  });
});

describe("TextArea", () => {
  it("renders a labelled multi-line field", () => {
    render(<TextArea label="Message" rows={4} />);
    const area = screen.getByRole("textbox", { name: "Message" });
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).toHaveClass("sw-input", "sw-textarea");
    expect(area).toHaveAttribute("rows", "4");
  });
});

describe("text field accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <form>
        <TextField label="Email" description="Work address" />
        <TextField label="Name" isInvalid errorMessage="Required" />
        <TextArea label="Message" />
      </form>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/forms/TextField"`.

- [ ] **Step 4: Write the components**

`packages/react/src/forms/FieldParts.tsx`:

```tsx
import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps,
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
  Text as AriaText,
  type TextProps as AriaTextProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type FieldLabelProps = AriaLabelProps;

/** The visible label of a form control; React Aria wires it to the control. */
export function FieldLabel({ className, ...rest }: FieldLabelProps) {
  return <AriaLabel className={cx("sw-field-label", className)} {...rest} />;
}

export type FieldDescriptionProps = Omit<AriaTextProps, "slot">;

/** Help text, announced with the control via aria-describedby. */
export function FieldDescription({ className, ...rest }: FieldDescriptionProps) {
  return <AriaText slot="description" className={cx("sw-field-description", className)} {...rest} />;
}

export type FieldErrorProps = Omit<AriaFieldErrorProps, "className"> & { className?: string };

/** Shown only while the field is invalid; announced with the control. */
export function FieldError({ className, ...rest }: FieldErrorProps) {
  return <AriaFieldError className={cx("sw-field-error", className)} {...rest} />;
}
```

`packages/react/src/forms/TextField.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Input,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

type BaseProps = Omit<AriaTextFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    /** Shown when the field is invalid (isInvalid or failed validation). */
    errorMessage?: ReactNode;
    placeholder?: string;
    className?: string;
  };

export type TextFieldProps = BaseProps;

export function TextField({ label, description, errorMessage, placeholder, className, ...rest }: TextFieldProps) {
  return (
    <AriaTextField className={cx("sw-field", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Input className="sw-input" placeholder={placeholder} />
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}

export type TextAreaProps = BaseProps & { rows?: number };

export function TextArea({ label, description, errorMessage, placeholder, rows, className, ...rest }: TextAreaProps) {
  return (
    <AriaTextField className={cx("sw-field", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <AriaTextArea className="sw-input sw-textarea" placeholder={placeholder} rows={rows} />
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

If `toHaveAccessibleDescription` doesn't include the error text when `isInvalid` is set, check whether RAC renders `FieldError` only after validation. If so, assert that the error text is present and has the class, drop the description assertion for the invalid case, and report it.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add field parts, TextField and TextArea on React Aria"
```

---

### Task 3: Checkbox and Switch

**Files:**
- Create: `packages/css/src/components/choice.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/forms/Checkbox.tsx`, `packages/react/src/forms/Switch.tsx`
- Test: `packages/react/test/forms.test.tsx` (append)

`choice.css` holds checkbox, radio and switch styles. This task adds checkbox and switch; Task 4 appends radio.

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("checkbox", () => {
  it("gives the whole label a 44px target", () => {
    expect(css).toMatch(/\.sw-checkbox[^{]*\{[^}]*min-block-size:\s*var\(--target-min\)/);
  });

  it("fills the box with the accent when selected or indeterminate", () => {
    expect(css).toMatch(
      /\.sw-checkbox\[data-selected\] \.sw-checkbox-box,\s*\.sw-checkbox\[data-indeterminate\] \.sw-checkbox-box\s*\{[^}]*background-color:\s*var\(--accent\)/,
    );
  });

  it("draws the focus ring on the box", () => {
    expect(css).toMatch(/\.sw-checkbox\[data-focus-visible\] \.sw-checkbox-box[^{]*\{[^}]*outline:\s*var\(--focus-width\) solid var\(--accent\)/);
  });
});

describe("switch", () => {
  it("uses a pill track and moves the thumb when selected", () => {
    expect(rule(".sw-switch-track")).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(rule(".sw-switch[data-selected] .sw-switch-track")).toMatch(/background-color:\s*var\(--accent\)/);
    expect(rule(".sw-switch[data-selected] .sw-switch-thumb")).toMatch(/translateX\(1rem\)/);
  });

  it("mirrors the thumb in right-to-left text", () => {
    expect(css).toMatch(/\.sw-switch\[data-selected\]:dir\(rtl\) \.sw-switch-thumb\s*\{[^}]*translateX\(-1rem\)/);
  });

  it("does not animate the thumb when reduced motion is requested", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[^{]*\{[^@]*\.sw-switch-thumb\s*\{[^}]*transition:\s*none/);
    expect(css).toMatch(/\[data-motion="?reduce"?\] \.sw-switch-thumb\s*\{[^}]*transition:\s*none/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/choice.css`:

```css
/* Shared: the whole label is the hit target. */
.sw-checkbox,
.sw-radio,
.sw-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-block-size: var(--target-min);
  color: var(--text-primary);
  font-size: var(--text-body-size);
  line-height: 1.25;
  cursor: pointer;
}

.sw-checkbox[data-disabled],
.sw-radio[data-disabled],
.sw-switch[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}

/* Checkbox */
.sw-checkbox-box {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--on-accent);
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.sw-checkbox-box svg {
  inline-size: 0.875rem;
  block-size: 0.875rem;
  stroke-width: 2.5;
}

.sw-checkbox[data-selected] .sw-checkbox-box,
.sw-checkbox[data-indeterminate] .sw-checkbox-box {
  border-color: var(--accent);
  background-color: var(--accent);
}

.sw-checkbox[data-invalid] .sw-checkbox-box {
  border-color: var(--danger);
  border-width: 2px;
}

.sw-checkbox[data-disabled] .sw-checkbox-box {
  border-color: var(--border);
  background-color: var(--surface-subtle);
}

.sw-checkbox[data-focus-visible] .sw-checkbox-box {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

/* Switch */
.sw-switch-track {
  display: flex;
  flex: none;
  align-items: center;
  inline-size: 2.25rem;
  block-size: 1.25rem;
  padding: 2px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-full);
  background-color: var(--surface-subtle);
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.sw-switch-thumb {
  inline-size: calc(1.25rem - 6px);
  block-size: calc(1.25rem - 6px);
  border-radius: var(--radius-full);
  background-color: var(--text-secondary);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.sw-switch[data-selected] .sw-switch-track {
  border-color: var(--accent);
  background-color: var(--accent);
}

.sw-switch[data-selected] .sw-switch-thumb {
  background-color: var(--on-accent);
  transform: translateX(1rem);
}

.sw-switch[data-selected]:dir(rtl) .sw-switch-thumb {
  transform: translateX(-1rem);
}

.sw-switch[data-disabled] .sw-switch-track {
  border-color: var(--border);
}

.sw-switch[data-focus-visible] .sw-switch-track {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}

@media (prefers-reduced-motion: reduce) {
  .sw-switch-thumb {
    transition: none;
  }
}

[data-motion="reduce"] .sw-switch-thumb {
  transition: none;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/choice.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/forms.test.tsx`. Add `import { Checkbox } from "../src/forms/Checkbox";` and `import { Switch } from "../src/forms/Switch";` to the imports.

```tsx
describe("Checkbox", () => {
  it("is a labelled checkbox that toggles", async () => {
    const user = userEvent.setup();
    render(<Checkbox>Remember me</Checkbox>);
    const box = screen.getByRole("checkbox", { name: "Remember me" });
    expect(box).not.toBeChecked();
    await user.click(screen.getByText("Remember me"));
    expect(box).toBeChecked();
    expect(box.closest(".sw-checkbox")).toHaveAttribute("data-selected");
  });

  it("shows a check when selected and a dash when indeterminate", () => {
    const { container, rerender } = render(<Checkbox defaultSelected>All</Checkbox>);
    expect(container.querySelector(".sw-checkbox-box svg")).not.toBeNull();
    rerender(<Checkbox isIndeterminate>All</Checkbox>);
    expect(container.querySelector(".sw-checkbox")).toHaveAttribute("data-indeterminate");
    expect(container.querySelector(".sw-checkbox-box svg")).not.toBeNull();
  });

  it("hides the visual box from assistive tech", () => {
    const { container } = render(<Checkbox>Terms</Checkbox>);
    expect(container.querySelector(".sw-checkbox-box")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Switch", () => {
  it("is a labelled switch that toggles", async () => {
    const user = userEvent.setup();
    render(<Switch>Dark mode</Switch>);
    const sw = screen.getByRole("switch", { name: "Dark mode" });
    expect(sw).not.toBeChecked();
    await user.click(screen.getByText("Dark mode"));
    expect(sw).toBeChecked();
    expect(sw.closest(".sw-switch")).toHaveAttribute("data-selected");
  });
});

describe("checkbox and switch accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <div>
        <Checkbox>Remember me</Checkbox>
        <Switch defaultSelected>Notifications</Switch>
      </div>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved imports.

- [ ] **Step 4: Write the components**

`packages/react/src/forms/Checkbox.tsx`:

```tsx
import { Check, Minus } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type CheckboxProps = Omit<AriaCheckboxProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

export function Checkbox({ className, children, ...rest }: CheckboxProps) {
  return (
    <AriaCheckbox className={cx("sw-checkbox", className)} {...rest}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span className="sw-checkbox-box" aria-hidden="true">
            {isIndeterminate ? <Minus /> : isSelected ? <Check /> : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}
```

`packages/react/src/forms/Switch.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type SwitchProps = Omit<AriaSwitchProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

/** An on/off setting that takes effect immediately; use Checkbox for form submissions. */
export function Switch({ className, children, ...rest }: SwitchProps) {
  return (
    <AriaSwitch className={cx("sw-switch", className)} {...rest}>
      <span className="sw-switch-track" aria-hidden="true">
        <span className="sw-switch-thumb" />
      </span>
      {children}
    </AriaSwitch>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Checkbox and Switch on React Aria"
```

---

### Task 4: RadioGroup and Radio

**Files:**
- Modify: `packages/css/src/components/choice.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/forms/RadioGroup.tsx`
- Test: `packages/react/test/forms.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("radio", () => {
  it("draws a round dot that becomes a thick accent ring when selected", () => {
    expect(rule(".sw-radio-dot")).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(rule(".sw-radio[data-selected] .sw-radio-dot")).toMatch(/border:\s*6px solid var\(--accent\)/);
  });

  it("lays options out vertically, or in a row when horizontal", () => {
    expect(rule(".sw-radio-list")).toMatch(/display:\s*grid/);
    expect(rule('.sw-radio-group[data-orientation="horizontal"] .sw-radio-list')).toMatch(/display:\s*flex/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Append the CSS**

Append to `packages/css/src/components/choice.css`:

```css
/* Radio */
.sw-radio-list {
  display: grid;
  gap: var(--space-1);
}

.sw-radio-group[data-orientation="horizontal"] .sw-radio-list {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--space-5);
}

.sw-radio-dot {
  flex: none;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-full);
  background-color: var(--surface-raised);
  transition: border-width var(--dur-fast) var(--ease-standard);
}

/* A thick ring, not a filled dot, so the selected state survives forced-colours mode. */
.sw-radio[data-selected] .sw-radio-dot {
  border: 6px solid var(--accent);
}

.sw-radio[data-invalid] .sw-radio-dot {
  border-color: var(--danger);
}

.sw-radio[data-disabled] .sw-radio-dot {
  border-color: var(--border);
  background-color: var(--surface-subtle);
}

.sw-radio[data-focus-visible] .sw-radio-dot {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: var(--focus-offset);
}
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/forms.test.tsx` (add `import { Radio, RadioGroup } from "../src/forms/RadioGroup";`):

```tsx
describe("RadioGroup", () => {
  it("is a labelled group of radios with single selection", async () => {
    const user = userEvent.setup();
    let picked = "";
    render(
      <RadioGroup label="Theme" description="Applies to every page." onChange={(v) => (picked = v)}>
        <Radio value="alpine">Alpine</Radio>
        <Radio value="zurich">Zürich</Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    expect(group).toHaveClass("sw-field", "sw-radio-group");
    expect(group).toHaveAccessibleDescription("Applies to every page.");
    await user.click(screen.getByText("Zürich"));
    expect(screen.getByRole("radio", { name: "Zürich" })).toBeChecked();
    expect(picked).toBe("zurich");
  });

  it("exposes orientation for horizontal layouts", () => {
    render(
      <RadioGroup label="Size" orientation="horizontal">
        <Radio value="s">S</Radio>
        <Radio value="m">M</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("shows an error when invalid", () => {
    render(
      <RadioGroup label="Plan" isInvalid errorMessage="Choose a plan.">
        <Radio value="a">A</Radio>
      </RadioGroup>,
    );
    expect(screen.getByText("Choose a plan.")).toHaveClass("sw-field-error");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <RadioGroup label="Theme" defaultValue="alpine">
        <Radio value="alpine">Alpine</Radio>
        <Radio value="zurich">Zürich</Radio>
      </RadioGroup>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the components**

`packages/react/src/forms/RadioGroup.tsx`:

```tsx
import type { ReactNode, RefAttributes } from "react";
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type RadioGroupProps = Omit<AriaRadioGroupProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
    children: ReactNode;
  };

export function RadioGroup({ label, description, errorMessage, className, children, ...rest }: RadioGroupProps) {
  return (
    <AriaRadioGroup className={cx("sw-field sw-radio-group", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <div className="sw-radio-list">{children}</div>
      <FieldError>{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}

export type RadioProps = Omit<AriaRadioProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

export function Radio({ className, children, ...rest }: RadioProps) {
  return (
    <AriaRadio className={cx("sw-radio", className)} {...rest}>
      <span className="sw-radio-dot" aria-hidden="true" />
      {children}
    </AriaRadio>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add RadioGroup and Radio on React Aria"
```

---

### Task 5: Select and SelectItem

**Files:**
- Create: `packages/css/src/components/select.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/forms/Select.tsx`
- Test: `packages/react/test/forms.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("select", () => {
  it("lays the trigger out as value plus chevron", () => {
    const r = rule(".sw-select-trigger");
    expect(r).toMatch(/display:\s*flex/);
    expect(r).toMatch(/justify-content:\s*space-between/);
  });

  it("mutes the placeholder value", () => {
    expect(rule(".sw-select-value[data-placeholder]")).toMatch(/color:\s*var\(--text-muted\)/);
  });

  it("floats the popover with the single overlay shadow at the trigger's width", () => {
    const r = rule(".sw-popover");
    expect(r).toMatch(/box-shadow:\s*var\(--shadow-overlay\)/);
    expect(r).toMatch(/min-inline-size:\s*var\(--trigger-width\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
  });

  it("highlights focused options on the subtle surface", () => {
    expect(rule(".sw-listbox-item[data-focused]")).toMatch(/background-color:\s*var\(--surface-subtle\)/);
    expect(rule(".sw-listbox-item")).toMatch(/min-block-size:\s*var\(--control-height\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/select.css`:

```css
.sw-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  text-align: start;
  cursor: pointer;
}

.sw-select-trigger svg {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  color: var(--text-secondary);
  stroke-width: 1.5;
}

.sw-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sw-select-value[data-placeholder] {
  color: var(--text-muted);
}

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

.sw-listbox {
  display: grid;
  outline: none;
}

.sw-listbox-item {
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

.sw-listbox-item[data-focused] {
  background-color: var(--surface-subtle);
}

.sw-listbox-item[data-focus-visible] {
  outline: var(--focus-width) solid var(--accent);
  outline-offset: calc(-1 * var(--focus-width));
}

/* Selected: weight plus a check icon, never colour alone. */
.sw-listbox-item[data-selected] {
  font-weight: 500;
}

.sw-listbox-item svg {
  flex: none;
  inline-size: 1rem;
  block-size: 1rem;
  stroke-width: 1.5;
}

.sw-listbox-item[data-disabled] {
  color: var(--text-muted);
  cursor: not-allowed;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/select.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/forms.test.tsx` (add `import { Select, SelectItem } from "../src/forms/Select";`):

```tsx
describe("Select", () => {
  const options = (
    <>
      <SelectItem id="alpine">Alpine</SelectItem>
      <SelectItem id="zurich">Zürich</SelectItem>
    </>
  );

  it("labels the trigger and shows the placeholder", () => {
    render(
      <Select label="Theme" placeholder="Choose a theme">
        {options}
      </Select>,
    );
    const trigger = screen.getByRole("button", { name: /Theme/ });
    expect(trigger).toHaveClass("sw-input", "sw-select-trigger");
    expect(screen.getByText("Choose a theme")).toHaveAttribute("data-placeholder");
  });

  it("opens a listbox and selects an option", async () => {
    const user = userEvent.setup();
    let picked: unknown = null;
    render(
      <Select label="Theme" onChange={(key) => (picked = key)}>
        {options}
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toHaveClass("sw-listbox");
    await user.click(screen.getByRole("option", { name: "Zürich" }));
    expect(picked).toBe("zurich");
    expect(screen.getByRole("button", { name: /Zürich/ })).toBeInTheDocument();
  });

  it("shows a check on the selected option", async () => {
    const user = userEvent.setup();
    render(
      <Select label="Theme" defaultValue="alpine">
        {options}
      </Select>,
    );
    await user.click(screen.getByRole("button", { name: /Theme/ }));
    const selected = await screen.findByRole("option", { name: "Alpine" });
    expect(selected).toHaveClass("sw-listbox-item");
    expect(selected.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations when closed", async () => {
    const { container } = render(
      <Select label="Theme" description="Applies everywhere">
        {options}
      </Select>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — unresolved import.

- [ ] **Step 4: Write the components**

`packages/react/src/forms/Select.tsx`:

```tsx
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type SelectProps<T extends object> = Omit<AriaSelectProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
    /** Optional data for dynamic options; pass a render function as children. */
    items?: Iterable<T>;
    children: ReactNode | ((item: T) => ReactNode);
  };

/**
 * Single-select dropdown. The list opens in a popover portalled to document.body,
 * so it uses the root theme (a theme-aware portal arrives with Plan 3 overlays).
 */
export function Select<T extends object>({
  label,
  description,
  errorMessage,
  className,
  items,
  children,
  ...rest
}: SelectProps<T>) {
  return (
    <AriaSelect className={cx("sw-field sw-select", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <AriaButton className="sw-input sw-select-trigger">
        <SelectValue className="sw-select-value" />
        <ChevronDown aria-hidden="true" />
      </AriaButton>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover">
        <ListBox className="sw-listbox" items={items}>
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export type SelectItemProps = Omit<ListBoxItemProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
  };

export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  return (
    <ListBoxItem
      className={cx("sw-listbox-item", className)}
      textValue={typeof children === "string" ? children : undefined}
      {...rest}
    >
      {({ isSelected }) => (
        <>
          {children}
          {isSelected && <Check aria-hidden="true" />}
        </>
      )}
    </ListBoxItem>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

Known risks, with the allowed adjustments:
- **Selection props:** if the types reject `defaultValue` / `onChange` on Select, use `defaultSelectedKey` / `onSelectionChange` in the tests and report it.
- **Opening the popover in jsdom:** if the popover does not open with `user.click`, try `user.keyboard("{ArrowDown}")` with the trigger focused. If it still does not open, keep the closed-state tests, mark the open and select tests `it.todo` with a one-line reason, and report it. Plan 4's Playwright tests will cover them in a real browser.
- **Do not:** add a `role` to the trigger, or otherwise change the component's markup to make a test pass.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Select and SelectItem on React Aria"
```

---

### Task 6: Exports, playground forms section, and verification

**Files:**
- Modify: `packages/react/src/index.ts`, `packages/react/test/exports.test.ts`, `packages/css/playground/index.html`

- [ ] **Step 1: Extend the exports test (failing)**

In `packages/react/test/exports.test.ts`, add these names to the `expected` array:

```ts
      "FieldLabel", "FieldDescription", "FieldError",
      "TextField", "TextArea", "Checkbox", "Switch", "RadioGroup", "Radio", "Select", "SelectItem",
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `FieldLabel` is not exported.

- [ ] **Step 2: Add the exports**

Append to `packages/react/src/index.ts`:

```ts
export { Checkbox, type CheckboxProps } from "./forms/Checkbox";
export {
  FieldDescription,
  type FieldDescriptionProps,
  FieldError,
  type FieldErrorProps,
  FieldLabel,
  type FieldLabelProps,
} from "./forms/FieldParts";
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from "./forms/RadioGroup";
export { Select, SelectItem, type SelectItemProps, type SelectProps } from "./forms/Select";
export { Switch, type SwitchProps } from "./forms/Switch";
export { TextArea, type TextAreaProps, TextField, type TextFieldProps } from "./forms/TextField";
```

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build`
Expected: PASS, and `dist/forms/` exists.

- [ ] **Step 3: Add the forms section to the playground**

In `packages/css/playground/index.html`, inside the `data-layout="hanging"` grid, insert this pair right after the `05 / Components` content element and before the grid's closing `</div>`. The markup approximates what the React components render. Hidden native inputs are left out because the playground is a CSS check only.

```html
        <p class="sw-type-label sw-text-secondary">06 / Forms</p>
        <div class="sw-stack" data-gap="6" style="max-inline-size: 28rem">
          <div class="sw-field">
            <label class="sw-field-label" for="pg-email">Email</label>
            <input class="sw-input" id="pg-email" placeholder="name@company.com" aria-describedby="pg-email-d" />
            <span class="sw-field-description" id="pg-email-d">We never share it.</span>
          </div>
          <div class="sw-field">
            <label class="sw-field-label" for="pg-name">Name</label>
            <input class="sw-input" id="pg-name" aria-invalid="true" aria-describedby="pg-name-e" />
            <span class="sw-field-error" id="pg-name-e">Enter your name.</span>
          </div>
          <div class="sw-field">
            <label class="sw-field-label" for="pg-msg">Message</label>
            <textarea class="sw-input sw-textarea" id="pg-msg"></textarea>
          </div>
          <label class="sw-checkbox" data-selected>
            <span class="sw-checkbox-box" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5" /></svg></span>
            Remember me
          </label>
          <label class="sw-checkbox">
            <span class="sw-checkbox-box" aria-hidden="true"></span>
            Send updates
          </label>
          <label class="sw-switch" data-selected>
            <span class="sw-switch-track" aria-hidden="true"><span class="sw-switch-thumb"></span></span>
            Notifications
          </label>
          <label class="sw-switch">
            <span class="sw-switch-track" aria-hidden="true"><span class="sw-switch-thumb"></span></span>
            Autosave
          </label>
          <div class="sw-field sw-radio-group" role="radiogroup" aria-labelledby="pg-theme">
            <span class="sw-field-label" id="pg-theme">Theme</span>
            <div class="sw-radio-list">
              <label class="sw-radio" data-selected><span class="sw-radio-dot" aria-hidden="true"></span>Alpine</label>
              <label class="sw-radio"><span class="sw-radio-dot" aria-hidden="true"></span>Zürich</label>
            </div>
          </div>
          <div class="sw-field">
            <span class="sw-field-label">Density</span>
            <button type="button" class="sw-input sw-select-trigger">
              <span class="sw-select-value">Comfortable</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <div class="sw-popover" style="--trigger-width: 100%">
              <div class="sw-listbox" role="listbox" aria-label="Density">
                <div class="sw-listbox-item" role="option" aria-selected="false">Compact</div>
                <div class="sw-listbox-item" role="option" aria-selected="true" data-selected data-focused>Comfortable
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Run every gate**

Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`
Expected: all succeed.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css/playground
git commit -m "feat(react): export form components; add forms to playground"
```

- [ ] **Step 6: Browser check**

This step is for whoever has a browser. Serve `packages/css` and open `/playground/`. In Alpine and Zürich, light and dark, check:
- **Inputs:** they are 40px tall. The invalid input has a red border with a 4px leading edge.
- **Checkbox and radio:** the selected checkbox is filled with the accent and shows a check. The selected radio is a thick accent ring.
- **Switch:** the switch thumb sits at the inline end when on, and mirrors under `dir="rtl"`.
- **Select:** the popover has the overlay shadow and a check beside the selected option.
- **Focus:** pressing Tab shows focus rings on the inputs.

---

## Spec coverage for this plan

| Spec item | Covered by |
|---|---|
| §6 forms group: Field (label, description, error, aria-describedby), TextField, TextArea, Select, Checkbox, RadioGroup, Switch | Tasks 2–5 |
| §6 React Aria for Select, Checkbox, RadioGroup, Switch | Tasks 3–5 |
| §6 40px controls, 44px targets | Tasks 2 (inputs), 3–4 (label targets), 5 (trigger, options) |
| §8 state never by colour alone | Invalid input edge (2), check / dash icons (3), radio ring (4), selected-option check + weight (5) |
| §8 RTL, reduced motion, forced colours | Switch mirroring and reduced motion (3), radio ring (4) |
| §11 Button wraps React Aria | Task 1 |

**Deferred:**
- **Theme-aware overlay portal:** Plan 3.
- **Real-browser interaction and visual tests:** Plan 4.
