# Raster Plan 2a: React Package and Static Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@raster/react` and ship 17 static components across `@raster/css` (styles) and `@raster/react` (thin wrappers), each tested for behaviour and structural accessibility:
- **Layout:** Container, Section, Stack, Grid, Col, Rule
- **Type:** Heading, Text, Label, Figure
- **Actions:** Button, IconButton, Link
- **Display:** Card, Tag, Callout, Table

**Architecture:** All styling lives in `packages/css/src/components/*.css`, imported into the `raster.components` layer. React components render the CSS class contract only: an `sw-` class, data attributes for variants, and CSS custom properties for spans. They forward `ref` (React 19 ref-as-prop), merge `className`, and layout primitives accept `as`. React is compiled with `tsc` to ESM plus type declarations, to be consumed through a bundler. Tests run in Vitest with jsdom and Testing Library. A small axe-core helper checks structural accessibility; colour contrast is already enforced by the token build.

**Tech Stack:** React 19.1, TypeScript 5.9, Vitest 3.2 + jsdom 26, @testing-library/react 16 + jest-dom 6, axe-core 4.14, lucide-react 1.68.

**Spec:** `docs/superpowers/specs/2026-11-04-raster-design-system-design.md` (sections 6, 8, 10)

**Builds on Plan 1 (merged):**
- `@raster/tokens` emits the role tokens (`--accent`, `--on-accent`, `--surface-subtle`, `--*-subtle`, `--on-*-subtle`, `--border-strong`, `--radius`, `--radius-full`, `--control-height`, `--target-min`, `--dur-fast`, `--ease-standard`, `--space-1…9`, `--text-*-size|weight|tracking|leading`, `--font-mono`).
- `@raster/css` provides layers, base styles, layout classes (`.sw-container`, `.sw-section`, `.sw-stack[data-gap|data-direction]`, `.sw-grid[data-layout|data-grid-rules|data-grid-debug]`, `.sw-col` with `--span-N`/`--start-N`, `.sw-rule[data-variant]`) and utilities (`.sw-type-*`, `.sw-text-secondary|muted`, `.sw-measure`, `.sw-mono`, `.sw-sr-only`).
- `buildCss()` in `packages/css/build.mjs` returns the bundle string.

**Lightning CSS output quirks** (seen in Plan 1). Write CSS tests tolerant of these:
- It may drop attribute quotes (`[data-tone=danger]`).
- It rewrites `0ms` to `0s`.
- It rewrites `:nth-child(even)` to `2n`.
- It reorders declarations inside a rule.
- It lowercases and shortens hex values.

**Base-style caveat** (from the Plan 1 review): `p`, `li` and headings get an absolute rounded `line-height`. Any component that changes `font-size` must set its own `line-height`.

## Plan series

1. Tokens and CSS foundations (done).
2. **Plan 2a (this plan):** React package and static components.
3. **Plan 2b:** Form components on React Aria (Field, TextField, TextArea, Select, Checkbox, RadioGroup, Switch).
4. **Plan 3:** Overlays and navigation (Dialog, Menu, Tooltip, Toast, Tabs, Header, Breadcrumbs), plus the expressive motion tier.
5. **Plan 4:** Docs site and Playwright quality gates.

---

## File structure

```
packages/css/src/components/
  figure.css  button.css  link.css  card.css  tag.css  callout.css  table.css
packages/css/src/index.css                 + one @import per component into raster.components
packages/css/test/components.test.ts       bundle assertions per component

packages/react/
  package.json, tsconfig.json, tsconfig.build.json, vitest.config.ts
  src/index.ts                             public exports
  src/utils/cx.ts                          class-name joiner
  src/utils/polymorphic.ts                 PolymorphicProps type
  src/utils/types.ts                       SpaceStep, CSSVars
  src/layout/Container.tsx Section.tsx Stack.tsx Grid.tsx Col.tsx Rule.tsx
  src/type/Heading.tsx Text.tsx Label.tsx Figure.tsx
  src/actions/Button.tsx IconButton.tsx Link.tsx
  src/display/Card.tsx Tag.tsx Callout.tsx Table.tsx
  test/setup.ts                            jest-dom matchers + cleanup
  test/axe.ts                              expectAccessible() helper
  test/utils.test.ts layout.test.tsx type.test.tsx actions.test.tsx display.test.tsx exports.test.ts
packages/css/playground/index.html         + "05 / Components" section
```

---

### Task 1: React package scaffold

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/tsconfig.build.json`, `packages/react/vitest.config.ts`, `packages/react/test/setup.ts`, `packages/react/test/axe.ts`, `packages/react/src/utils/cx.ts`, `packages/react/src/utils/polymorphic.ts`, `packages/react/src/utils/types.ts`
- Test: `packages/react/test/utils.test.ts`

- [ ] **Step 1: Create package files**

`packages/react/package.json`:

```json
{
  "name": "@raster/react",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "lucide-react": "1.68.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.10.0",
    "@testing-library/react": "16.3.3",
    "@types/node": "^22.0.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "axe-core": "4.14.0",
    "jsdom": "26.1.0",
    "react": "19.1.10",
    "react-dom": "19.1.10",
    "typescript": "5.9.3",
    "vitest": "3.2.7"
  }
}
```

`packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "test", "vitest.config.ts"]
}
```

`packages/react/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/react/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
```

`packages/react/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

`packages/react/test/axe.ts`:

```ts
import axe from "axe-core";
import { expect } from "vitest";

/**
 * Structural accessibility check (roles, names, ARIA validity) in jsdom.
 * Colour contrast is enforced by the token build and re-checked in real browsers in Plan 4;
 * the landmark "region" rule only makes sense for whole pages.
 */
export async function expectAccessible(container: Element): Promise<void> {
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  expect(result.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}
```

Run: `pnpm install`
Expected: installs with no errors.

- [ ] **Step 2: Write the failing test**

`packages/react/test/utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cx } from "../src/utils/cx";

describe("cx", () => {
  it("joins truthy class names with single spaces", () => {
    expect(cx("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cx()).toBe("");
    expect(cx(false, undefined)).toBe("");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/utils/cx"`.

- [ ] **Step 4: Write the utilities**

`packages/react/src/utils/cx.ts`:

```ts
export type ClassValue = string | false | null | undefined;

/** Joins truthy class names: cx("a", cond && "b") → "a b". */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
```

`packages/react/src/utils/polymorphic.ts`:

```ts
import type { ComponentPropsWithRef, ElementType } from "react";

/**
 * Props for a component that renders `as` any element (default set by the component).
 * P holds the component's own props; they win over the element's props of the same name.
 */
export type PolymorphicProps<E extends ElementType, P = object> = P & {
  as?: E;
  className?: string;
} & Omit<ComponentPropsWithRef<E>, keyof P | "as" | "className">;
```

