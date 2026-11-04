# Raster Plan 4b: Complete Docs, Templates and Visual Regression — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- **Components:** the remaining 18 component pages (Forms, Display, Overlay and navigation), so all 31 version 1 components are documented.
- **Templates:** three page templates (editorial article, dashboard, landing page) and a templates index.
- **Colour scales:** per-theme hue ramps in the tokens package, the DTCG JSON and the colour page.
- **Baseline stripe:** a 4px baseline in the grid debug overlay.
- **Quality gates:** keyboard walkthroughs of the overlays and tabs, and a visual-regression suite (every example and template × 4 theme/mode combinations × 360, 768 and 1440px).

**Architecture:**
- **Patterns from Plan 4a:**
  - **Pages:** `.astro` pages write the `sw-` class contract.
  - **Demos:** each demo is one `.tsx` file.
  - **Snippets:** `Example` shows a demo's `?raw` source and, for demos that have an HTML form, the cleaned server-rendered HTML.
  - **Interactive demos:** these hydrate with `client:load`.
- **Forms and collections:** these components emit more React Aria runtime markup: visually-hidden inline styles, `tabindex` on inputs, `aria-describedby` pointing at error slots that are not rendered, `<template>` placeholders, `data-collection` and `slot` attributes, and long generated ids. `htmlSnippet` gains a `cleanMarkup` step that:
  - removes that markup;
  - drops references to ids that are not rendered;
  - renames the generated ids it keeps to `id-1`, `id-2` and so on.
- **Snippet scope:** behaviour-heavy components (Select, Dialog, Menu, Tooltip, Toast, Tabs) show only the React snippet.
- **Scales:** a typed `SCALES` constant in `@raster/tokens`, emitted into `tokens.json` under each theme. A test proves every light-mode role and every tint maps onto a scale stop, as spec §5 states.
- **Templates:** these are full pages on `Base` (not `DocPage`), written in the HTML contract. The dashboard has one React island, which holds its Tabs and Callout.
- **Visual regression:** a second Playwright project, `visual`. It hides code blocks, then screenshots each `figure.docs-example` and each full template page in every combination. Baselines are committed per platform (`*-darwin.png`); they are generated on this Mac.

**Tech Stack:** unchanged from Plan 4a: Astro 7.4.1, MDX, React 19.1.10, React Aria Components 1.22.1, Prettier 3.9.10, Playwright 1.64.1 with @axe-core/playwright 4.14.0, Vitest 3.2.7.

**Spec:**
- **§3:** the 4px baseline stripe in the debug overlay.
- **§5:** the scales, in the DTCG JSON and on the colour page.
- **§6:** the version 1 set; this plan documents the remaining 18.
- **§8:** keyboard operability; dialogs trap focus and return it.
- **§9:** component pages and templates.
- **§10:** visual regression, plus keyboard walkthroughs of Dialog and Menu.

**Builds on Plan 4a (merged):**
- **Docs app:** `apps/docs`:
  - `src/lib/{settings,nav,html-snippet,contrast-table,components}.ts`
  - `src/components/{CodeBlock,Example,DataTable,PropsTable,FoundationsNav,SiteHeader,SiteFooter}.astro`
  - `src/layouts/{Base,DocPage}.astro`
  - `src/styles/docs.css`
  - `src/content.config.ts` (component collection: `title`, `group`, `order`, `summary`, `interactive`, `props[]`, `a11y[]`)
  - `src/pages/components/[slug].astro`
- **`Example.astro`:** `<Example title source of?>` with the live demo in its slot. `title` must be unique on the page.
- **Gates in `apps/docs/e2e`:**
  - `a11y.spec.ts`: one h1; axe structure rules `heading-order`, `landmark-unique` and `page-has-heading-one`; 320px reflow; WCAG axe in four combinations. It runs on every built page.
  - Behaviour specs: `site`, `foundations`, `themes`, `components`.
  - Helpers: `pages.ts` (`builtPages()`), `settings.ts` (`COMBOS`, `useSettings`), `islands.ts` (`waitForIslands`).
- **Demo rules:**
  - Demo headings start at level 3.
  - Landmark names inside demos must differ from the site's: "Main", "Breadcrumbs", "Foundations", "Previous and next component". Otherwise `landmark-unique` fails.
- **Header current state:** the header styles `aria-current="page"` and `aria-current="true"`. `ariaCurrent()` returns `"true"` for section links.
- **Server-rendered output, checked in this repo with `renderToStaticMarkup`:**
  - **Checkbox, Radio and Switch:** each wraps its native input in `<span style="border:0;clip:rect(0 0 0 0);clip-path:inset(50%);…">`, which is React Aria's VisuallyHidden. `.sw-sr-only` is the equivalent contract class.
  - **Inputs:** they get `tabindex="0"`; radios other than the selected one get `tabindex="-1"`.
  - **Dangling references:** TextField, Checkbox and RadioGroup reference an error-slot id in `aria-describedby` that is not rendered while valid. Checkbox and Switch also reference ids that are not rendered at all.
  - **Collections:** Breadcrumbs, Tabs and Select emit `<template></template>` and `data-collection="…"`. FieldDescription emits `slot="description"`.
  - **Generated ids:** they look like `react-aria-«R0H1»` (React Aria) or `«R1»` (React `useId`).
- **React Aria 1.22 prop names, typechecked:**
  - **Select:** `value`, `defaultValue`, `onChange` (also `selectedKey`), `isRequired`, `isDisabled`, `isInvalid`, `placeholder`.
  - **Tabs:** `selectedKey`, `defaultSelectedKey`, `onSelectionChange`, `orientation`, `keyboardActivation`, `isDisabled`.
  - **TooltipTrigger:** `delay`, `closeDelay`, `isOpen`, `trigger`.
  - **Checkbox:** `isSelected`, `defaultSelected`, `isIndeterminate`, `onChange`.
  - **RadioGroup:** `value`, `defaultValue`, `onChange`, `orientation`.
  - **Switch:** `isSelected`, `defaultSelected`, `onChange`.
  - **TextField:** `value`, `defaultValue`, `onChange`, `type`, `name`, `validate`.
- **Scale mappings, checked against `packages/tokens/src/themes.ts`:** in both themes, light-mode `text-primary`, `text-secondary`, `border-strong`, `border` and `surface-subtle` are the neutral hue's 900, 700, 500, 100 and 50 stops. Each status role (accent, success, warning, danger) is its hue's 700 stop. `-subtle` is the 100 stop, `on-*-subtle` is the 900 stop, and the dark-mode `-subtle` is the 900 stop. The hues are:
  - **Alpine:** slate, glacier, moss, ochre, alert.
  - **Zürich:** warm-grey, cobalt, sage, ochre, signal-red.

## Plan series

1. Tokens and CSS foundations (done).
2. React package and static components (done).
3. Forms on React Aria (done).
4. Overlays (done).
5. Navigation and expressive motion (done).
6. Docs site and page gates, Plan 4a (done).
7. **Plan 4b (this plan):** complete docs, templates, scales, baseline and visual regression. This finishes version 1.

---

## File structure

```
packages/tokens/src/scales.ts                  SCALES, SCALE_STOPS
packages/tokens/src/emit-json.ts               + themes.<name>.scales
packages/tokens/src/index.ts                   + exports
packages/tokens/test/scales.test.ts            new; emit-json.test.ts + scales case
packages/css/src/layout/grid.css               + 4px baseline in the debug overlay
packages/css/test/build.test.ts                + baseline test

apps/docs/src/lib/html-snippet.ts              + cleanMarkup()
apps/docs/src/lib/nav.ts                       + Templates
apps/docs/src/styles/docs.css                  + template and demo classes
apps/docs/src/pages/foundations/{colour,grid}.astro   scales table; baseline note
apps/docs/src/content/components/*.mdx         + 18 pages
apps/docs/src/demos/**                         + demos
apps/docs/src/demos/templates/DashboardActivity.tsx
apps/docs/src/pages/templates/{index,article,dashboard,landing}.astro
apps/docs/playwright.config.ts                 + visual project, snapshot settings
apps/docs/e2e/{keyboard,templates,visual}.spec.ts, e2e/keys.ts
apps/docs/e2e/__screenshots__/                 committed baselines (darwin)
docs/superpowers/specs/2026-11-04-raster-design-system-design.md
```

**Conventions:**
- Work on branch `raster/plan-4b-docs-complete`.
- Commands run from the repo root.
- Run `pnpm build` before the docs typecheck and the e2e suites.
- **Targeted runs:**
  - `pnpm --filter @raster/docs exec vitest run <name>`
  - `pnpm --filter @raster/docs exec playwright test <file> --project=chromium`
- **Rules carried over from 4a:**
  - No raw colours in `docs.css` or inline styles; use tokens only. The exception is data swatches on the colour page.
  - No `h1` outside `DocPage`, or outside a template's own single `h1`.
  - Demo headings start at level 3.
  - Landmark names in demos are unique on the page.
- Commit messages end with a blank line and the agent's `Co-Authored-By` trailer.

---

### Task 1: Clean form and collection markup in HTML snippets

**Files:**
- Modify: `apps/docs/src/lib/html-snippet.ts`
- Modify: `apps/docs/test/html-snippet.test.tsx` (replace the whole file)

- [ ] **Step 1: Create the branch**

```bash
git checkout -b raster/plan-4b-docs-complete
```

- [ ] **Step 2: Replace `apps/docs/test/html-snippet.test.tsx`**

```tsx
import { Breadcrumb, Breadcrumbs, Button, Checkbox, IconButton, Radio, RadioGroup, Stack, TextField } from "@raster/react";
import { X } from "lucide-react";
import { describe, expect, it } from "vitest";
import { cleanMarkup, htmlSnippet } from "../src/lib/html-snippet";

/** Every id that aria-labelledby, aria-describedby, aria-controls or for points at exists in the markup. */
function expectReferencesResolve(html: string) {
  const ids = new Set([...html.matchAll(/ id="([^"]*)"/g)].map((m) => m[1]));
  const refs = [...html.matchAll(/ (?:aria-labelledby|aria-describedby|aria-controls|for)="([^"]*)"/g)].flatMap((m) =>
    m[1].split(/\s+/),
  );
  for (const ref of refs) expect(ids, `reference to missing id ${ref}`).toContain(ref);
}

describe("htmlSnippet", () => {
  it("removes React Aria runtime attributes and formats one element per line", async () => {
    const Demo = () => (
      <Stack direction="row" gap={3}>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
      </Stack>
    );
    expect(await htmlSnippet(Demo)).toBe(
      [
        '<div class="sw-stack" data-gap="3" data-direction="row">',
        '  <button data-variant="primary" class="sw-button" type="button">Save</button>',
        '  <button data-variant="secondary" class="sw-button" type="button">Cancel</button>',
        "</div>",
      ].join("\n"),
    );
  });

  it("collapses Lucide icons to a placeholder", async () => {
    const Demo = () => (
      <IconButton label="Close">
        <X aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
    );
    const html = await htmlSnippet(Demo);
    expect(html).toContain('<svg aria-hidden="true"><!-- Lucide icon --></svg>');
    expect(html).not.toContain("<path");
  });

  it("keeps a field's label and description wired, with readable ids", async () => {
    const html = await htmlSnippet(() => <TextField label="Email" description="For receipts only." />);
    expect(html).toContain('<label class="sw-field-label" id="id-1" for="id-2">');
    expect(html).toContain('id="id-2"');
    expect(html).toMatch(/aria-describedby="id-\d"/);
    expect(html).not.toMatch(/«|react-aria-|slot=|tabindex/);
    expectReferencesResolve(html);
  });

  it("uses the sr-only class for visually hidden inputs and drops dangling references", async () => {
    const html = await htmlSnippet(() => <Checkbox defaultSelected>Email me</Checkbox>);
    expect(html).toContain('<span class="sw-sr-only">');
    expect(html).not.toContain("style=");
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("tabindex");
  });

  it("removes roving tabindex from radios and keeps group labelling", async () => {
    const Demo = () => (
      <RadioGroup label="Plan" defaultValue="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    );
    const html = await htmlSnippet(Demo);
    expect(html).not.toContain("tabindex");
    expect(html).toMatch(/role="radiogroup"[\s\S]*aria-labelledby="id-1"/);
    expectReferencesResolve(html);
  });

  it("removes collection placeholders", async () => {
    const Demo = () => (
      <Breadcrumbs aria-label="Example">
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb>Here</Breadcrumb>
      </Breadcrumbs>
    );
    const html = await htmlSnippet(Demo);
    expect(html).not.toContain("<template");
    expect(html).not.toContain("data-collection");
    expect(html).toContain('aria-current="page"');
  });
});

describe("cleanMarkup", () => {
  it("keeps tabindex on elements that are not natively focusable", () => {
    expect(cleanMarkup('<div tabindex="0" role="region" aria-label="Code">x</div>')).toContain('tabindex="0"');
  });

  it("keeps author ids and renames only generated ones", () => {
    const html = cleanMarkup(
      '<h3 id="title">T</h3><section aria-labelledby="title"></section><p id="react-aria-«R1»">x</p><table aria-labelledby="«R2»"><caption id="«R2»">c</caption></table>',
    );
    expect(html).toContain('id="title"');
    expect(html).not.toContain("react-aria-«R1»");
    expect(html).toContain('<table aria-labelledby="id-1"><caption id="id-1">');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @raster/docs exec vitest run html-snippet`

Expected: FAIL. `cleanMarkup` is not exported, and the form tests find `react-aria-`, `style=` and `tabindex`.

- [ ] **Step 4: Replace `apps/docs/src/lib/html-snippet.ts`**

```ts
import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as htmlPlugin from "prettier/plugins/html";
import { format } from "prettier/standalone";

/** Ids generated by React Aria (react-aria-«…») or React's useId («…»). */
const GENERATED_ID = /(?:react-aria-)?«[^»]*»/g;
const isGenerated = (id: string) => /^(?:react-aria-)?«[^»]*»$/.test(id);
/** React Aria's VisuallyHidden inline style. */
const VISUALLY_HIDDEN = /style="border:0;clip:rect\(0 0 0 0\);clip-path:inset\(50%\);[^"]*"/g;
const REFERENCES = / (aria-labelledby|aria-describedby|aria-controls|for)="([^"]*)"/g;

/**
 * Reduces server-rendered React markup to the @raster/css class contract:
 * - React Aria's runtime attributes and collection placeholders are removed.
 * - Visually hidden wrappers use .sw-sr-only.
 * - tabindex is dropped on native controls.
 * - References to elements that are not rendered (an empty error slot) are dropped.
 * - Generated ids nothing refers to are removed, and the rest are renamed id-1, id-2, ….
 */
export function cleanMarkup(raw: string): string {
  let html = raw
    .replace(/<template><\/template>/g, "")
    .replace(/ data-rac=""/g, "")
    .replace(/ data-react-aria-pressable="true"/g, "")
    .replace(/ data-collection="[^"]*"/g, "")
    .replace(/ slot="[^"]*"/g, "")
    .replace(VISUALLY_HIDDEN, 'class="sw-sr-only"')
    .replace(/(<(?:button|a|input|textarea|select)\b[^>]*?) tabindex="0"/g, "$1")
    .replace(/(<input\b[^>]*?) tabindex="-1"/g, "$1")
    .replace(/<svg\b[^>]*class="lucide[^"]*"[^>]*>.*?<\/svg>/g, '<svg aria-hidden="true"><!-- Lucide icon --></svg>');

  const rendered = new Set([...html.matchAll(/ id="([^"]*)"/g)].map((m) => m[1]));
  html = html.replace(REFERENCES, (_whole, name: string, value: string) => {
    const kept = value.split(/\s+/).filter((id) => rendered.has(id));
    return kept.length > 0 ? ` ${name}="${kept.join(" ")}"` : "";
  });

  const referenced = new Set([...html.matchAll(REFERENCES)].flatMap((m) => m[2].split(/\s+/)));
  html = html.replace(/ id="([^"]*)"/g, (whole, id: string) => (isGenerated(id) && !referenced.has(id) ? "" : whole));

  const names = new Map<string, string>();
  return html.replace(GENERATED_ID, (token) => {
    if (!names.has(token)) names.set(token, `id-${names.size + 1}`);
    return names.get(token)!;
  });
}

/** The HTML a static demo renders, cleaned (see cleanMarkup) and formatted as a snippet. */
export async function htmlSnippet(Demo: ComponentType): Promise<string> {
  const formatted = await format(cleanMarkup(renderToStaticMarkup(createElement(Demo))), {
    parser: "html",
    plugins: [htmlPlugin],
    printWidth: 88,
    htmlWhitespaceSensitivity: "ignore",
  });
  return formatted.trim();
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @raster/docs exec vitest run html-snippet`

Expected: PASS (8 tests).

If an exact-string expectation differs only in attribute order or id numbering (for example `for="id-2"` vs `for="id-1"`), adjust the expectation to what React renders. Keep the assertions that matter: readable ids, no React Aria leftovers, and references that resolve.

- [ ] **Step 6: Rebuild and re-run the existing component checks**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test components --project=chromium`

Expected: PASS. Existing snippets, such as the Button page, are unchanged.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/src/lib/html-snippet.ts apps/docs/test/html-snippet.test.tsx
git commit -m "feat(docs): clean form and collection markup in HTML snippets"
```

---

### Task 2: Colour scales in `@raster/tokens`

**Files:**
- Create: `packages/tokens/src/scales.ts`, `packages/tokens/test/scales.test.ts`
- Modify: `packages/tokens/src/emit-json.ts`, `packages/tokens/src/index.ts`, `packages/tokens/test/emit-json.test.ts`

- [ ] **Step 1: Write the failing tests**

`packages/tokens/test/scales.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SCALE_STOPS, SCALES } from "../src/scales";
import { alpine, type Role, zurich } from "../src/themes";

const HUES = {
  alpine: { neutral: "slate", accent: "glacier", success: "moss", warning: "ochre", danger: "alert" },
  zurich: { neutral: "warm-grey", accent: "cobalt", success: "sage", warning: "ochre", danger: "signal-red" },
} as const;

describe.each([alpine, zurich])("$name scales", (theme) => {
  const hues = HUES[theme.name];
  const scales = SCALES[theme.name] as Record<string, Partial<Record<string, string>>>;
  const light = (role: Role) => theme.colors[role][0];
  const dark = (role: Role) => theme.colors[role][1];

  it("maps the neutral roles onto the neutral ramp in light mode", () => {
    const n = scales[hues.neutral];
    expect(light("text-primary")).toBe(n["900"]);
    expect(light("text-secondary")).toBe(n["700"]);
    expect(light("border-strong")).toBe(n["500"]);
    expect(light("border")).toBe(n["100"]);
    expect(light("surface-subtle")).toBe(n["50"]);
  });

  it.each(["accent", "success", "warning", "danger"] as const)(
    "maps %s onto its hue: 700 fill, 100 tint, 900 text on the tint, 900 dark tint",
    (status) => {
      const h = scales[hues[status]];
      expect(light(status)).toBe(h["700"]);
      expect(light(`${status}-subtle`)).toBe(h["100"]);
      expect(light(`on-${status}-subtle`)).toBe(h["900"]);
      expect(dark(`${status}-subtle`)).toBe(h["900"]);
    },
  );

  it("stores only known stops as six-digit hex", () => {
    for (const stops of Object.values(scales)) {
      for (const [stop, value] of Object.entries(stops)) {
        expect(SCALE_STOPS).toContain(stop);
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});
```

Append to `packages/tokens/test/emit-json.test.ts`, inside the existing `describe("tokensJson", …)` block:

```ts
  it("exposes each theme's scales as DTCG colours", () => {
    expect(json.themes.alpine.scales.glacier["700"]).toEqual({ $type: "color", $value: "#2F5F8A" });
    expect(json.themes.alpine.scales.slate["50"]).toEqual({ $type: "color", $value: "#F2F5F7" });
    expect(json.themes.zurich.scales["signal-red"]["500"]).toEqual({ $type: "color", $value: "#E5341D" });
    expect(json.themes.zurich.scales.ochre).toEqual(json.themes.alpine.scales.ochre);
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @raster/tokens test`

Expected: FAIL, because `../src/scales` does not exist and `scales` is missing from the JSON.

- [ ] **Step 3: Write `packages/tokens/src/scales.ts`**

```ts
import type { Theme } from "./themes";

export const SCALE_STOPS = ["50", "100", "300", "500", "700", "900"] as const;
export type ScaleStop = (typeof SCALE_STOPS)[number];
export type Scale = Partial<Record<ScaleStop, string>>;

const ochre: Scale = { "100": "#F7EED9", "300": "#E5C98A", "500": "#C9962E", "700": "#7F5C14", "900": "#4A360C" };

/**
 * Per-theme hue ramps (spec §5). They are design-time references: themes map their roles onto
 * these stops, and components never use them directly. Neutrals add a 50 stop.
 */
export const SCALES = {
  alpine: {
    slate: { "50": "#F2F5F7", "100": "#E3E8EC", "300": "#B4BFC8", "500": "#7D8A96", "700": "#4A5763", "900": "#1B242C" },
    glacier: { "100": "#E3EDF5", "300": "#A9C6DE", "500": "#7FA7C9", "700": "#2F5F8A", "900": "#183652" },
    moss: { "100": "#E6EEE5", "300": "#B7CBB4", "500": "#7C9A79", "700": "#476445", "900": "#2A3D29" },
    alert: { "100": "#FBE7E4", "300": "#F2AFA4", "500": "#D6402E", "700": "#B23422", "900": "#6E1F14" },
    ochre,
  },
  zurich: {
    "warm-grey": { "50": "#F4F1EA", "100": "#E8E4DA", "300": "#BDB7AA", "500": "#8A847A", "700": "#55524C", "900": "#1C1C1E" },
    cobalt: { "100": "#E4E8FB", "300": "#9DAAF0", "500": "#6A7FEA", "700": "#2F4BD8", "900": "#1A2A80" },
    sage: { "100": "#E8EEE7", "300": "#C3D0C1", "500": "#9DB09A", "700": "#4F6450", "900": "#2C3A2D" },
    "signal-red": { "100": "#FBE5E1", "300": "#F4A797", "500": "#E5341D", "700": "#C02A17", "900": "#6F180D" },
    ochre,
  },
} satisfies Record<Theme["name"], Record<string, Scale>>;
```

- [ ] **Step 4: Emit scales in `packages/tokens/src/emit-json.ts`**

Replace the file with:

```ts
import { foundationTokens } from "./foundation";
import { type Scale, SCALES } from "./scales";
import { ROLES, type Theme, themes } from "./themes";

type ColorToken = { $type: "color"; $value: string };

function modeGroup(theme: Theme, index: 0 | 1): Record<string, ColorToken> {
  return Object.fromEntries(
    ROLES.map((role): [string, ColorToken] => [role, { $type: "color", $value: theme.colors[role][index] }]),
  );
}

function scaleGroup(scales: Record<string, Scale>): Record<string, Record<string, ColorToken>> {
  return Object.fromEntries(
    Object.entries(scales).map(([hue, stops]) => [
      hue,
      Object.fromEntries(
        Object.entries(stops).map(([stop, value]): [string, ColorToken] => [stop, { $type: "color", $value: value }]),
      ),
    ]),
  );
}

/** W3C Design Tokens Community Group format, for Figma and other tools. */
export function tokensJson() {
  return {
    foundation: Object.fromEntries(
      Object.entries(foundationTokens()).map(([name, value]) => [name, { $value: value }]),
    ) as Record<string, { $value: string }>,
    themes: Object.fromEntries(
      themes.map((t) => [
        t.name,
        {
          light: modeGroup(t, 0),
          dark: modeGroup(t, 1),
          radius: { $type: "dimension", $value: t.radius },
          scales: scaleGroup(SCALES[t.name]),
        },
      ]),
    ) as Record<
      Theme["name"],
      {
        light: Record<string, ColorToken>;
        dark: Record<string, ColorToken>;
        radius: { $type: "dimension"; $value: string };
        scales: Record<string, Record<string, ColorToken>>;
      }
    >,
  };
}
```

- [ ] **Step 5: Export from `packages/tokens/src/index.ts`**

Add the line:

```ts
export { type Scale, SCALE_STOPS, SCALES, type ScaleStop } from "./scales";
```

- [ ] **Step 6: Run the tests, build and typecheck**

Run: `pnpm --filter @raster/tokens test && pnpm --filter @raster/tokens build && pnpm --filter @raster/tokens typecheck`

Expected: PASS. `dist/tokens.json` now has `themes.alpine.scales` and `themes.zurich.scales`.

- [ ] **Step 7: Run the docs unit tests**

Run: `pnpm --filter @raster/docs test`

Expected: PASS. `contrastTables` ignores the extra `scales` key.

- [ ] **Step 8: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): per-theme colour scales in the source and the DTCG JSON"
```

---

### Task 3: A 4px baseline in the grid debug overlay

**Files:**
- Modify: `packages/css/src/layout/grid.css`
- Modify: `packages/css/test/build.test.ts`

- [ ] **Step 1: Write the failing test**

In `packages/css/test/build.test.ts`, add after the test `"aligns overlays to the content box and mirrors them in RTL"` (inside the same `describe`):

```ts
  it("draws a 4px baseline under the debug columns, in both directions", () => {
    const base = css.match(/\.sw-grid\[data-grid-debug\]\s*\{[^}]*\}/)?.[0];
    expect(base).toMatch(/--_baseline:\s*repeating-linear-gradient\([^;]*1px[^;]*4px/);
    expect(base).toMatch(/background-image:[^;]*var\(--_baseline\)/);
    const rtl = css.match(/\.sw-grid\[data-grid-debug\]:dir\(rtl\)\s*\{[^}]*\}/)?.[0];
    expect(rtl).toMatch(/background-image:[^;]*var\(--_baseline\)/);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/css test`

Expected: the new test FAILS (no `--_baseline`).

- [ ] **Step 3: Update the debug overlay in `packages/css/src/layout/grid.css`**

Replace the two `data-grid-debug` rules (from the comment `/* Debug overlay: tinted columns. */` to the end of the `:dir(rtl)` rule) with:

```css
/* Debug overlay: tinted columns over a 4px baseline (a faint hairline every 4px). */
.sw-grid[data-grid-debug] {
  --_baseline: repeating-linear-gradient(
    to bottom,
    color-mix(in srgb, var(--accent) 8%, transparent) 0 1px,
    transparent 1px 4px
  );
  background-origin: content-box;
  background-clip: content-box;
  background-image:
    repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--accent) 10%, transparent) 0 var(--_colw),
      transparent var(--_colw) calc(var(--_colw) + var(--grid-gutter))
    ),
    var(--_baseline);
}

.sw-grid[data-grid-debug]:dir(rtl) {
  background-image:
    repeating-linear-gradient(
      to left,
      color-mix(in srgb, var(--accent) 10%, transparent) 0 var(--_colw),
      transparent var(--_colw) calc(var(--_colw) + var(--grid-gutter))
    ),
    var(--_baseline);
}
```

- [ ] **Step 4: Run tests and lint**

Run: `pnpm --filter @raster/css test && pnpm --filter @raster/css lint`

Expected: PASS. Stylelint accepts `color-mix` with tokens and `transparent`.

- [ ] **Step 5: Commit**

```bash
git add packages/css
git commit -m "feat(css): 4px baseline in the grid debug overlay"
```

---

### Task 4: Scales on the colour page; baseline on the grid page

**Files:**
- Modify: `apps/docs/src/pages/foundations/colour.astro`, `apps/docs/src/pages/foundations/grid.astro`, `apps/docs/e2e/foundations.spec.ts`

- [ ] **Step 1: Add the failing e2e tests**

Append to `apps/docs/e2e/foundations.spec.ts`:

```ts
test.describe("colour scales", () => {
  test("shows one scale table per theme with five hues each", async ({ page }) => {
    await page.goto("/foundations/colour/");
    const tables = page.getByRole("table", { name: /scales$/ });
    await expect(tables).toHaveCount(2);
    await expect(page.getByRole("table", { name: "Alpine scales" }).locator("tbody tr")).toHaveCount(5);
    await expect(page.getByRole("table", { name: "Zürich scales" }).locator("tbody tr")).toHaveCount(5);
    await expect(page.getByRole("table", { name: "Alpine scales" })).toContainText("#2F5F8A");
  });
});