`packages/react/src/utils/types.ts`:

```ts
/** A step on the 4px-based spacing scale: --space-1 … --space-9. */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Inline CSS custom properties, e.g. { "--span-8": 4 }. */
export type CSSVars = Record<`--${string}`, string | number>;
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: 2 tests PASS; typecheck prints nothing.

- [ ] **Step 6: Commit**

```bash
git add packages/react pnpm-lock.yaml
git commit -m "feat(react): scaffold @raster/react with test and a11y helpers"
```

---

### Task 2: Layout components

**Files:**
- Create: `packages/react/src/layout/Container.tsx`, `Section.tsx`, `Stack.tsx`, `Grid.tsx`, `Col.tsx`, `Rule.tsx`
- Test: `packages/react/test/layout.test.tsx`

These render the Plan 1 layout classes. No CSS changes.

- [ ] **Step 1: Write the failing tests**

`packages/react/test/layout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Col } from "../src/layout/Col";
import { Container } from "../src/layout/Container";
import { Grid } from "../src/layout/Grid";
import { Rule } from "../src/layout/Rule";
import { Section } from "../src/layout/Section";
import { Stack } from "../src/layout/Stack";
import { expectAccessible } from "./axe";

describe("Container", () => {
  it("renders a div with the container class and merges className", () => {
    render(<Container className="extra" data-testid="c" />);
    const el = screen.getByTestId("c");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("sw-container", "extra");
  });

  it("renders as another element and forwards its ref", () => {
    const ref = createRef<HTMLElement>();
    render(<Container as="main" ref={ref} data-testid="c" />);
    expect(screen.getByTestId("c").tagName).toBe("MAIN");
    expect(ref.current).toBe(screen.getByTestId("c"));
  });
});

describe("Section", () => {
  it("renders a section with the section class", () => {
    render(<Section data-testid="s" />);
    expect(screen.getByTestId("s").tagName).toBe("SECTION");
    expect(screen.getByTestId("s")).toHaveClass("sw-section");
  });
});

describe("Stack", () => {
  it("sets gap and direction as data attributes", () => {
    render(<Stack gap={6} direction="row" data-testid="s" />);
    const el = screen.getByTestId("s");
    expect(el).toHaveClass("sw-stack");
    expect(el).toHaveAttribute("data-gap", "6");
    expect(el).toHaveAttribute("data-direction", "row");
  });

  it("omits data attributes for the defaults", () => {
    render(<Stack data-testid="s" />);
    expect(screen.getByTestId("s")).not.toHaveAttribute("data-gap");
    expect(screen.getByTestId("s")).not.toHaveAttribute("data-direction");
  });
});

describe("Grid", () => {
  it("maps layout, rules, debug and row gap onto the CSS contract", () => {
    render(<Grid layout="hanging" rules debug rowGap={3} data-testid="g" />);
    const el = screen.getByTestId("g");
    expect(el).toHaveClass("sw-grid");
    expect(el).toHaveAttribute("data-layout", "hanging");
    expect(el).toHaveAttribute("data-grid-rules");
    expect(el).toHaveAttribute("data-grid-debug");
    expect(el.style.getPropertyValue("--grid-row-gap")).toBe("var(--space-3)");
  });

  it("renders no optional attributes by default", () => {
    render(<Grid data-testid="g" />);
    const el = screen.getByTestId("g");
    expect(el).not.toHaveAttribute("data-layout");
    expect(el).not.toHaveAttribute("data-grid-rules");
    expect(el.getAttribute("style")).toBeNull();
  });
});

describe("Col", () => {
  it("writes spans and starts per column count as custom properties", () => {
    render(<Col span={{ 8: 4, 12: 6 }} start={{ 12: 2 }} style={{ color: "inherit" }} data-testid="c" />);
    const el = screen.getByTestId("c");
    expect(el).toHaveClass("sw-col");
    expect(el.style.getPropertyValue("--span-8")).toBe("4");
    expect(el.style.getPropertyValue("--span-12")).toBe("6");
    expect(el.style.getPropertyValue("--start-12")).toBe("2");
    expect(el.style.getPropertyValue("--span-4")).toBe("");
    expect(el.style.color).toBe("inherit");
  });

  it("renders no style attribute without spans", () => {
    render(<Col data-testid="c" />);
    expect(screen.getByTestId("c").getAttribute("style")).toBeNull();
  });
});

describe("Rule", () => {
  it("renders a separator, with a data-variant only for non-default variants", () => {
    render(
      <>
        <Rule data-testid="a" />
        <Rule variant="signal" data-testid="b" />
      </>,
    );
    expect(screen.getAllByRole("separator")).toHaveLength(2);
    expect(screen.getByTestId("a")).toHaveClass("sw-rule");
    expect(screen.getByTestId("a")).not.toHaveAttribute("data-variant");
    expect(screen.getByTestId("b")).toHaveAttribute("data-variant", "signal");
  });
});

describe("layout accessibility", () => {
  it("has no structural violations when composed", async () => {
    const { container } = render(
      <Container as="main">
        <Section>
          <Grid layout="hanging">
            <p>Label</p>
            <Stack gap={4}>
              <p>Content</p>
              <Rule />
            </Stack>
          </Grid>
        </Section>
      </Container>,
    );
    await expectAccessible(container);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/layout/Col"`.

- [ ] **Step 3: Write the components**

`packages/react/src/layout/Container.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type ContainerProps<E extends ElementType = "div"> = PolymorphicProps<E>;

/** Centred, max-width wrapper with fluid page margins; a size container for grids inside it. */
export function Container<E extends ElementType = "div">({ as, className, ...rest }: ContainerProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-container", className)} {...rest} />;
}
```

`packages/react/src/layout/Section.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type SectionProps<E extends ElementType = "section"> = PolymorphicProps<E>;

/** Vertical rhythm block; also a size container. */
export function Section<E extends ElementType = "section">({ as, className, ...rest }: SectionProps<E>) {
  const Component: ElementType = as ?? "section";
  return <Component className={cx("sw-section", className)} {...rest} />;
}
```

`packages/react/src/layout/Stack.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { SpaceStep } from "../utils/types";

export type StackProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Spacing step between children; defaults to 4 (16px). */
    gap?: SpaceStep;
    direction?: "column" | "row";
  }
>;

export function Stack<E extends ElementType = "div">({ as, className, gap, direction, ...rest }: StackProps<E>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cx("sw-stack", className)}
      data-gap={gap}
      data-direction={direction === "row" ? "row" : undefined}
      {...rest}
    />
  );
}
```

`packages/react/src/layout/Grid.tsx`:

```tsx
import type { CSSProperties, ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { CSSVars, SpaceStep } from "../utils/types";

export type GridLayout = "hanging" | "split-5-7" | "split-1-2";

export type GridProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Swiss layout preset; children alternate narrow / wide and stack at 4 columns. */
    layout?: GridLayout;
    /** Draw a hairline at every column start. */
    rules?: boolean;
    /** Tint the columns (development aid). */
    debug?: boolean;
    rowGap?: SpaceStep;
    style?: CSSProperties;
  }
>;

/** 4 / 8 / 12-column fluid grid. Must sit inside a size container, never on one. */
export function Grid<E extends ElementType = "div">({
  as,
  className,
  layout,
  rules,
  debug,
  rowGap,
  style,
  ...rest
}: GridProps<E>) {
  const Component: ElementType = as ?? "div";
  const vars: CSSVars | undefined = rowGap ? { "--grid-row-gap": `var(--space-${rowGap})` } : undefined;
  const merged = vars || style ? ({ ...vars, ...style } as CSSProperties) : undefined;
  return (
    <Component
      className={cx("sw-grid", className)}
      data-layout={layout}
      data-grid-rules={rules ? "" : undefined}
      data-grid-debug={debug ? "" : undefined}
      style={merged}
      {...rest}
    />
  );
}
```

`packages/react/src/layout/Col.tsx`:

```tsx
import type { CSSProperties, ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { CSSVars } from "../utils/types";

export type ColumnCount = 4 | 8 | 12;

/** A value per grid column count, e.g. { 8: 4, 12: 6 }. Unset counts span the full width. */
export type PerColumnCount = Partial<Record<ColumnCount, number>>;

export type ColProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    span?: PerColumnCount;
    start?: PerColumnCount;
    style?: CSSProperties;
  }
>;

function toVars(prefix: "span" | "start", values: PerColumnCount | undefined): CSSVars {
  const vars: CSSVars = {};
  for (const [count, value] of Object.entries(values ?? {})) {
    if (value !== undefined) vars[`--${prefix}-${count}`] = String(value);
  }
  return vars;
}

export function Col<E extends ElementType = "div">({ as, className, span, start, style, ...rest }: ColProps<E>) {
  const Component: ElementType = as ?? "div";
  const vars = { ...toVars("span", span), ...toVars("start", start) };
  const merged = Object.keys(vars).length > 0 || style ? ({ ...vars, ...style } as CSSProperties) : undefined;
  return <Component className={cx("sw-col", className)} style={merged} {...rest} />;
}
```

`packages/react/src/layout/Rule.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type RuleProps = Omit<ComponentPropsWithRef<"hr">, "children"> & {
  variant?: "default" | "strong" | "signal";
};

export function Rule({ className, variant = "default", ...rest }: RuleProps) {
  return (
    <hr className={cx("sw-rule", className)} data-variant={variant === "default" ? undefined : variant} {...rest} />
  );
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS; typecheck prints nothing.

If `el.style.getPropertyValue("--span-8")` returns `""` even though React set it, jsdom's CSSStyleDeclaration is not storing custom properties. Check with `el.getAttribute("style")` (it should contain `--span-8: 4`). Switch the assertions to that attribute string. Do not change the component.

- [ ] **Step 5: Commit**

```bash
git add packages/react
git commit -m "feat(react): add layout components"
```

---

### Task 3: Type components and figure styles

**Files:**
- Create: `packages/css/src/components/figure.css`, `packages/css/test/components.test.ts`
- Modify: `packages/css/src/index.css`
- Create: `packages/react/src/type/Heading.tsx`, `Text.tsx`, `Label.tsx`, `Figure.tsx`
- Test: `packages/react/test/type.test.tsx`

- [ ] **Step 1: Write the failing CSS test**

`packages/css/test/components.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../build.mjs";

let css = "";
beforeAll(async () => {
  css = await buildCss();
});

/** The body of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/"/g, '"?');
  const match = css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

describe("components layer", () => {
  it("holds component styles", () => {
    expect(css).toMatch(/@layer raster\.components\s*\{[\s\S]*\.sw-figure/);
  });
});

describe("figure", () => {
  it("stacks media and caption with a token gap", () => {
    expect(rule(".sw-figure")).toMatch(/display:\s*grid/);
    expect(rule(".sw-figure")).toMatch(/gap:\s*var\(--space-3\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-figure` / components layer test fails.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/figure.css`:

```css
.sw-figure {
  display: grid;
  gap: var(--space-3);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/figure.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS, no lint output.

- [ ] **Step 3: Write the failing React tests**

`packages/react/test/type.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Figure } from "../src/type/Figure";
import { Heading } from "../src/type/Heading";
import { Label } from "../src/type/Label";
import { Text } from "../src/type/Text";
import { expectAccessible } from "./axe";

describe("Heading", () => {
  it("renders the level's element with the matching size by default", () => {
    render(<Heading level={2}>Columns</Heading>);
    const h = screen.getByRole("heading", { level: 2, name: "Columns" });
    expect(h.tagName).toBe("H2");
    expect(h).toHaveClass("sw-type-h2");
  });

  it("decouples visual size from semantic level", () => {
    render(<Heading level={2} size="h4">Small but level 2</Heading>);
    const h = screen.getByRole("heading", { level: 2 });
    expect(h).toHaveClass("sw-type-h4");
    expect(h).not.toHaveClass("sw-type-h2");
  });

  it("maps levels 5 and 6 to the h4 size", () => {
    render(<Heading level={6}>Deep</Heading>);
    expect(screen.getByRole("heading", { level: 6 })).toHaveClass("sw-type-h4");
  });
});

describe("Text", () => {
  it("renders a body paragraph by default", () => {
    render(<Text>Body</Text>);
    const p = screen.getByText("Body");
    expect(p.tagName).toBe("P");
    expect(p.className).toBe("sw-type-body");
  });

  it("applies size, tone, measure and mono", () => {
    render(
      <Text as="span" size="caption" tone="secondary" measure mono>
        Meta
      </Text>,
    );
    const el = screen.getByText("Meta");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("sw-type-caption", "sw-text-secondary", "sw-measure", "sw-mono");
  });
});

describe("Label", () => {
  it("renders a mono label span", () => {
    render(<Label>01 / Grid</Label>);
    const el = screen.getByText("01 / Grid");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("sw-type-label");
  });
});

describe("Figure", () => {
  it("renders media followed by a secondary caption", () => {
    render(
      <Figure caption="Figure 1 — Grid">
        <img src="grid.png" alt="A 12-column grid" />
      </Figure>,
    );
    const caption = screen.getByText("Figure 1 — Grid");
    expect(caption.tagName).toBe("FIGCAPTION");
    expect(caption).toHaveClass("sw-type-caption", "sw-text-secondary");
    expect(caption.closest("figure")).toHaveClass("sw-figure");
    expect(caption.previousElementSibling?.tagName).toBe("IMG");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <article>
        <Heading level={1}>Title</Heading>
        <Text>Body</Text>
        <Figure caption="Caption">
          <img src="a.png" alt="Alt text" />
        </Figure>
      </article>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/type/Figure"`.

- [ ] **Step 4: Write the components**

`packages/react/src/type/Heading.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";

export type HeadingProps = ComponentPropsWithRef<"h1"> & {
  /** Semantic level: sets the element (h1–h6) and the document outline. */
  level: HeadingLevel;
  /** Visual size; defaults to the level's own size (5 and 6 use h4). */
  size?: HeadingSize;
};

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h4", 6: "h4" };

export function Heading({ level, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cx(`sw-type-${size ?? DEFAULT_SIZE[level]}`, className)} {...rest} />;
}
```

`packages/react/src/type/Text.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type TextProps<E extends ElementType = "p"> = PolymorphicProps<
  E,
  {
    size?: "body" | "caption";
    tone?: "primary" | "secondary" | "muted";
    /** Cap the line length at 66 characters. */
    measure?: boolean;
    /** Set in Geist Mono, e.g. for figures. */
    mono?: boolean;
  }
>;

export function Text<E extends ElementType = "p">({
  as,
  className,
  size = "body",
  tone = "primary",
  measure,
  mono,
  ...rest
}: TextProps<E>) {
  const Component: ElementType = as ?? "p";
  return (
    <Component
      className={cx(
        `sw-type-${size}`,
        tone !== "primary" && `sw-text-${tone}`,
        measure && "sw-measure",
        mono && "sw-mono",
        className,
      )}
      {...rest}
    />
  );
}
```

`packages/react/src/type/Label.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type LabelProps<E extends ElementType = "span"> = PolymorphicProps<E>;

/** Uppercase Geist Mono label for annotations such as "01 / Grid". Not a form label. */
export function Label<E extends ElementType = "span">({ as, className, ...rest }: LabelProps<E>) {
  const Component: ElementType = as ?? "span";
  return <Component className={cx("sw-type-label", className)} {...rest} />;
}
```

`packages/react/src/type/Figure.tsx`:

```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type FigureProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  caption: ReactNode;
  children: ReactNode;
};

export function Figure({ caption, children, className, ...rest }: FigureProps) {
  return (
    <figure className={cx("sw-figure", className)} {...rest}>
      {children}
      <figcaption className="sw-type-caption sw-text-secondary">{caption}</figcaption>
    </figure>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add type components and figure styles"
```

---

### Task 4: Button and IconButton

**Files:**
- Create: `packages/css/src/components/button.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/actions/Button.tsx`, `packages/react/src/actions/IconButton.tsx`
- Test: `packages/react/test/actions.test.tsx`

Visual rules (spec section 6):
- **Secondary (default):** a `border-strong` outline.
- **Primary:** an accent fill.
- **Ghost:** text only.
- **Danger:** a danger fill.
- **Size:** 40px tall, with a 44px hit area.
- **Weight:** 500.
- **Disabled:** stays legible (muted text on the subtle surface) and is never dimmed with opacity.

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("button", () => {
  it("is a 40px control with a token border and radius", () => {
    const r = rule(".sw-button");
    expect(r).toMatch(/min-block-size:\s*var\(--control-height\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border-strong\)/);
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).toMatch(/font-weight:\s*500/);
  });

  it("extends the hit area to the touch target", () => {
    // Lightning CSS may print ::before as :before.
    expect(css).toMatch(
      /\.sw-button::?before\s*\{[^}]*inset-block:\s*calc\(\(var\(--control-height\) - var\(--target-min\)\) \/ 2\)/,
    );
  });

  it("styles primary, ghost and danger variants from role tokens", () => {
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/background-color:\s*var\(--accent\)/);
    expect(rule('.sw-button[data-variant="primary"]')).toMatch(/color:\s*var\(--on-accent\)/);
    expect(rule('.sw-button[data-variant="ghost"]')).toMatch(/border-color:\s*transparent/);
    expect(rule('.sw-button[data-variant="danger"]')).toMatch(/background-color:\s*var\(--danger\)/);
  });

  it("keeps disabled buttons legible without opacity", () => {
    expect(css).toMatch(/\.sw-button:is\(:disabled,\s*\[aria-disabled="?true"?\]\)\s*\{[^}]*color:\s*var\(--text-muted\)/);
    expect(css).not.toMatch(/\.sw-button[^{]*\{[^}]*opacity/);
  });

  it("makes icon buttons square", () => {
    expect(rule(".sw-icon-button")).toMatch(/inline-size:\s*var\(--control-height\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-button`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/button.css`:

```css
.sw-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-block-size: var(--control-height);
  padding-block: 0;
  padding-inline: var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background-color: transparent;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-body-size);
  font-weight: 500;
  line-height: 1.25;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition-property: background-color, border-color, color;
  transition-duration: var(--dur-fast);
  transition-timing-function: var(--ease-standard);
}

/* Extend the hit area to the 44px touch target without changing the 40px visual height. */
.sw-button::before {
  content: "";
  position: absolute;
  inset-block: calc((var(--control-height) - var(--target-min)) / 2);
  inset-inline: 0;
}

.sw-button:hover {
  background-color: var(--surface-subtle);
}

.sw-button[data-variant="primary"] {
  border-color: var(--accent);
  background-color: var(--accent);
  color: var(--on-accent);
}

.sw-button[data-variant="primary"]:hover {
  background-color: color-mix(in srgb, var(--accent) 85%, var(--text-primary));
}

.sw-button[data-variant="ghost"] {
  border-color: transparent;
}

.sw-button[data-variant="danger"] {
  border-color: var(--danger);
  background-color: var(--danger);
  color: var(--on-danger);
}

.sw-button[data-variant="danger"]:hover {
  background-color: color-mix(in srgb, var(--danger) 85%, var(--text-primary));
}

.sw-button:is(:disabled, [aria-disabled="true"]) {
  border-color: var(--border);
  background-color: var(--surface-subtle);
  color: var(--text-muted);
  cursor: not-allowed;
}

.sw-button svg {
  flex: none;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  stroke-width: 1.5;
}

.sw-icon-button {
  inline-size: var(--control-height);
  padding-inline: 0;
}

.sw-icon-button::before {
  inset-inline: calc((var(--control-height) - var(--target-min)) / 2);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/button.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

`packages/react/test/actions.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { X } from "lucide-react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/actions/Button";
import { IconButton } from "../src/actions/IconButton";
import { expectAccessible } from "./axe";

describe("Button", () => {
  it("is a non-submitting secondary button by default", () => {
    render(<Button>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toHaveAttribute("type", "button");
    expect(b).toHaveClass("sw-button");
    expect(b).toHaveAttribute("data-variant", "secondary");
  });

  it("applies the variant and allows submit", () => {
    render(
      <Button variant="primary" type="submit">
        Send
      </Button>,
    );
    const b = screen.getByRole("button", { name: "Send" });
    expect(b).toHaveAttribute("data-variant", "primary");
    expect(b).toHaveAttribute("type", "submit");
  });

  it("calls onClick, but not when disabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBe(screen.getByRole("button"));
  });
});

describe("IconButton", () => {
  it("is named by its label and hides the icon from assistive tech", () => {
    render(
      <IconButton label="Close">
        <X />
      </IconButton>,
    );
    const b = screen.getByRole("button", { name: "Close" });
    expect(b).toHaveClass("sw-button", "sw-icon-button");
    expect(b.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Save</Button>
        <IconButton label="Close" variant="ghost">
          <X />
        </IconButton>
      </div>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/actions/Button"`.

- [ ] **Step 4: Write the components**

`packages/react/src/actions/Button.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** Use "primary" at most once per view. Defaults to "secondary". */
  variant?: ButtonVariant;
};

export function Button({ variant = "secondary", type = "button", className, ...rest }: ButtonProps) {
  return <button type={type} className={cx("sw-button", className)} data-variant={variant} {...rest} />;
}
```

`packages/react/src/actions/IconButton.tsx`:

```tsx
import type { ReactElement } from "react";
import { cx } from "../utils/cx";
import { Button, type ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "children" | "aria-label"> & {
  /** Accessible name; required because the button has no visible text. */
  label: string;
  /** A single icon, e.g. a lucide-react icon (which is aria-hidden by default). */
  children: ReactElement;
};

export function IconButton({ label, children, className, ...rest }: IconButtonProps) {
  return (
    <Button aria-label={label} className={cx("sw-icon-button", className)} {...rest}>
      {children}
    </Button>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

If the IconButton test fails because lucide's `<X />` has no `aria-hidden`, pass `aria-hidden="true"` to the icon in the test. Also add a note to the IconButton JSDoc that callers must hide the icon. Do not clone children.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Button and IconButton"
```

---

### Task 5: Link

**Files:**
- Create: `packages/css/src/components/link.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/actions/Link.tsx`
- Test: `packages/react/test/actions.test.tsx` (append)

- [ ] **Step 1: Write the failing CSS test**

Append to `packages/css/test/components.test.ts`:

```ts
describe("link", () => {
  it("uses the accent colour with a thin underline that thickens on hover", () => {
    expect(rule(".sw-link")).toMatch(/color:\s*var\(--accent\)/);
    expect(rule(".sw-link")).toMatch(/text-decoration-thickness:\s*1px/);
    expect(rule(".sw-link:hover")).toMatch(/text-decoration-thickness:\s*2px/);
  });

  it("mirrors the external-link arrow in right-to-left text", () => {
    expect(css).toMatch(/\.sw-link svg:dir\(rtl\)\s*\{[^}]*scaleX\(-1\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-link`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/link.css`:

```css
.sw-link {
  color: var(--accent);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}

.sw-link:hover {
  text-decoration-thickness: 2px;
}

.sw-link svg {
  display: inline-block;
  inline-size: 0.875em;
  block-size: 0.875em;
  margin-inline-start: 0.125em;
  vertical-align: -0.1em;
  stroke-width: 1.5;
}

.sw-link svg:dir(rtl) {
  transform: scaleX(-1);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/link.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/actions.test.tsx` (add `import { Link } from "../src/actions/Link";` to the imports):

```tsx
describe("Link", () => {
  it("renders a plain link by default", () => {
    render(<Link href="/docs">Docs</Link>);
    const a = screen.getByRole("link", { name: "Docs" });
    expect(a).toHaveClass("sw-link");
    expect(a).not.toHaveAttribute("target");
  });

  it("opens external links in a new tab and says so to screen readers", () => {
    render(
      <Link href="https://example.com" external>
        Example
      </Link>,
    );
    const a = screen.getByRole("link", { name: "Example (opens in a new tab)" });
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(a.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <p>
        Read the <Link href="/docs">docs</Link> or <Link href="https://example.com" external>example</Link>.
      </p>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/actions/Link"`.

- [ ] **Step 4: Write the component**

`packages/react/src/actions/Link.tsx`:

```tsx
import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type LinkProps = ComponentPropsWithRef<"a"> & {
  /** Open in a new tab, show an arrow, and announce it to screen readers. */
  external?: boolean;
};

export function Link({ external, className, children, target, rel, ...rest }: LinkProps) {
  return (
    <a
      className={cx("sw-link", className)}
      target={external ? "_blank" : target}
      rel={external ? "noopener noreferrer" : rel}
      {...rest}
    >
      {children}
      {external && (
        <>
          <ArrowUpRight aria-hidden="true" strokeWidth={1.5} />
          <span className="sw-sr-only"> (opens in a new tab)</span>
        </>
      )}
    </a>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Link with accessible external variant"
```

---

### Task 6: Card and Tag

**Files:**
- Create: `packages/css/src/components/card.css`, `packages/css/src/components/tag.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/display/Card.tsx`, `packages/react/src/display/Tag.tsx`
- Test: `packages/react/test/display.test.tsx`

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("card", () => {
  it("is a flat raised surface with a hairline border and no shadow", () => {
    const r = rule(".sw-card");
    expect(r).toMatch(/background-color:\s*var\(--surface-raised\)/);
    expect(r).toMatch(/border:\s*1px solid var\(--border\)/);
    expect(r).toMatch(/border-radius:\s*var\(--radius\)/);
    expect(r).not.toMatch(/box-shadow/);
  });
});

describe("tag", () => {
  it("is a mono pill on the subtle surface", () => {
    const r = rule(".sw-tag");
    expect(r).toMatch(/border-radius:\s*var\(--radius-full\)/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(r).toMatch(/background-color:\s*var\(--surface-subtle\)/);
  });

  it("pairs each tone's tint with its text-on-tint role", () => {
    for (const tone of ["accent", "success", "warning", "danger"]) {
      const r = rule(`.sw-tag[data-tone="${tone}"]`);
      expect(r).toMatch(new RegExp(`background-color:\\s*var\\(--${tone}-subtle\\)`));
      expect(r).toMatch(new RegExp(`color:\\s*var\\(--on-${tone}-subtle\\)`));
    }
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-card`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/card.css`:

```css
.sw-card {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background-color: var(--surface-raised);
  color: var(--text-primary);
}
```

`packages/css/src/components/tag.css`:

```css
.sw-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-block-size: 1.5rem;
  padding-inline: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background-color: var(--surface-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Tinted tones keep a transparent border so the shape survives forced-colours mode. */
.sw-tag[data-tone="accent"] {
  border-color: transparent;
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

.sw-tag[data-tone="success"] {
  border-color: transparent;
  background-color: var(--success-subtle);
  color: var(--on-success-subtle);
}

.sw-tag[data-tone="warning"] {
  border-color: transparent;
  background-color: var(--warning-subtle);
  color: var(--on-warning-subtle);
}

.sw-tag[data-tone="danger"] {
  border-color: transparent;
  background-color: var(--danger-subtle);
  color: var(--on-danger-subtle);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/card.css" layer(raster.components);
@import "./components/tag.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

`packages/react/test/display.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../src/display/Card";
import { Tag } from "../src/display/Tag";
import { expectAccessible } from "./axe";

describe("Card", () => {
  it("renders a div card by default and an article when asked", () => {
    render(
      <>
        <Card data-testid="a">One</Card>
        <Card as="article" data-testid="b">
          Two
        </Card>
      </>,
    );
    expect(screen.getByTestId("a").tagName).toBe("DIV");
    expect(screen.getByTestId("a")).toHaveClass("sw-card");
    expect(screen.getByTestId("b").tagName).toBe("ARTICLE");
  });
});

describe("Tag", () => {
  it("renders a neutral tag without a tone attribute", () => {
    render(<Tag>Draft</Tag>);
    const t = screen.getByText("Draft");
    expect(t).toHaveClass("sw-tag");
    expect(t).not.toHaveAttribute("data-tone");
  });

  it("sets the tone", () => {
    render(<Tag tone="success">Live</Tag>);
    expect(screen.getByText("Live")).toHaveAttribute("data-tone", "success");
  });
});

describe("card and tag accessibility", () => {
  it("has no structural violations", async () => {
    const { container } = render(
      <Card as="article">
        <h2>Release</h2>
        <Tag tone="accent">New</Tag>
      </Card>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/display/Card"`.

- [ ] **Step 4: Write the components**

`packages/react/src/display/Card.tsx`:

```tsx
import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type CardProps<E extends ElementType = "div"> = PolymorphicProps<E>;

/** A flat raised surface separated by a hairline, never a shadow. */
export function Card<E extends ElementType = "div">({ as, className, ...rest }: CardProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-card", className)} {...rest} />;
}
```

`packages/react/src/display/Tag.tsx`:

```tsx
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type TagProps = ComponentPropsWithRef<"span"> & { tone?: TagTone };

export function Tag({ tone = "neutral", className, ...rest }: TagProps) {
  return <span className={cx("sw-tag", className)} data-tone={tone === "neutral" ? undefined : tone} {...rest} />;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Card and Tag"
```

---

### Task 7: Callout

**Files:**
- Create: `packages/css/src/components/callout.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/display/Callout.tsx`
- Test: `packages/react/test/display.test.tsx` (append)

Meaning must never rely on colour alone (spec section 8). Each tone therefore shows its own icon and starts with a visually hidden tone word ("Warning: …").

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("callout", () => {
  it("lays out icon and body in two columns on the accent tint by default", () => {
    const r = rule(".sw-callout");
    expect(r).toMatch(/grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    expect(r).toMatch(/background-color:\s*var\(--accent-subtle\)/);
    expect(r).toMatch(/color:\s*var\(--on-accent-subtle\)/);
  });

  it("maps success, warning and danger tones to their tints", () => {
    for (const tone of ["success", "warning", "danger"]) {
      expect(rule(`.sw-callout[data-tone="${tone}"]`)).toMatch(
        new RegExp(`background-color:\\s*var\\(--${tone}-subtle\\)`),
      );
    }
  });

  it("keeps links inside callouts in the callout's text colour", () => {
    expect(rule(".sw-callout a")).toMatch(/color:\s*inherit/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-callout`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/callout.css`:

```css
.sw-callout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
}

.sw-callout[data-tone="success"] {
  background-color: var(--success-subtle);
  color: var(--on-success-subtle);
}

.sw-callout[data-tone="warning"] {
  background-color: var(--warning-subtle);
  color: var(--on-warning-subtle);
}

.sw-callout[data-tone="danger"] {
  background-color: var(--danger-subtle);
  color: var(--on-danger-subtle);
}

.sw-callout > svg {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin-block-start: 0.125em;
  stroke-width: 1.5;
}

.sw-callout-title {
  font-weight: 500;
}

.sw-callout-body > * + * {
  margin-block-start: var(--space-2);
}

/* The accent link colour is not contrast-checked on status tints; underline carries the affordance. */
.sw-callout a {
  color: inherit;
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/callout.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/display.test.tsx` (add `import { Callout } from "../src/display/Callout";` to the imports):

```tsx
describe("Callout", () => {
  it("defaults to the info tone and announces it", () => {
    render(<Callout>Saved drafts sync every minute.</Callout>);
    const body = screen.getByText("Saved drafts sync every minute.").closest(".sw-callout");
    expect(body).toHaveAttribute("data-tone", "info");
    expect(screen.getByText("Note:")).toHaveClass("sw-sr-only");
  });

  it("renders a title, a tone word and a hidden icon per tone", () => {
    const { container } = render(
      <Callout tone="warning" title="Check your grid">
        <p>Grids must sit inside a container.</p>
      </Callout>,
    );
    expect(screen.getByText("Warning:")).toBeInTheDocument();
    expect(screen.getByText("Check your grid")).toHaveClass("sw-callout-title");
    expect(container.querySelector(".sw-callout > svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses a distinct icon for each tone", () => {
    const { container } = render(
      <>
        <Callout tone="info">a</Callout>
        <Callout tone="success">b</Callout>
        <Callout tone="warning">c</Callout>
        <Callout tone="danger">d</Callout>
      </>,
    );
    const icons = [...container.querySelectorAll(".sw-callout > svg")].map((svg) => svg.getAttribute("class"));
    expect(new Set(icons).size).toBe(4);
  });

  it("has no structural violations", async () => {
    const { container } = render(
      <Callout tone="danger" title="Build failed">
        <p>
          Contrast check failed. <a href="/colour">See colour rules</a>.
        </p>
      </Callout>,
    );
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/display/Callout"`.

- [ ] **Step 4: Write the component**

`packages/react/src/display/Callout.tsx`:

```tsx
import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type CalloutTone = "info" | "success" | "warning" | "danger";

export type CalloutProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: CalloutTone;
  title?: ReactNode;
};

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

/** Read before the content so tone never relies on colour or icon alone. */
const TONE_WORDS: Record<CalloutTone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  danger: "Error",
};

export function Callout({ tone = "info", title, children, className, ...rest }: CalloutProps) {
  const Icon = ICONS[tone];
  return (
    <div className={cx("sw-callout", className)} data-tone={tone} {...rest}>
      <Icon aria-hidden="true" strokeWidth={1.5} />
      <div className="sw-callout-body">
        <span className="sw-sr-only">{TONE_WORDS[tone]}:</span>
        {title && <p className="sw-callout-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

The "distinct icon" test relies on lucide adding a per-icon class (for example `lucide lucide-info`). If the classes don't differ, compare each icon's `innerHTML` instead.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Callout with tone icons and announced tone"
```

---

### Task 8: Table

**Files:**
- Create: `packages/css/src/components/table.css`
- Modify: `packages/css/src/index.css`, `packages/css/test/components.test.ts`
- Create: `packages/react/src/display/Table.tsx`
- Test: `packages/react/test/display.test.tsx` (append)

`Table` wraps a native `<table>`. Consumers write `thead`, `tbody`, `tr`, `th` and `td` themselves. A cell marked `data-numeric` is right-aligned in tabular Geist Mono. The wrapper is a named, focusable region, so a table too wide for the screen can still be scrolled by keyboard.

- [ ] **Step 1: Write the failing CSS tests**

Append to `packages/css/test/components.test.ts`:

```ts
describe("table", () => {
  it("scrolls horizontally inside its wrapper", () => {
    expect(rule(".sw-table-wrap")).toMatch(/overflow-x:\s*auto/);
  });

  it("separates rows with hairlines and puts a strong rule under the header", () => {
    expect(css).toMatch(/\.sw-table :is\(th, td\)\s*\{[^}]*border-block-end:\s*1px solid var\(--border\)/);
    expect(rule(".sw-table thead th")).toMatch(/border-block-end-color:\s*var\(--text-primary\)/);
  });

  it("sets numeric cells in tabular mono, end-aligned", () => {
    const r = rule(".sw-table [data-numeric]");
    expect(r).toMatch(/text-align:\s*end/);
    expect(r).toMatch(/font-variant-numeric:\s*tabular-nums/);
    expect(r).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it("stripes body rows on the subtle surface when asked", () => {
    expect(css).toMatch(/\.sw-table\[data-striped\] tbody tr:nth-child\((?:even|2n)\)\s*\{[^}]*var\(--surface-subtle\)/);
  });
});
```

Run: `pnpm --filter @raster/css test`
Expected: FAIL — `No rule for .sw-table-wrap`.

- [ ] **Step 2: Write the CSS**

`packages/css/src/components/table.css`:

```css
.sw-table-wrap {
  overflow-x: auto;
}

.sw-table {
  inline-size: 100%;
  font-size: var(--text-body-size);
  line-height: var(--text-body-leading);
}

.sw-table caption {
  padding-block-end: var(--space-3);
  caption-side: top;
  text-align: start;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: var(--text-label-size);
  letter-spacing: var(--text-label-tracking);
  line-height: var(--text-label-leading);
  text-transform: uppercase;
}

.sw-table :is(th, td) {
  padding-block: var(--space-3);
  padding-inline: var(--space-4);
  border-block-end: 1px solid var(--border);
  text-align: start;
  vertical-align: top;
}

.sw-table thead th {
  border-block-end-color: var(--text-primary);
  color: var(--text-secondary);
}

.sw-table [data-numeric] {
  text-align: end;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.sw-table[data-striped] tbody tr:nth-child(even) {
  background-color: var(--surface-subtle);
}
```

Append to `packages/css/src/index.css`:

```css
@import "./components/table.css" layer(raster.components);
```

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`
Expected: PASS.

- [ ] **Step 3: Write the failing React tests**

Append to `packages/react/test/display.test.tsx` (add `import { Table } from "../src/display/Table";` to the imports):

```tsx
describe("Table", () => {
  const rows = (
    <>
      <thead>
        <tr>
          <th scope="col">Quarter</th>
          <th scope="col" data-numeric>
            Revenue
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Q1</td>
          <td data-numeric>1,200</td>
        </tr>
      </tbody>
    </>
  );

  it("names both the table and its scrollable region from the caption", () => {
    render(<Table caption="Quarterly revenue">{rows}</Table>);
    expect(screen.getByRole("table", { name: "Quarterly revenue" })).toHaveClass("sw-table");
    const region = screen.getByRole("region", { name: "Quarterly revenue" });
    expect(region).toHaveClass("sw-table-wrap");
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("marks striped tables", () => {
    render(
      <Table caption="Striped" striped>
        {rows}
      </Table>,
    );
    expect(screen.getByRole("table")).toHaveAttribute("data-striped");
  });

  it("has no structural violations", async () => {
    const { container } = render(<Table caption="Quarterly revenue">{rows}</Table>);
    await expectAccessible(container);
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src/display/Table"`.

- [ ] **Step 4: Write the component**

`packages/react/src/display/Table.tsx`:

```tsx
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Required: names the table and its scroll region. */
  caption: ReactNode;
  striped?: boolean;
};

export function Table({ caption, striped, className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    <div className="sw-table-wrap" role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className={cx("sw-table", className)} data-striped={striped ? "" : undefined} {...rest}>
        <caption id={captionId}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css packages/react
git commit -m "feat: add Table with named scroll region and numeric cells"
```

---

### Task 9: Public exports, build, and playground section

**Files:**
- Create: `packages/react/src/index.ts`
- Test: `packages/react/test/exports.test.ts`
- Modify: `packages/css/playground/index.html`

- [ ] **Step 1: Write the failing test**

`packages/react/test/exports.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as raster from "../src";

describe("public API", () => {
  it("exports every Plan 2a component", () => {
    const expected = [
      "Container", "Section", "Stack", "Grid", "Col", "Rule",
      "Heading", "Text", "Label", "Figure",
      "Button", "IconButton", "Link",
      "Card", "Tag", "Callout", "Table",
      "cx",
    ];
    for (const name of expected) expect(typeof (raster as Record<string, unknown>)[name], name).toBe("function");
  });
});
```

Run: `pnpm --filter @raster/react test`
Expected: FAIL — `Failed to resolve import "../src"`.

- [ ] **Step 2: Write the index**

`packages/react/src/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant } from "./actions/Button";
export { IconButton, type IconButtonProps } from "./actions/IconButton";
export { Link, type LinkProps } from "./actions/Link";
export { Callout, type CalloutProps, type CalloutTone } from "./display/Callout";
export { Card, type CardProps } from "./display/Card";
export { Table, type TableProps } from "./display/Table";
export { Tag, type TagProps, type TagTone } from "./display/Tag";
export { Col, type ColProps, type ColumnCount, type PerColumnCount } from "./layout/Col";
export { Container, type ContainerProps } from "./layout/Container";
export { Grid, type GridLayout, type GridProps } from "./layout/Grid";
export { Rule, type RuleProps } from "./layout/Rule";
export { Section, type SectionProps } from "./layout/Section";
export { Stack, type StackProps } from "./layout/Stack";
export { Figure, type FigureProps } from "./type/Figure";
export { Heading, type HeadingLevel, type HeadingProps, type HeadingSize } from "./type/Heading";
export { Label, type LabelProps } from "./type/Label";
export { Text, type TextProps } from "./type/Text";
export { cx, type ClassValue } from "./utils/cx";
export type { PolymorphicProps } from "./utils/polymorphic";
export type { CSSVars, SpaceStep } from "./utils/types";
```

- [ ] **Step 3: Run tests, typecheck and build**

Run: `pnpm --filter @raster/react test && pnpm --filter @raster/react typecheck && pnpm --filter @raster/react build && ls packages/react/dist`
Expected: tests PASS; typecheck silent; `dist/` contains `index.js`, `index.d.ts` and the `actions/`, `display/`, `layout/`, `type/` and `utils/` folders.

- [ ] **Step 4: Add the components section to the playground**

In `packages/css/playground/index.html`, insert this block immediately after the `04 / Surfaces` row, inside the hanging grid and before its closing `</div>`. It must be a label `<p>` followed by one content element, so the hanging layout's odd/even pattern still holds. Its markup mirrors what the React components render.

```html
        <p class="sw-type-label sw-text-secondary">05 / Components</p>
        <div class="sw-stack" data-gap="6">
          <div class="sw-stack" data-direction="row" data-gap="3">
            <button type="button" class="sw-button" data-variant="primary">Primary</button>
            <button type="button" class="sw-button" data-variant="secondary">Secondary</button>
            <button type="button" class="sw-button" data-variant="ghost">Ghost</button>
            <button type="button" class="sw-button" data-variant="danger">Delete</button>
            <button type="button" class="sw-button" data-variant="secondary" disabled>Disabled</button>
            <button type="button" class="sw-button sw-icon-button" data-variant="secondary" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p>A <a class="sw-link" href="#">component link</a> inside running text.</p>
          <div class="sw-stack" data-direction="row" data-gap="2">
            <span class="sw-tag">Draft</span>
            <span class="sw-tag" data-tone="accent">New</span>
            <span class="sw-tag" data-tone="success">Live</span>
            <span class="sw-tag" data-tone="warning">Review</span>
            <span class="sw-tag" data-tone="danger">Blocked</span>
          </div>
          <div class="sw-callout" data-tone="warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
            <div class="sw-callout-body">
              <span class="sw-sr-only">Warning:</span>
              <p class="sw-callout-title">Check your grid</p>
              <p>Grids must sit inside a container, never on one.</p>
            </div>
          </div>
          <div class="sw-card">
            <figure class="sw-figure">
              <div style="block-size: 6rem; background: var(--surface-subtle)"></div>
              <figcaption class="sw-type-caption sw-text-secondary">Figure 05 — A card holding a figure</figcaption>
            </figure>
          </div>
          <div class="sw-table-wrap" role="region" aria-labelledby="pg-cap" tabindex="0">
            <table class="sw-table" data-striped>
              <caption id="pg-cap">Quarterly revenue</caption>
              <thead><tr><th scope="col">Quarter</th><th scope="col" data-numeric>Revenue</th></tr></thead>
              <tbody>
                <tr><td>Q1</td><td data-numeric>1,200</td></tr>
                <tr><td>Q2</td><td data-numeric>14,860</td></tr>
                <tr><td>Q3</td><td data-numeric>9,045</td></tr>
              </tbody>
            </table>
          </div>
        </div>
```

Run: `pnpm build`
Expected: tokens, css and react builds succeed.

- [ ] **Step 5: Commit**

```bash
git add packages/react packages/css/playground
git commit -m "feat(react): export public API; add components to playground"
```

---

### Task 10: Whole-workspace verification

**Files:** none

- [ ] **Step 1: Run every gate from the root**

Run: `pnpm build && pnpm test && pnpm lint && pnpm typecheck`
Expected: all succeed.
- **Tokens:** 25 tests.
- **CSS:** 27 earlier tests plus the new `components.test.ts` tests.
- **React:** `utils`, `layout`, `type`, `actions`, `display` and `exports` test files all PASS.

- [ ] **Step 2: Browser check**

This step is done by whoever has a browser. Serve `packages/css` (for example `python3 -m http.server 4387 --directory packages/css`) and open `/playground/`. Check:
- **Buttons:** all four variants are legible in Alpine and Zürich, light and dark. The disabled button shows a not-allowed cursor.
- **Corners:** buttons, cards and callouts have rounded corners in Alpine and square ones in Zürich.
- **Tab focus:** each button shows the 2px accent focus ring.
- **Table:** numbers line up on the right, rows are striped, and the scroll region can be focused with Tab.
- **Tags and callout:** text on every tag and on the callout is readable in both modes.

- [ ] **Step 3: Confirm a clean tree**

Run: `git status --short`
Expected: no tracked changes. `.claude/` may appear untracked.

---

## Spec coverage for this plan

| Spec item | Covered by |
|---|---|
| §6 build model: CSS owns styling, React renders the class contract, ref + className, `as` on layout | Tasks 1–9 |
| §6 visual rules: flat surfaces, button variants, 40px controls, 44px targets, Lucide 1.5px icons, theme radius | Tasks 4–8 |
| §6 v1 set: Layout, Type, Actions, Display groups | Tasks 2–8 |
| §8 heading level decoupled from size | Task 3 |
| §8 state never by colour alone | Tasks 4 (disabled), 7 (callout tone word + icon), 8 (numeric cells) |
| §8 logical properties, RTL | All CSS; Task 5 arrow mirroring |
| §10 React behaviour + structural a11y tests | Tasks 1–9 |

**Deferred:**
- **Forms group:** Plan 2b.
- **Overlays and navigation:** Plan 3.
- **Contrast in real browsers and visual regression:** Plan 4.