test("the grid overlay draws a baseline", async ({ page }) => {
  await page.goto("/foundations/grid/");
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  const image = await page
    .locator("[data-page-grid]")
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(image.match(/repeating-linear-gradient/g)?.length).toBe(2);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm build && pnpm --filter @raster/docs exec playwright test foundations --project=chromium`

Expected:
- The scales test FAILS (no tables).
- The baseline test PASSES already, because Task 3 rebuilt the CSS. That is fine; it guards against regressions.

- [ ] **Step 3: Add the scales section to `apps/docs/src/pages/foundations/colour.astro`**

In the frontmatter, change the `@raster/tokens` import line to:

```ts
import { ROLES, SCALE_STOPS } from "@raster/tokens";
```

Then add after the `tables` constant:

```ts
type ScalesJson = { themes: Record<string, { scales: Record<string, Record<string, { $value: string }>> }> };
const scaleThemes = Object.entries((tokens as unknown as ScalesJson).themes);
```

In the body, insert this block **before** `<h2>Verified contrast</h2>`:

```astro
  <h2>Scales</h2>
  <p class="sw-measure">
    Each theme maps its roles onto these hue ramps; components never use them directly. In light
    mode, text and fills use the 700 stops and tints the 100 stops; in dark mode, tints use the 900
    stops.
  </p>
  {
    scaleThemes.map(([theme, { scales }]) => (
      <DataTable id={`scales-${theme}`} caption={`${THEME_NAMES[theme] ?? theme} scales`} columns={["Hue", ...SCALE_STOPS]}>
        {Object.entries(scales).map(([hue, stops]) => (
          <tr>
            <th scope="row">{hue.replace("-", " ")}</th>
            {SCALE_STOPS.map((stop) => {
              const value = stops[stop]?.$value;
              return (
                <td>
                  {value ? (
                    <>
                      <span class="docs-swatch" style={`background-color: ${value}`} /> <code>{value}</code>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </DataTable>
    ))
  }
```

- [ ] **Step 4: Mention the baseline on the grid page**

In `apps/docs/src/pages/foundations/grid.astro`, replace:

```
in a full-width section. Press <strong>Grid</strong> in the header to see this page's own grid.
```

with:

```
in a full-width section. Press <strong>Grid</strong> in the header to see this page's own
columns and its 4px baseline.
```

- [ ] **Step 5: Run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS, including axe and 320px reflow on the colour page. The scale tables scroll inside their `sw-table-wrap` regions.

Until Task 13 there is only one project, so `--project=chromium` matches everything.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src/pages/foundations apps/docs/e2e/foundations.spec.ts
git commit -m "feat(docs): colour scales and the grid baseline on the foundations pages"
```

---

### Task 5: Form pages, part 1 (Field, TextField, TextArea, Select)

**Files:**
- Create demos: `apps/docs/src/demos/field/Wiring.tsx`, `text-field/Basic.tsx`, `text-area/Basic.tsx`, `select/Basic.tsx`
- Create: `apps/docs/src/content/components/{field,text-field,text-area,select}.mdx`

These pages are covered by the generic gates in `e2e/components.spec.ts` and `e2e/a11y.spec.ts`.

- [ ] **Step 1: Write the demos**

`apps/docs/src/demos/field/Wiring.tsx`:

```tsx
import { TextField } from "@raster/react";

export default function Wiring() {
  return (
    <TextField
      label="Studio email"
      description="Used for invoices only."
      errorMessage="Enter a complete email address."
      defaultValue="studio@"
      isInvalid
    />
  );
}
```

`apps/docs/src/demos/text-field/Basic.tsx`:

```tsx
import { Stack, TextField } from "@raster/react";

export default function Basic() {
  return (
    <Stack gap={5}>
      <TextField label="Name" placeholder="Josef Müller-Brockmann" />
      <TextField label="Email" type="email" isRequired description="We send the proof here." />
      <TextField label="Studio" defaultValue="Raster" isDisabled />
    </Stack>
  );
}
```

`apps/docs/src/demos/text-area/Basic.tsx`:

```tsx
import { TextArea } from "@raster/react";

export default function Basic() {
  return <TextArea label="Brief" description="Two or three sentences." rows={4} />;
}
```

`apps/docs/src/demos/select/Basic.tsx`:

```tsx
import { Select, SelectItem } from "@raster/react";

export default function Basic() {
  return (
    <Select label="Theme" description="Applies to new pages." defaultValue="alpine">
      <SelectItem id="alpine">Alpine</SelectItem>
      <SelectItem id="zurich">Zürich</SelectItem>
    </Select>
  );
}
```

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/field.mdx`:

```mdx
---
title: Field
group: Forms
order: 1
summary: The label, description and error that every form control shares, wired together for assistive technology.
interactive: true
props:
  - name: FieldLabel
    type: LabelProps
    description: The visible label. React Aria links it to the control with for or aria-labelledby.
  - name: FieldDescription
    type: TextProps
    description: Help text, linked to the control with aria-describedby.
  - name: FieldError
    type: FieldErrorProps
    description: The error message. Shown when the field is invalid and linked with aria-describedby.
a11y:
  - Every control has a visible label; placeholders never replace it.
  - The description and the error are announced with the control, because aria-describedby points at both.
  - Errors say how to fix the problem and are shown as text with a danger border, never by colour alone.
---
import Example from "../../components/Example.astro";
import Wiring from "../../demos/field/Wiring";
import wiringSource from "../../demos/field/Wiring.tsx?raw";

TextField, TextArea, Select and RadioGroup compose these parts; use them directly only when building a new control with React Aria.

<Example title="Label, description and error" source={wiringSource} of={Wiring}>
  <Wiring client:load />
</Example>
```

`apps/docs/src/content/components/text-field.mdx`:

```mdx
---
title: TextField
group: Forms
order: 2
summary: A single-line text input with its label, description and error.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: description
    type: ReactNode
    description: Help text below the input.
  - name: errorMessage
    type: ReactNode
    description: Shown when the field is invalid (isInvalid or failed validation).
  - name: type
    type: '"text" | "email" | "password" | "search" | "tel" | "url"'
    default: '"text"'
    description: Input type; sets the keyboard on touch devices.
  - name: value / defaultValue
    type: string
    description: Controlled or initial value.
  - name: onChange
    type: "(value: string) => void"
    description: Called with the new value.
  - name: isRequired / isInvalid / isDisabled
    type: boolean
    default: "false"
    description: Validation and availability states.
  - name: placeholder
    type: string
    description: An example value. Never a substitute for the label.
a11y:
  - The label is a real label element tied to the input.
  - Required fields are marked with the required attribute; say "required" in the label or description when it matters.
  - The 40px input keeps a visible border-strong outline (3:1) and a 2px accent focus ring.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/text-field/Basic";
import basicSource from "../../demos/text-field/Basic.tsx?raw";

<Example title="Fields" source={basicSource} of={Basic}>
  <Basic client:load />
</Example>
```

`apps/docs/src/content/components/text-area.mdx`:

```mdx
---
title: TextArea
group: Forms
order: 3
summary: A multi-line text input with its label, description and error.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: rows
    type: number
    description: Initial height in lines. Users can resize vertically.
  - name: description / errorMessage
    type: ReactNode
    description: As on TextField.
  - name: value / defaultValue
    type: string
    description: Controlled or initial value.
  - name: onChange
    type: "(value: string) => void"
    description: Called with the new value.
a11y:
  - Behaves like TextField; Enter inserts a new line instead of submitting the form.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/text-area/Basic";
import basicSource from "../../demos/text-area/Basic.tsx?raw";

<Example title="Brief" source={basicSource} of={Basic}>
  <Basic client:load />
</Example>
```

`apps/docs/src/content/components/select.mdx`:

```mdx
---
title: Select
group: Forms
order: 4
summary: Picks one option from a list that opens in a popover, themed with its surroundings.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. The visible label.
  - name: value / defaultValue
    type: Key
    description: Controlled or initial selected item id.
  - name: onChange
    type: "(key: Key) => void"
    description: Called with the new selection.
  - name: description / errorMessage
    type: ReactNode
    description: As on TextField.
  - name: items
    type: Iterable<T>
    description: Dynamic items; children is then a function of each item.
  - name: isRequired / isDisabled / isInvalid
    type: boolean
    default: "false"
    description: Validation and availability states.
  - name: SelectItem id
    type: Key
    description: Required on each SelectItem. The value reported on selection.
a11y:
  - The trigger is a button that announces its label and current value; Enter, Space or the arrow keys open the list.
  - In the list, arrow keys move, typing jumps to a match, Enter selects and Escape closes, returning focus to the trigger.
  - Inside a ThemeRegion the list opens in the region's theme and mode.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/select/Basic";
import basicSource from "../../demos/select/Basic.tsx?raw";

Select needs @raster/react for its behaviour, so this page shows only the React snippet.

<Example title="Theme" source={basicSource}>
  <Basic client:load />
</Example>
```

- [ ] **Step 3: Build and run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS. Four new pages in the a11y and component gates.

If axe flags an id or label problem in a live demo, fix the demo, not the rule. If an HTML snippet shows a leftover React Aria attribute, extend `cleanMarkup` with a test in `test/html-snippet.test.tsx` first.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): Field, TextField, TextArea and Select pages"
```

---

### Task 6: Form pages, part 2 (Checkbox, RadioGroup, Switch)

**Files:**
- Create demos: `apps/docs/src/demos/checkbox/States.tsx`, `radio-group/Basic.tsx`, `switch/Basic.tsx`
- Create: `apps/docs/src/content/components/{checkbox,radio-group,switch}.mdx`

- [ ] **Step 1: Write the demos**

`apps/docs/src/demos/checkbox/States.tsx`:

```tsx
import { Checkbox, Stack } from "@raster/react";

export default function States() {
  return (
    <Stack gap={3}>
      <Checkbox defaultSelected>Email me a receipt</Checkbox>
      <Checkbox>Add to the shared calendar</Checkbox>
      <Checkbox isIndeterminate>Select all projects</Checkbox>
      <Checkbox isDisabled>Archive automatically</Checkbox>
    </Stack>
  );
}
```

`apps/docs/src/demos/radio-group/Basic.tsx`:

```tsx
import { Radio, RadioGroup } from "@raster/react";

export default function Basic() {
  return (
    <RadioGroup label="Paper size" description="Sets the print grid." defaultValue="a4">
      <Radio value="a4">A4</Radio>
      <Radio value="a3">A3</Radio>
      <Radio value="letter">US Letter</Radio>
    </RadioGroup>
  );
}
```

`apps/docs/src/demos/switch/Basic.tsx`:

```tsx
import { Stack, Switch } from "@raster/react";

export default function Basic() {
  return (
    <Stack gap={3}>
      <Switch defaultSelected>Show grid overlay</Switch>
      <Switch>Reduce motion</Switch>
    </Stack>
  );
}
```

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/checkbox.mdx`:

```mdx
---
title: Checkbox
group: Forms
order: 5
summary: A single on or off choice, with an indeterminate state for partial selections.
interactive: true
props:
  - name: children
    type: ReactNode
    description: The label, rendered beside the box.
  - name: isSelected / defaultSelected
    type: boolean
    description: Controlled or initial state.
  - name: onChange
    type: "(isSelected: boolean) => void"
    description: Called when the state changes.
  - name: isIndeterminate
    type: boolean
    default: "false"
    description: Shows a dash for "some selected"; it is announced as mixed.
  - name: isDisabled / isRequired / isInvalid
    type: boolean
    default: "false"
    description: Availability and validation states.
a11y:
  - A native checkbox input carries the state, visually hidden behind the drawn box, so the whole label is clickable.
  - Checked and indeterminate states show a tick or a dash, not just a fill colour.
  - Space toggles it; a standalone required checkbox shows only a danger border when invalid, so explain the requirement in nearby text.
---
import Example from "../../components/Example.astro";
import States from "../../demos/checkbox/States";
import statesSource from "../../demos/checkbox/States.tsx?raw";

<Example title="States" source={statesSource} of={States}>
  <States client:load />
</Example>
```

`apps/docs/src/content/components/radio-group.mdx`:

```mdx
---
title: RadioGroup
group: Forms
order: 6
summary: One choice from a short list of options that are all visible at once.
interactive: true
props:
  - name: label
    type: ReactNode
    description: Required. Names the group.
  - name: value / defaultValue
    type: string
    description: Controlled or initial selected value.
  - name: onChange
    type: "(value: string) => void"
    description: Called with the new value.
  - name: description / errorMessage
    type: ReactNode
    description: As on TextField.
  - name: orientation
    type: '"vertical" | "horizontal"'
    default: '"vertical"'
    description: Direction of the arrow-key navigation.
  - name: Radio value
    type: string
    description: Required on each Radio.
a11y:
  - The group is one tab stop; arrow keys move between options and select them.
  - The selected option shows a filled dot, not only a colour change.
  - Use a Select instead when there are more than about five options.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/radio-group/Basic";
import basicSource from "../../demos/radio-group/Basic.tsx?raw";

<Example title="Paper size" source={basicSource} of={Basic}>
  <Basic client:load />
</Example>
```

`apps/docs/src/content/components/switch.mdx`:

```mdx
---
title: Switch
group: Forms
order: 7
summary: Turns a setting on or off immediately, without a save step.
interactive: true
props:
  - name: children
    type: ReactNode
    description: The label, naming the setting.
  - name: isSelected / defaultSelected
    type: boolean
    description: Controlled or initial state.
  - name: onChange
    type: "(isSelected: boolean) => void"
    description: Called when the state changes.
  - name: isDisabled
    type: boolean
    default: "false"
    description: Disables the switch.
a11y:
  - Announced as a switch that is on or off; Space toggles it.
  - The thumb moves to show the state, so it does not depend on the track colour, and stays visible in forced-colours mode.
  - Use a Checkbox instead when the change only applies after the form is submitted.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/switch/Basic";
import basicSource from "../../demos/switch/Basic.tsx?raw";

<Example title="Settings" source={basicSource} of={Basic}>
  <Basic client:load />
</Example>
```

- [ ] **Step 3: Build and run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): Checkbox, RadioGroup and Switch pages"
```

---

### Task 7: Display pages (Card, Table, Tag, Callout)

**Files:**
- Create demos: `apps/docs/src/demos/card/Basic.tsx`, `table/Projects.tsx`, `tag/Tones.tsx`, `callout/Tones.tsx`
- Create: `apps/docs/src/content/components/{card,table,tag,callout}.mdx`

- [ ] **Step 1: Write the demos**

`apps/docs/src/demos/card/Basic.tsx`:

```tsx
import { Card, Eyebrow, Heading, Link, Stack, Text } from "@raster/react";

export default function Basic() {
  return (
    <Card>
      <Stack gap={3}>
        <Eyebrow>Case study</Eyebrow>
        <Heading level={3} size="h4">
          Museum wayfinding
        </Heading>
        <Text tone="secondary">A sign system set on a twelve-column grid.</Text>
        <Link href="/templates/article/">Read the article</Link>
      </Stack>
    </Card>
  );
}
```

`apps/docs/src/demos/table/Projects.tsx`:

```tsx
import { Table } from "@raster/react";

export default function Projects() {
  return (
    <Table caption="Studio projects" striped>
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Lead</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Museum wayfinding</td>
          <td>A. Keller</td>
          <td>12 Nov</td>
        </tr>
        <tr>
          <td>Annual report</td>
          <td>M. Rossi</td>
          <td>28 Nov</td>
        </tr>
        <tr>
          <td>Type specimen</td>
          <td>L. Weber</td>
          <td>5 Dec</td>
        </tr>
      </tbody>
    </Table>
  );
}
```

`apps/docs/src/demos/tag/Tones.tsx`:

```tsx
import { Stack, Tag } from "@raster/react";

export default function Tones() {
  return (
    <Stack direction="row" gap={2}>
      <Tag>Draft</Tag>
      <Tag tone="accent">In review</Tag>
      <Tag tone="success">Approved</Tag>
      <Tag tone="warning">Waiting</Tag>
      <Tag tone="danger">Blocked</Tag>
    </Stack>
  );
}
```

`apps/docs/src/demos/callout/Tones.tsx`:

```tsx
import { Callout, Stack } from "@raster/react";

export default function Tones() {
  return (
    <Stack gap={4}>
      <Callout title="Proofs arrive on Monday">The printer confirmed the date this morning.</Callout>
      <Callout tone="success" title="Published">The annual report is live.</Callout>
      <Callout tone="warning" title="Fonts not licensed for the web">Check the licence before launch.</Callout>
      <Callout tone="danger" title="Upload failed">The file is larger than 50 MB. Compress it and try again.</Callout>
    </Stack>
  );
}
```

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/card.mdx`:

```mdx
---
title: Card
group: Display
order: 1
summary: A flat, hairline-bordered surface that groups related content; no shadow.
props:
  - name: as
    type: ElementType
    default: '"div"'
    description: Element to render, for example "article" or "li".
  - name: className
    type: string
    description: Extra classes, added after sw-card.
a11y:
  - A card adds no semantics. Render it as article when it stands alone, or as li inside a list of cards.
  - Keep one real link or button per card rather than making the whole card clickable, so screen readers announce a clear name.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/card/Basic";
import basicSource from "../../demos/card/Basic.tsx?raw";

<Example title="Case study" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/table.mdx`:

```mdx
---
title: Table
group: Display
order: 2
summary: A data table with a required caption, set in tabular figures, that scrolls inside its own region on small screens.
props:
  - name: caption
    type: ReactNode
    description: Required. Names the table and its scroll region.
  - name: striped
    type: boolean
    default: "false"
    description: Tints every other row.
  - name: wrapperProps
    type: ComponentProps<"div">
    description: Props for the scroll wrapper (role, tabIndex and aria-labelledby are set for you).
  - name: children
    type: ReactNode
    description: thead, tbody and tfoot, written as plain HTML.
a11y:
  - The caption names both the table and the scrollable region around it.
  - The region is focusable, so keyboard users can scroll wide tables; the page itself never scrolls sideways.
  - Give header cells scope="col" or scope="row".
---
import Example from "../../components/Example.astro";
import Projects from "../../demos/table/Projects";
import projectsSource from "../../demos/table/Projects.tsx?raw";

<Example title="Striped" source={projectsSource} of={Projects}>
  <Projects />
</Example>
```

`apps/docs/src/content/components/tag.mdx`:

```mdx
---
title: Tag
group: Display
order: 3
summary: A short status or category label on a tinted, fully rounded background.
props:
  - name: tone
    type: '"neutral" | "accent" | "success" | "warning" | "danger"'
    default: '"neutral"'
    description: Tint and text colour. Every tone's text passes 4.5:1 on its tint.
  - name: className
    type: string
    description: Extra classes, added after sw-tag.
a11y:
  - The tag's words carry the meaning; the tone only reinforces it, so "Blocked" must say blocked.
  - Tags are not interactive; use a Button or Link for actions.
---
import Example from "../../components/Example.astro";
import Tones from "../../demos/tag/Tones";
import tonesSource from "../../demos/tag/Tones.tsx?raw";

<Example title="Tones" source={tonesSource} of={Tones}>
  <Tones />
</Example>
```

`apps/docs/src/content/components/callout.mdx`:

```mdx
---
title: Callout
group: Display
order: 4
summary: A static message in the page flow, with an icon and an optional title, in four tones.
props:
  - name: tone
    type: '"info" | "success" | "warning" | "danger"'
    default: '"info"'
    description: Icon, tint and the word announced before the message.
  - name: title
    type: ReactNode
    description: A short summary set above the message.
  - name: children
    type: ReactNode
    description: The message.
a11y:
  - The tone is announced as a word (for example "Warning:") and shown by an icon, not only by colour.
  - A callout is not a live region. For messages that appear after an action, use a Toast.
---
import Example from "../../components/Example.astro";
import Tones from "../../demos/callout/Tones";
import tonesSource from "../../demos/callout/Tones.tsx?raw";

<Example title="Tones" source={tonesSource} of={Tones}>
  <Tones />
</Example>
```

Before writing `callout.mdx`, check `TONE_WORDS` in `packages/react/src/display/Callout.tsx`. If the warning word is not "Warning", correct the example in the first a11y note.

- [ ] **Step 3: Build and run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): Card, Table, Tag and Callout pages"
```

---

### Task 8: Overlay pages and keyboard walkthroughs (Dialog, Menu, Tooltip, Toast)

**Files:**
- Create demos: `apps/docs/src/demos/dialog/EditProfile.tsx`, `menu/Actions.tsx`, `tooltip/IconHint.tsx`, `toast/Notify.tsx`
- Create: `apps/docs/src/content/components/{dialog,menu,tooltip,toast}.mdx`
- Create: `apps/docs/e2e/keys.ts`, `apps/docs/e2e/keyboard.spec.ts`

- [ ] **Step 1: Write the keyboard helper `apps/docs/e2e/keys.ts`**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

/** Presses Tab from the top of the page until the target has focus, like a keyboard user would. */
export async function tabTo(page: Page, target: Locator, maxPresses = 80): Promise<void> {
  await page.locator("body").evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Could not reach the target with ${maxPresses} Tab presses`);
}

/** Runs WCAG axe rules on the element (an open overlay). */
export async function expectNoViolations(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
}
```

- [ ] **Step 2: Write the failing keyboard walkthroughs `apps/docs/e2e/keyboard.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { expectNoViolations, tabTo } from "./keys";

test("dialog: opens from the keyboard, traps focus and returns it on Escape", async ({ page }) => {
  await page.goto("/components/dialog/");
  await waitForIslands(page);
  const trigger = page.getByRole("button", { name: "Edit profile" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog).toBeVisible();
  const focusInside = () => dialog.evaluate((d) => d.contains(document.activeElement));
  await expect.poll(focusInside).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await focusInside()).toBe(true);
  }
  await expectNoViolations(page, ".sw-modal-overlay");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("menu: Enter opens on the first item, arrows move, Escape returns focus, Enter activates", async ({ page }) => {
  await page.goto("/components/menu/");
  await waitForIslands(page);
  const trigger = page.getByRole("button", { name: "Actions" });
  await tabTo(page, trigger);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  await expectNoViolations(page, ".sw-popover");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Last action: duplicate");
});

test("tooltip: appears on keyboard focus and hides on Escape", async ({ page }) => {
  await page.goto("/components/tooltip/");
  await waitForIslands(page);
  await tabTo(page, page.getByRole("button", { name: "Duplicate" }));
  const tip = page.getByRole("tooltip");
  await expect(tip).toHaveText("Duplicate (D)");
  await page.keyboard.press("Escape");
  await expect(tip).toHaveCount(0);
});

test("toast: an action announces a toast that can be dismissed", async ({ page }) => {
  await page.goto("/components/toast/");
  await waitForIslands(page);
  await tabTo(page, page.getByRole("button", { name: "Save changes" }));
  await page.keyboard.press("Enter");
  const toast = page.locator(".sw-toast");
  await expect(toast).toHaveCount(1);
  await expect(toast).toContainText("Saved");
  await expectNoViolations(page, ".sw-toast-region");
  await toast.getByRole("button", { name: "Dismiss" }).click();
  await expect(toast).toHaveCount(0);
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test keyboard --project=chromium`

Expected: FAIL (the pages do not exist).

- [ ] **Step 4: Write the demos**

`apps/docs/src/demos/dialog/EditProfile.tsx`:

```tsx
import { Button, Dialog, DialogTrigger, Stack, TextField } from "@raster/react";

export default function EditProfile() {
  return (
    <DialogTrigger>
      <Button>Edit profile</Button>
      <Dialog title="Edit profile">
        {({ close }) => (
          <Stack gap={5}>
            <TextField label="Display name" defaultValue="Raster studio" />
            <Stack direction="row" gap={3}>
              <Button variant="primary" onPress={close}>
                Save
              </Button>
              <Button onPress={close}>Cancel</Button>
            </Stack>
          </Stack>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
```

`apps/docs/src/demos/menu/Actions.tsx`:

```tsx
import { Button, Menu, MenuItem, MenuSeparator, MenuTrigger, Stack, Text } from "@raster/react";
import { useState } from "react";

export default function Actions() {
  const [last, setLast] = useState("none");
  return (
    <Stack gap={3}>
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu onAction={(key) => setLast(String(key))}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem id="delete" variant="danger">
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <Text size="caption" tone="secondary" role="status">
        Last action: {last}
      </Text>
    </Stack>
  );
}
```

`apps/docs/src/demos/tooltip/IconHint.tsx`:

```tsx
import { IconButton, Tooltip, TooltipTrigger } from "@raster/react";
import { Copy } from "lucide-react";

export default function IconHint() {
  return (
    <TooltipTrigger>
      <IconButton label="Duplicate">
        <Copy aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <Tooltip>Duplicate (D)</Tooltip>
    </TooltipTrigger>
  );
}
```

`apps/docs/src/demos/toast/Notify.tsx`:

```tsx
import { Button, createToastQueue, Stack, ToastRegion } from "@raster/react";

// One queue for this demo; an app creates one near its root.
const queue = createToastQueue();

export default function Notify() {
  return (
    <>
      <Stack direction="row" gap={3}>
        <Button
          onPress={() =>
            queue.add({ title: "Saved", description: "Your changes are live.", tone: "success" }, { timeout: 5000 })
          }
        >
          Save changes
        </Button>
        <Button onPress={() => queue.add({ title: "Connection lost", tone: "danger" })}>Simulate an error</Button>
      </Stack>
      <ToastRegion queue={queue} />
    </>
  );
}
```

- [ ] **Step 5: Write the MDX pages**

`apps/docs/src/content/components/dialog.mdx`:

```mdx
---
title: Dialog
group: Overlay and navigation
order: 1
summary: A modal window over a scrim that holds focus until it is closed.
interactive: true
props:
  - name: title
    type: ReactNode
    description: Required. The heading that names the dialog.
  - name: children
    type: "ReactNode | ({ close }) => ReactNode"
    description: Content; the function form receives close for buttons inside.
  - name: role
    type: '"dialog" | "alertdialog"'
    default: '"dialog"'
    description: Use alertdialog for confirmations that interrupt the user.
  - name: isDismissable
    type: boolean
    default: true for dialog, false for alertdialog
    description: Whether a click on the scrim closes it.
  - name: isOpen / defaultOpen / onOpenChange
    type: boolean / (isOpen) => void
    description: Controlled use without a DialogTrigger, for example from a menu item.
  - name: DialogTrigger
    type: component
    description: Wraps the trigger Button and the Dialog; opens the dialog on press.
a11y:
  - Focus moves into the dialog when it opens, stays inside while it is open, and returns to the trigger when it closes.
  - Escape closes it; the title names it for screen readers.
  - Content behind the scrim is hidden from assistive technology while the dialog is open.
---
import Example from "../../components/Example.astro";
import EditProfile from "../../demos/dialog/EditProfile";
import editProfileSource from "../../demos/dialog/EditProfile.tsx?raw";

<Example title="Edit profile" source={editProfileSource}>
  <EditProfile client:load />
</Example>
```

`apps/docs/src/content/components/menu.mdx`:

```mdx
---
title: Menu
group: Overlay and navigation
order: 2
summary: A list of actions that opens from a button in a popover.
interactive: true
props:
  - name: onAction
    type: "(key: Key) => void"
    description: Called with the id of the activated item.
  - name: placement
    type: Placement
    default: '"bottom start"'
    description: Where the popover opens relative to the trigger; it flips when there is no room.
  - name: MenuItem id
    type: Key
    description: Identifies the item in onAction.
  - name: MenuItem variant
    type: '"default" | "danger"'
    default: '"default"'
    description: Danger items are for destructive actions; their text must say so.
  - name: MenuSeparator
    type: component
    description: A hairline between groups of items.
  - name: MenuTrigger
    type: component
    description: Wraps the trigger Button and the Menu.
a11y:
  - Enter, Space or the arrow keys open the menu; arrow keys move, typing jumps to an item, Enter activates.
  - Escape closes the menu and returns focus to the trigger.
  - Use a menu for actions, not for navigation between pages.
---
import Example from "../../components/Example.astro";
import Actions from "../../demos/menu/Actions";
import actionsSource from "../../demos/menu/Actions.tsx?raw";

<Example title="Actions" source={actionsSource}>
  <Actions client:load />
</Example>
```

`apps/docs/src/content/components/tooltip.mdx`:

```mdx
---
title: Tooltip
group: Overlay and navigation
order: 3
summary: A short inverted label that describes a control on hover and on keyboard focus.
interactive: true
props:
  - name: children
    type: ReactNode
    description: The tooltip text. Keep it to a few words.
  - name: placement
    type: Placement
    default: '"top"'
    description: Side of the trigger; it flips when there is no room.
  - name: offset
    type: number
    default: "8"
    description: Distance from the trigger in pixels.
  - name: TooltipTrigger delay / closeDelay
    type: number
    description: Milliseconds before showing and hiding.
a11y:
  - It appears on keyboard focus as well as hover, describes the trigger through aria-describedby, and Escape hides it.
  - It never holds essential information or interactive content; touch users may never see it.
  - Pair it with an IconButton to show its label to sighted users.
---
import Example from "../../components/Example.astro";
import IconHint from "../../demos/tooltip/IconHint";
import iconHintSource from "../../demos/tooltip/IconHint.tsx?raw";

<Example title="Icon button hint" source={iconHintSource}>
  <IconHint client:load />
</Example>
```

`apps/docs/src/content/components/toast.mdx`:

```mdx
---
title: Toast
group: Overlay and navigation
order: 4
summary: A brief, announced message about the result of an action, stacked at the edge of the screen.
interactive: true
props:
  - name: ToastRegion queue
    type: ToastQueue
    default: the shared toastQueue
    description: Render one region near the app root.
  - name: createToastQueue
    type: "(maxVisibleToasts = 5) => ToastQueue"
    description: Creates a queue; the shared toastQueue is created at import time.
  - name: queue.add
    type: "({ title, description?, tone? }, { timeout? }) => key"
    description: Shows a toast. tone is info, success, warning or danger.
  - name: timeout
    type: number
    description: Milliseconds before it closes; at least 5000, or omit it to keep the toast until dismissed.
a11y:
  - Toasts are announced by screen readers with their tone word (for example "Success:").
  - Each toast has a Dismiss button; errors should stay until dismissed rather than time out.
  - F6 moves focus into the toast region and back.
---
import Example from "../../components/Example.astro";
import Notify from "../../demos/toast/Notify";
import notifySource from "../../demos/toast/Notify.tsx?raw";

<Example title="Success and error" source={notifySource}>
  <Notify client:load />
</Example>
```

Before writing `toast.mdx`, check `TONE_WORDS` in `packages/react/src/overlays/Toast.tsx`. If the success word is not "Success", correct the example.

- [ ] **Step 6: Run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS, including the four keyboard walkthroughs.

If a walkthrough fails because React Aria's behaviour differs from the expectation (for example, which item receives focus when the menu opens), confirm the behaviour in the browser. If it matches the WAI-ARIA pattern, correct the assertion and say so in the commit message. If it is a defect, fix the demo.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/src apps/docs/e2e/keys.ts apps/docs/e2e/keyboard.spec.ts
git commit -m "feat(docs): Dialog, Menu, Tooltip and Toast pages with keyboard walkthroughs"
```

---

### Task 9: Navigation pages (Tabs, Header, Breadcrumbs)

**Files:**
- Create demos: `apps/docs/src/demos/tabs/Horizontal.tsx`, `tabs/Vertical.tsx`, `header/Basic.tsx`, `breadcrumbs/Basic.tsx`
- Create: `apps/docs/src/content/components/{tabs,header,breadcrumbs}.mdx`
- Modify: `apps/docs/e2e/keyboard.spec.ts`, `apps/docs/src/styles/docs.css`

- [ ] **Step 1: Add the failing Tabs walkthrough**

Append to `apps/docs/e2e/keyboard.spec.ts`:

```ts
test("tabs: one tab stop, arrows select, disabled tabs are skipped", async ({ page }) => {
  await page.goto("/components/tabs/");
  await waitForIslands(page);
  const list = page.getByRole("tablist", { name: "Foundations" });
  await tabTo(page, list.getByRole("tab", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Type" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Type" })).toContainText("Geist");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Motion" })).not.toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  expect(await list.evaluate((l) => l.contains(document.activeElement))).toBe(false);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/docs exec playwright test keyboard --project=chromium`

Expected: the Tabs test FAILS (the page does not exist).

- [ ] **Step 3: Write the demos**

`apps/docs/src/demos/tabs/Horizontal.tsx`:

```tsx
import { Tab, TabList, TabPanel, Tabs, Text } from "@raster/react";

export default function Horizontal() {
  return (
    <Tabs defaultSelectedKey="grid">
      <TabList aria-label="Foundations">
        <Tab id="grid">Grid</Tab>
        <Tab id="type">Type</Tab>
        <Tab id="colour">Colour</Tab>
        <Tab id="motion" isDisabled>
          Motion
        </Tab>
      </TabList>
      <TabPanel id="grid">
        <Text>Four, eight or twelve columns, chosen by the container.</Text>
      </TabPanel>
      <TabPanel id="type">
        <Text>Geist in a short, light scale.</Text>
      </TabPanel>
      <TabPanel id="colour">
        <Text>Two themes, each in light and dark.</Text>
      </TabPanel>
      <TabPanel id="motion">
        <Text>Calm by default.</Text>
      </TabPanel>
    </Tabs>
  );
}
```

`apps/docs/src/demos/tabs/Vertical.tsx`:

```tsx
import { Tab, TabList, TabPanel, Tabs, Text } from "@raster/react";

export default function Vertical() {
  return (
    <Tabs orientation="vertical" defaultSelectedKey="profile">
      <TabList aria-label="Settings">
        <Tab id="profile">Profile</Tab>
        <Tab id="notifications">Notifications</Tab>
        <Tab id="billing">Billing</Tab>
      </TabList>
      <TabPanel id="profile">
        <Text>Name, studio and contact details.</Text>
      </TabPanel>
      <TabPanel id="notifications">
        <Text>Choose which updates reach you.</Text>
      </TabPanel>
      <TabPanel id="billing">
        <Text>Invoices and payment method.</Text>
      </TabPanel>
    </Tabs>
  );
}
```

`apps/docs/src/demos/header/Basic.tsx`:

```tsx
import { Button, Header, Link } from "@raster/react";

export default function Basic() {
  return (
    <Header
      sticky={false}
      navLabel="Example site"
      brand={<Link href="/">Studio</Link>}
      actions={<Button variant="ghost">Sign in</Button>}
    >
      <Link href="/components/header/" aria-current="page">
        Work
      </Link>
      <Link href="/templates/">Templates</Link>
      <Link href="/">About</Link>
    </Header>
  );
}
```

`apps/docs/src/demos/breadcrumbs/Basic.tsx`:

```tsx
import { Breadcrumb, Breadcrumbs } from "@raster/react";

export default function Basic() {
  return (
    <Breadcrumbs aria-label="Example breadcrumbs">
      <Breadcrumb href="/">Home</Breadcrumb>
      <Breadcrumb href="/components/">Components</Breadcrumb>
      <Breadcrumb>Breadcrumbs</Breadcrumb>
    </Breadcrumbs>
  );
}
```

- [ ] **Step 4: Contain positioned demos**

Append to `apps/docs/src/styles/docs.css`:

```css
/* Positioned demo content (the Header demo's skip link) stays inside its frame. */
.docs-example-demo {
  position: relative;
}
```

- [ ] **Step 5: Write the MDX pages**

`apps/docs/src/content/components/tabs.mdx`:

```mdx
---
title: Tabs
group: Overlay and navigation
order: 5
summary: Switches between panels of related content in place, marked by an accent underline and weight.
interactive: true
props:
  - name: selectedKey / defaultSelectedKey
    type: Key
    description: Controlled or initial selected tab id.
  - name: onSelectionChange
    type: "(key: Key) => void"
    description: Called when another tab is selected.
  - name: orientation
    type: '"horizontal" | "vertical"'
    default: '"horizontal"'
    description: Layout and arrow-key direction.
  - name: keyboardActivation
    type: '"automatic" | "manual"'
    default: '"automatic"'
    description: Manual waits for Enter or Space before switching panels.
  - name: TabList aria-label
    type: string
    description: Required (or aria-labelledby). Names the set of tabs.
  - name: Tab id / isDisabled
    type: Key / boolean
    description: Identifies the tab and its panel; disabled tabs are skipped.
  - name: TabPanel id
    type: Key
    description: Matches the id of its Tab.
a11y:
  - The tab list is a single tab stop; arrow keys move between tabs and skip disabled ones, and Tab moves on to the panel.
  - The selected tab is shown by an underline and weight, not colour alone, and stays visible in forced-colours mode.
  - Use links, not tabs, when each section has its own URL.
---
import Example from "../../components/Example.astro";
import Horizontal from "../../demos/tabs/Horizontal";
import horizontalSource from "../../demos/tabs/Horizontal.tsx?raw";
import Vertical from "../../demos/tabs/Vertical";
import verticalSource from "../../demos/tabs/Vertical.tsx?raw";

<Example title="Horizontal" source={horizontalSource}>
  <Horizontal client:load />
</Example>

<Example title="Vertical" source={verticalSource}>
  <Vertical client:load />
</Example>
```

`apps/docs/src/content/components/header.mdx`:

```mdx
---
title: Header
group: Overlay and navigation
order: 6
summary: The site banner with a skip link, brand, primary navigation and actions; sticky by default.
props:
  - name: brand
    type: ReactNode
    description: Required. Logo or site name, usually a link home.
  - name: children
    type: ReactNode
    description: Navigation links. Mark the current one with aria-current="page".
  - name: actions
    type: ReactNode
    description: Controls at the inline end, such as a theme switch.
  - name: navLabel
    type: string
    default: '"Main"'
    description: Name of the navigation landmark.
  - name: skipTo
    type: string
    default: '"#main"'
    description: Target of the skip link; give the main element that id and tabIndex={-1}.
  - name: sticky
    type: boolean
    default: "true"
    description: Sticks to the top; the page then reserves scroll padding so focused content is never hidden (WCAG 2.4.11).
a11y:
  - The skip link is the first tab stop and appears when focused.
  - The current page is marked with aria-current and shown by weight and underline.
  - On narrow screens the navigation scrolls sideways inside the header rather than wrapping.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/header/Basic";
import basicSource from "../../demos/header/Basic.tsx?raw";

This site's own header is the same component, written as HTML.

<Example title="Site header" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/breadcrumbs.mdx`:

```mdx
---
title: Breadcrumbs
group: Overlay and navigation
order: 7
summary: The path from the home page to the current page, with mono separators.
props:
  - name: aria-label
    type: string
    default: '"Breadcrumbs"'
    description: Name of the navigation landmark.
  - name: Breadcrumb href
    type: string
    description: Link target. The last Breadcrumb is always the current page and ignores href.
  - name: Breadcrumb children
    type: ReactNode
    description: The page name.
  - name: isDisabled / onAction
    type: boolean / (key) => void
    description: Disables every item, or handles activation without navigation.
a11y:
  - A navigation landmark containing an ordered list; the last item has aria-current="page".
  - The slash separators are hidden from screen readers.
  - This site's component pages use the same markup above each title.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/breadcrumbs/Basic";
import basicSource from "../../demos/breadcrumbs/Basic.tsx?raw";

<Example title="Trail" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

- [ ] **Step 6: Run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS. All 31 component pages exist, and `components.spec.ts` checks the index links to each.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/src apps/docs/e2e/keyboard.spec.ts
git commit -m "feat(docs): Tabs, Header and Breadcrumbs pages; all 31 components documented"
```

---

### Task 10: Templates section and the editorial article

**Files:**
- Modify: `apps/docs/src/lib/nav.ts`, `apps/docs/test/nav.test.ts`, `apps/docs/src/styles/docs.css`
- Create: `apps/docs/src/pages/templates/index.astro`, `apps/docs/src/pages/templates/article.astro`, `apps/docs/e2e/templates.spec.ts`

- [ ] **Step 1: Add the failing unit test**

In `apps/docs/test/nav.test.ts`, add inside `describe("ariaCurrent", …)`:

```ts
  it("has a Templates section", () => {
    expect(ariaCurrent("/templates/", item("Templates"))).toBe("page");
    expect(ariaCurrent("/templates/article/", item("Templates"))).toBe("true");
  });
```

- [ ] **Step 2: Add the failing e2e tests `apps/docs/e2e/templates.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("the templates index links to the three templates", async ({ page }) => {
  await page.goto("/templates/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveText(["Editorial article", "Dashboard", "Landing page"]);
});

test("article: a hanging grid with numbered sections and a captioned figure", async ({ page }) => {
  await page.goto("/templates/article/");
  await expect(page.locator("h1")).toHaveText("Form follows grid");
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-layout", "hanging");
  await expect(page.locator("main h2")).toHaveCount(3);
  await expect(page.locator("main figure figcaption")).toContainText("Figure 1");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Templates" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @raster/docs exec vitest run nav && pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test templates --project=chromium`

Expected: FAIL.

- [ ] **Step 4: Add Templates to `apps/docs/src/lib/nav.ts`**

In `NAV`, insert after the Components item:

```ts
  { href: "/templates/", label: "Templates", section: "/templates/" },
```

- [ ] **Step 5: Append the template classes to `apps/docs/src/styles/docs.css`**

```css
/* Templates */
.docs-prose {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-inline-size: 0;
}

.docs-article-head {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.docs-quote {
  --_size: var(--text-h3-size);
  --_leading: var(--text-h3-leading);
  margin: 0;
  padding-inline-start: var(--space-5);
  border-inline-start: 2px solid var(--brand-signal);
}

.docs-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-stats li {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.docs-hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.docs-feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-feature-list li {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
```

- [ ] **Step 6: Write `apps/docs/src/pages/templates/index.astro`**

```astro
---
import DocPage from "../../layouts/DocPage.astro";

const TEMPLATES = [
  { href: "/templates/article/", title: "Editorial article", summary: "Long-form reading on a hanging grid, with numbered sections, a figure and a pull quote." },
  { href: "/templates/dashboard/", title: "Dashboard", summary: "Figures, a project table with status tags, and tabbed activity." },
  { href: "/templates/landing/", title: "Landing page", summary: "A display headline, calls to action, staggered feature cards and a closing section." },
];
---
<DocPage
  title="Templates"
  eyebrow="Templates"
  description="Whole pages built only from the class contract, with React islands only where something responds to input. Use them as starting points."
>
  <ul class="docs-component-list">
    {
      TEMPLATES.map((t) => (
        <li>
          <a class="sw-link" href={t.href}>
            {t.title}
          </a>
          <span class="sw-type-caption sw-text-secondary">{t.summary}</span>
        </li>
      ))
    }
  </ul>
</DocPage>
```

- [ ] **Step 7: Write `apps/docs/src/pages/templates/article.astro`**

```astro
---
import Base from "../../layouts/Base.astro";
---
<Base title="Form follows grid" description="Template: an editorial article set on a hanging grid.">
  <article class="sw-grid" data-layout="hanging" data-page-grid>
    <p class="sw-type-label sw-text-secondary">Essay · November 2026</p>
    <header class="docs-article-head">
      <h1 class="sw-type-display">Form follows grid</h1>
      <p class="docs-lead sw-measure sw-text-secondary">
        Why a Swiss grid still works on screens of every size, and what changes when the page has no
        fixed edges.
      </p>
      <p class="sw-type-caption sw-text-secondary">By the Raster studio · 6 minute read</p>
    </header>

    <p class="sw-type-label sw-text-secondary">01</p>
    <div class="docs-prose sw-measure">
      <h2 class="sw-type-h3">The page without edges</h2>
      <p>
        A printed page has four edges, and the grid begins from them. A screen has none that stay
        put: the same article is read on a phone held in one hand and on a monitor across a desk.
        The grid has to start from somewhere else.
      </p>
      <p>
        Raster starts from the container. A column of text in a sidebar and the same text across a
        full section measure their own width and choose four, eight or twelve columns to match. The
        proportions hold; only the count changes.
      </p>
    </div>

    <p class="sw-type-label sw-text-secondary">Figure 1</p>
    <figure class="sw-figure">
      <svg viewBox="0 0 236 60" width="100%" role="img" aria-label="Twelve vertical bars of equal width">
        {Array.from({ length: 12 }, (_, i) => <rect x={i * 20} y="0" width="16" height="60" fill="currentColor" opacity="0.15" />)}
      </svg>
      <figcaption class="sw-type-caption sw-text-secondary">
        Figure 1 — Twelve columns and eleven gutters at full width.
      </figcaption>
    </figure>

    <p class="sw-type-label sw-text-secondary">02</p>
    <div class="docs-prose sw-measure">
      <h2 class="sw-type-h3">Labels hang, text runs</h2>
      <p>
        The narrow column on the left holds what a reader scans first: numbers, dates, the name of a
        figure. The wide column holds what they read. On a small screen the label simply sits above
        its paragraph.
      </p>
      <blockquote class="docs-quote">
        <p>The grid is not a cage. It is the one decision that makes every later decision easier.</p>
      </blockquote>
      <p>
        Because placement comes from the grid, the type can stay quiet: one family, few sizes, weight
        changes only where the structure needs them.
      </p>
    </div>

    <p class="sw-type-label sw-text-secondary">03</p>
    <div class="docs-prose sw-measure">
      <h2 class="sw-type-h3">A calmer hierarchy</h2>
      <p>
        Headings in Raster are smaller and lighter than habit suggests. White space and alignment do
        the separating, so a page reads as a sequence rather than a shout. Press Grid in the header to
        see the columns this article sits on.
      </p>
    </div>
  </article>
</Base>
```

- [ ] **Step 8: Run the tests and gates**

Run: `pnpm --filter @raster/docs test && pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS.

The `/templates/article/` page meets the gates as follows:
- **One h1, sound outline:** its only h1 is the article title, and the h2s follow.
- **No banner clash:** the `header` inside `article` is not a banner landmark.
- **Reflow:** the 236px SVG scales with `width="100%"`, so 320px reflow passes.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/src apps/docs/test/nav.test.ts apps/docs/e2e/templates.spec.ts
git commit -m "feat(docs): templates section and the editorial article"
```

---

### Task 11: Dashboard template

**Files:**
- Create: `apps/docs/src/demos/templates/DashboardActivity.tsx`, `apps/docs/src/pages/templates/dashboard.astro`
- Modify: `apps/docs/e2e/templates.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `apps/docs/e2e/templates.spec.ts` (and add `import { waitForIslands } from "./islands";` to the imports):

```ts
test("dashboard: figures, a project table with status words, and tabbed activity", async ({ page }) => {
  await page.goto("/templates/dashboard/");
  await waitForIslands(page);
  await expect(page.locator("h1")).toHaveText("Studio dashboard");
  await expect(page.locator(".docs-stats li")).toHaveCount(4);
  const table = page.getByRole("table", { name: "Projects" });
  await expect(table.locator("tbody tr")).toHaveCount(4);
  await expect(table.locator(".sw-tag")).toHaveText(["On track", "In review", "At risk", "Blocked"]);
  const tabs = page.getByRole("tablist", { name: "Activity" });
  await tabs.getByRole("tab", { name: "Last week" }).click();
  await expect(page.getByRole("tabpanel", { name: "Last week" })).toBeVisible();
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test templates --project=chromium`

Expected: the dashboard test FAILS (404).

- [ ] **Step 3: Write `apps/docs/src/demos/templates/DashboardActivity.tsx`**

```tsx
import { Callout, Stack, Tab, TabList, TabPanel, Tabs, Text } from "@raster/react";

const WEEKS = {
  "this-week": ["Proofs approved for the annual report", "Wayfinding signs sent to the fabricator", "New brief: type specimen"],
  "last-week": ["Museum client review", "Grid study for the report cover", "Licence check for web fonts"],
};

export default function DashboardActivity() {
  return (
    <Stack gap={5}>
      <Callout tone="warning" title="One project at risk">
        The type specimen is waiting for font licences.
      </Callout>
      <Tabs defaultSelectedKey="this-week">
        <TabList aria-label="Activity">
          <Tab id="this-week">This week</Tab>
          <Tab id="last-week">Last week</Tab>
        </TabList>
        {Object.entries(WEEKS).map(([id, items]) => (
          <TabPanel key={id} id={id}>
            <Stack as="ul" gap={2}>
              {items.map((item) => (
                <Text as="li" key={item}>
                  {item}
                </Text>
              ))}
            </Stack>
          </TabPanel>
        ))}
      </Tabs>
    </Stack>
  );
}
```

- [ ] **Step 4: Write `apps/docs/src/pages/templates/dashboard.astro`**

```astro
---
import DataTable from "../../components/DataTable.astro";
import DashboardActivity from "../../demos/templates/DashboardActivity";
import Base from "../../layouts/Base.astro";

const STATS = [
  { label: "Active projects", value: "12", note: "2 more than last week" },
  { label: "Proofs waiting", value: "3", note: "Oldest is 2 days old" },
  { label: "Hours logged", value: "164", note: "Of 180 planned" },
  { label: "Invoices due", value: "4", note: "1 overdue" },
];

const PROJECTS = [
  { name: "Museum wayfinding", lead: "A. Keller", due: "12 Nov", tone: "success", status: "On track" },
  { name: "Annual report", lead: "M. Rossi", due: "28 Nov", tone: "accent", status: "In review" },
  { name: "Type specimen", lead: "L. Weber", due: "5 Dec", tone: "warning", status: "At risk" },
  { name: "Signage refresh", lead: "J. Frei", due: "19 Dec", tone: "danger", status: "Blocked" },
];
---
<Base title="Studio dashboard" description="Template: a dashboard with figures, a project table and tabbed activity.">
  <div class="sw-grid" data-layout="hanging" data-page-grid>
    <p class="sw-type-label sw-text-secondary">Template · Dashboard</p>
    <div class="docs-content">
      <h1>Studio dashboard</h1>
      <p class="sw-text-secondary">Week 45 · Updated at 09:40</p>
    </div>

    <h2 class="sw-type-label sw-text-secondary">01 / Figures</h2>
    <ul class="docs-stats">
      {
        STATS.map((s) => (
          <li class="sw-card">
            <span class="sw-type-label sw-text-secondary">{s.label}</span>
            <span class="sw-type-h2">{s.value}</span>
            <span class="sw-type-caption sw-text-secondary">{s.note}</span>
          </li>
        ))
      }
    </ul>

    <h2 class="sw-type-label sw-text-secondary">02 / Projects</h2>
    <DataTable id="projects-caption" caption="Projects" columns={["Project", "Lead", "Due", "Status"]}>
      {
        PROJECTS.map((p) => (
          <tr>
            <td>{p.name}</td>
            <td>{p.lead}</td>
            <td>{p.due}</td>
            <td>
              <span class="sw-tag" data-tone={p.tone}>
                {p.status}
              </span>
            </td>
          </tr>
        ))
      }
    </DataTable>

    <h2 class="sw-type-label sw-text-secondary">03 / Activity</h2>
    <!-- Astro islands are display: contents, so the wrapper is the grid item the hanging layout places. -->
    <div><DashboardActivity client:load /></div>
  </div>
</Base>
```

- [ ] **Step 5: Run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src apps/docs/e2e/templates.spec.ts
git commit -m "feat(docs): dashboard template"
```

---

### Task 12: Landing page template

**Files:**
- Create: `apps/docs/src/pages/templates/landing.astro`
- Modify: `apps/docs/e2e/templates.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `apps/docs/e2e/templates.spec.ts`:

```ts
test("landing: a display headline, two calls to action and six staggered features", async ({ page }) => {
  await page.goto("/templates/landing/");
  await expect(page.locator("h1")).toHaveClass(/sw-type-display/);
  await expect(page.getByRole("link", { name: "Browse components" })).toHaveAttribute("href", "/components/");
  await expect(page.getByRole("link", { name: "Read the principles" })).toHaveAttribute("href", "/");
  await expect(page.locator(".sw-reveal[data-stagger] > li")).toHaveCount(6);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test templates --project=chromium`

Expected: the landing test FAILS (404).

- [ ] **Step 3: Write `apps/docs/src/pages/templates/landing.astro`**

```astro
---
import CodeBlock from "../../components/CodeBlock.astro";
import Base from "../../layouts/Base.astro";

const FEATURES = [
  { title: "Fluid grid", body: "Four, eight or twelve columns, chosen by the container rather than the screen." },
  { title: "Calm type", body: "Geist in a short scale, with headings smaller than habit suggests." },
  { title: "Checked colour", body: "Every pairing passes 4.5:1, enforced when the tokens build." },
  { title: "Two themes", body: "Alpine and Zürich, each in light and dark, switchable on any element." },
  { title: "HTML first", body: "A class contract that works without JavaScript, mirrored by thin React components." },
  { title: "Optional motion", body: "Scroll reveals and page transitions in a separate stylesheet, off for reduced motion." },
];

const INSTALL = `<link rel="stylesheet" href="node_modules/@raster/css/dist/raster.css" />

<main class="sw-container sw-section">
  <div class="sw-grid" data-layout="hanging">…</div>
</main>`;
---
<Base title="Raster for studios" description="Template: a landing page with a display headline, features and a closing call to action.">
  <div class="sw-grid" data-layout="split-1-2" data-page-grid>
    <p class="sw-type-label sw-text-secondary">Raster · Version 1</p>
    <div class="docs-hero">
      <h1 class="sw-type-display">Design on the grid, ship on the web.</h1>
      <p class="docs-lead sw-measure sw-text-secondary">
        A Swiss Style design system for studios that care about alignment, legibility and restraint.
      </p>
      <div class="sw-stack" data-direction="row" data-gap="3">
        <a class="sw-button" data-variant="primary" href="/components/">Browse components</a>
        <a class="sw-button" data-variant="secondary" href="/">Read the principles</a>
      </div>
    </div>
  </div>

  <hr class="sw-rule" data-variant="signal" />

  <section class="sw-section" aria-labelledby="features-title">
    <div class="sw-grid" data-layout="hanging">
      <h2 id="features-title" class="sw-type-label sw-text-secondary">What you get</h2>
      <ul class="sw-reveal docs-feature-list" data-stagger>
        {
          FEATURES.map((f) => (
            <li class="sw-card">
              <h3 class="sw-type-h4">{f.title}</h3>
              <p class="sw-text-secondary">{f.body}</p>
            </li>
          ))
        }
      </ul>
    </div>
  </section>

  <section class="sw-section" aria-labelledby="start-title">
    <div class="sw-grid" data-layout="split-5-7">
      <h2 id="start-title">Start with the class contract.</h2>
      <div class="docs-prose">
        <p class="sw-measure">
          Link one stylesheet and write HTML. Add the React components when something needs to
          respond to input.
        </p>
        <CodeBlock code={INSTALL} label="Starting markup" />
      </div>
    </div>
  </section>
</Base>
```

- [ ] **Step 4: Run the gates**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=chromium`

Expected: PASS. The axe runs use reduced motion, so the staggered cards are fully visible.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/pages/templates/landing.astro apps/docs/e2e/templates.spec.ts
git commit -m "feat(docs): landing page template"
```

---

### Task 13: Visual regression

**Files:**
- Modify: `apps/docs/playwright.config.ts`
- Create: `apps/docs/e2e/visual.spec.ts`, `apps/docs/e2e/__screenshots__/` (generated baselines)

- [ ] **Step 1: Update `apps/docs/playwright.config.ts`**

Replace the file with:

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 4388;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Baselines are per platform (…-darwin.png); regenerate them on a new OS with --update-snapshots.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  expect: {
    toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.001 },
  },
  webServer: {
    // Astro 7 tracks preview servers in a lock file; --ignore-lock keeps this one in the foreground.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: Write `apps/docs/e2e/visual.spec.ts`**

```ts
import { expect, type Page, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { builtPages } from "./pages";
import { COMBOS, useSettings } from "./settings";

const WIDTHS = [360, 768, 1440] as const;
const pages = builtPages();
const componentPages = pages.filter((p) => /^\/components\/[^/]+\/$/.test(p));
const templatePages = pages.filter((p) => /^\/templates\/[^/]+\/$/.test(p));
const slug = (path: string) => path.split("/").filter(Boolean).at(-1) ?? "home";

async function open(page: Page, path: string, combo: (typeof COMBOS)[number], width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await useSettings(page, { ...combo, motion: "reduce" });
  await page.goto(path);
  await waitForIslands(page);
  await page.evaluate(() => document.fonts.ready);
}

for (const combo of COMBOS) {
  for (const width of WIDTHS) {
    const variant = `${combo.theme}-${combo.mode}-${width}`;

    test.describe(variant, () => {
      for (const path of componentPages) {
        test(`examples on ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          // Code is text and covered by unit tests; these screenshots cover what renders.
          await page.addStyleTag({ content: ".docs-example-code { display: none !important; }" });
          const examples = page.locator("figure.docs-example");
          const count = await examples.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(examples.nth(i)).toHaveScreenshot(`${slug(path)}-${i + 1}-${variant}.png`);
          }
        });
      }

      for (const path of templatePages) {
        test(`template ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          await expect(page).toHaveScreenshot(`template-${slug(path)}-${variant}.png`, { fullPage: true });
        });
      }
    });
  }
}
```

- [ ] **Step 3: Generate the baselines**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test --project=visual --update-snapshots`

Expected: every test passes and writes PNGs into `apps/docs/e2e/__screenshots__/`. That is roughly 35 examples × 12 variants plus 3 templates × 12.

- [ ] **Step 4: Prove the baselines are stable**

Run: `pnpm --filter @raster/docs exec playwright test --project=visual`

Expected: PASS with no diffs.

If any screenshot is flaky (it differs between two runs with no code change), find the cause rather than raising `maxDiffPixelRatio`. Likely causes:
- an island that has not hydrated;
- a font that is not ready;
- a caret or animation.

Fix it, regenerate, and re-run.

- [ ] **Step 5: Sanity-check a few baselines by eye**

Open three of the generated PNGs and confirm they show the intended theme and width:
- `button-1-alpine-light-1440-darwin.png`
- `select-1-zurich-dark-360-darwin.png`
- `template-dashboard-zurich-light-768-darwin.png`

Use the Read tool on the image file.

- [ ] **Step 6: Run the whole e2e suite**

Run: `pnpm e2e`

Expected: PASS for both projects.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/playwright.config.ts apps/docs/e2e/visual.spec.ts apps/docs/e2e/__screenshots__
git commit -m "test(docs): visual regression for every example and template in four combinations at three widths"
```

---

### Task 14: Spec updates and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-04-raster-design-system-design.md`

- [ ] **Step 1: Mark the baseline and scales done (§3, §5)**

Replace:

```
The docs-header toggle arrived with the docs site (Plan 4a); the 4px baseline stripe moves to Plan 4b.
```

with:

```
The docs-header toggle arrived with the docs site (Plan 4a) and the 4px baseline stripe in Plan 4b.
```

Replace:

```
the scales are added to the DTCG JSON and the docs colour page in Plan 4b.
```

with:

```
the scales live in `@raster/tokens` (`SCALES`), the DTCG JSON (`themes.<name>.scales`) and the docs colour page, and a test proves each role maps onto its stop.
```

- [ ] **Step 2: Update §10 (the "Visual regression" row)**

Replace the "Visual regression" row with:

```
| Visual regression | Every docs example and template × 4 combos × 360 / 768 / 1440px; baselines committed per platform (generated on macOS) | Playwright screenshots |
```

- [ ] **Step 3: Add to §11 after the "Docs site (Plan 4a)" bullet**

```markdown
- **Docs site (Plan 4b).**
  - **Snippets:** `cleanMarkup` reduces server-rendered React Aria markup to the class contract. It turns visually hidden wrappers into `.sw-sr-only`, removes `tabindex` from native controls and collection placeholders, drops references to elements that are not rendered, and renames the generated ids it keeps. Behaviour-heavy components (Select, Dialog, Menu, Tooltip, Toast, Tabs) show only the React snippet.
  - **Demo hygiene:** demo headings start at level 3, and landmark names inside demos differ from the site's. The axe structure rules (`heading-order`, `landmark-unique`) enforce both.
  - **Visual baselines:** screenshots are platform-specific. A Linux CI run needs its own baselines (`--update-snapshots` once, committed as `*-linux.png`).
```

- [ ] **Step 4: Run the full verification**

Run: `pnpm verify`

Expected:
- **Build:** all packages build, and the docs build reports 42 pages: home, 4 foundations, themes, the components index, 31 components, the templates index and 3 templates.
- **Lint and typecheck:** clean.
- **Unit tests:** tokens (now with scales), css, react and docs all pass.
- **e2e:** both projects pass.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-11-04-raster-design-system-design.md
git commit -m "docs(spec): record scales, baseline, snippet cleanup and visual baselines"
```

---

## Self-review against the spec

- **§1, criterion 1:** HTML snippets now cover the form components with contract-faithful markup (Task 1). Templates are written in the class contract (Tasks 10–12).
- **§1, criterion 4:** the a11y gate runs on all 42 pages, and the open overlays are scanned too (Task 8).
- **§3:** the 4px baseline stripe (Task 3), shown on the grid page (Task 4).
- **§5:** scales in the source, the JSON and the colour page, with role-mapping tests (Tasks 2 and 4).
- **§6:** all 31 version 1 components documented (Tasks 5–9, with 13 from Plan 4a).
- **§8:**
  - **Keyboard walkthroughs:** Dialog focus trap and return, Menu, Tooltip, Toast and Tabs (Tasks 8 and 9).
  - **Reflow:** 320px for every new page (the a11y gate).
- **§9:** component pages and the three templates (Tasks 5–12).
- **§10:** visual regression at three widths in four combinations (Task 13); keyboard walkthroughs of Dialog and Menu (Task 8).
- **§11:** updated (Task 14).
