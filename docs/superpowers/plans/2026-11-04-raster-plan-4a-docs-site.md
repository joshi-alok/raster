# Raster Plan 4a: Docs Site and Page Gates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- **Docs site:** an Astro + MDX app, `apps/docs`, built entirely with Raster. It has a site shell, the principles page, the four foundations pages, the theme playground, and the component pages for the Layout, Type and Actions groups (13 of 31).
- **Page gates:** Playwright runs axe on every built page in all four theme and mode combinations, checks reflow at 320px, and tests the site's own behaviour.

**Architecture:**
- **Pages are HTML-first.** `.astro` files write the `sw-` class contract directly, the same markup `@raster/css` documents. React components appear only inside `.tsx` files under `src/demos/`. This dogfoods success criterion 1 (CSS-only and React render the same).
- **Islands are whole demos.** Astro passes an island's children as static HTML, so composite React Aria components (Tabs → TabList → Tab) cannot be assembled in `.astro` or MDX. Each interactive demo is one `.tsx` default export rendered as a single island. Static demos render on the server with no directive.
- **Snippets come from the demos.** Each example shows its demo file's source (imported with `?raw`) as the React snippet. For static demos it also shows an HTML snippet: the demo rendered with `renderToStaticMarkup`, stripped of React Aria runtime attributes and formatted with Prettier. Snippets therefore can never drift from what renders.
- **Component pages are a content collection.** Each MDX file has frontmatter (`group`, `order`, `summary`, `interactive`, `props`, `a11y`) validated by a Zod schema. One route renders breadcrumbs, the examples, a props table, accessibility notes and previous/next links.
- **Display settings** (theme, mode, motion, grid overlay) live in `localStorage`. An inline head script applies theme, mode and motion before first paint; a module script binds the toggle buttons and the grid overlay.
- **Gates read the build.** The Playwright suite lists every `dist/**/index.html`, so new pages (Plan 4b) are gated automatically.

**Tech Stack:**
- **Astro 7.4.1** with `@astrojs/mdx` 8.1.0 and `@astrojs/react` 7.1.0. These are the newest versions that run on this machine's Node 22.22.1: astro 7.4.2+, mdx 8.1.1+ and react 7.1.1+ require Node ≥ 22.23.4.
- **Prettier 3.9.10** (standalone, HTML plugin) for HTML snippets.
- **Playwright 1.64.1** and **@axe-core/playwright 4.14.0**. Playwright 1.64.1 uses Chromium revision 1248, which is already in `~/Library/Caches/ms-playwright`, so no browser download is needed.
- **Vitest 3.2.7** and **jsdom 26.1.0** for unit tests, plus the existing stack (React 19.1.10, React Aria Components 1.22.1, lucide-react).

**Spec:**
- **§1:** success criteria 1 (CSS-only and React render the same) and 4 (axe on every docs page).
- **§8:** reflow at 320px, keyboard operability, focus not obscured, skip link.
- **§9:** principles, foundations (grid with a live overlay toggle in the header, type specimen, contrast table from `tokens.json`, replayable motion demos), component pages (live demo, HTML and React snippets, props table, accessibility notes) and the theme playground.
- **§10:** the "Pages" row (axe on every docs page).
- **§11:** the docs-site notes (hydration, stylesheet order, page transitions, sticky header).

**Builds on Plans 1–3b (merged):**
- **Packages:**
  - `@raster/tokens` exports TypeScript source from `.` (`contrastPairs`, `contrastRatio`, `foundationTokens`, `TYPE_STEPS`, `ROLES`, `tokensJson`) and the built `./tokens.json`.
  - `@raster/css` exports `./raster.css` and `./motion.css`.
  - `@raster/react` exports `dist/` (built with `tsc`).
- **Class contract used directly in `.astro` files:**
  - **Header:** `.sw-header[data-sticky]` > `.sw-skip-link` + `.sw-header-inner` > `.sw-header-brand`, `nav.sw-header-nav`, `.sw-header-actions`. Nav links are `.sw-link`, with `aria-current="page"` on the current one.
  - **Breadcrumbs:** `nav[aria-label]` > `ol.sw-breadcrumbs` > `li.sw-breadcrumb` (link, then `span.sw-breadcrumb-separator[aria-hidden]`). The last item is `.sw-link[aria-current="page"]`.
  - **Table:** `div.sw-table-wrap[role=region][tabindex=0][aria-labelledby=<caption id>]` > `table.sw-table` > `caption`, `thead`, `tbody`.
  - **Grid:** `.sw-grid` must sit inside a size container. `.sw-container`, `.sw-section` and `.sw-col` are containers; children of a `data-layout` grid are **not**. `data-layout="hanging"` alternates narrow and wide children. `data-grid-debug` draws the column overlay.
  - **Type and utilities:** `.sw-type-{display,h1,h2,h3,h4,body,caption,label}`, `.sw-measure`, `.sw-text-secondary`, `.sw-text-muted`.
  - **Line-height caveat:** `p`, `li` and headings take their size from `--_size` and `--_leading`. To resize them, set those variables, not `font-size`.
- **Motion:** `motion.css` provides `.sw-reveal` (with `[data-stagger]`) and `.sw-weight-shift`. Both switch off under `prefers-reduced-motion` and under `[data-motion="reduce"]` on an ancestor.
- **ThemeRegion:** portals overlays into `.sw-portal-host` at the end of `<body>`, carrying the region's `data-theme` and `data-mode`.

**Facts verified in a throwaway spike (Astro 7.4.1, this repo):**
- **Build:**
  - `@raster/react` islands hydrate.
  - MDX content collections work with `glob` from `astro/loaders` and `z` from `astro/zod`.
  - JSON imports of `@raster/tokens/tokens.json` work.
- **CSS bundling:** Vite merges the CSS into one file. It drops the `@layer` order statements but keeps the layer blocks in canonical first-appearance order (reset, tokens, base, layout, components, utilities), which is equivalent.
- **Islands:** a React Aria composite written in `.astro` (`<Tabs client:load><TabList>…`) **fails** to prerender: `TabPanel` reads `null` context because the children arrive as static HTML. The same composite inside one `.tsx` file works.
- **HTML snippets:** `renderToStaticMarkup` plus Prettier 3.9.10 (`htmlWhitespaceSensitivity: "ignore"`) produces clean snippets once these are removed: `data-rac=""`, `data-react-aria-pressable="true"`, `id="react-aria-…"`, `tabindex="0"` on `button` and `a`, and Lucide `<svg>` bodies.
- **Preview server:** `astro preview` in Astro 7 keeps a lock file. A second instance prints "already running" and exits, so Playwright's `webServer` must pass `--ignore-lock`.
- **Type checking:** `astro check` cannot resolve `@astrojs/check` under pnpm here, so the type check is plain `tsc --noEmit` over the `.ts`/`.tsx` files (`src/lib`, `src/demos`, `test`, `e2e`, configs). `.astro` and `.mdx` files are checked by the build.
- **Unit tests:** Vitest 3.2.7 runs in the docs app beside Astro's Vite 8, with `@raster/react` aliased to its source so unit tests do not need a build.
- **Playwright:** screenshots are named per platform, for example `home-chromium-darwin.png`. This matters for Plan 4b.

## Plan series

1. Tokens and CSS foundations (done).
2. React package and static components (done).
3. Forms on React Aria (done).
4. Overlays (done).
5. Navigation and expressive motion (done).
6. **Plan 4a (this plan):** the docs site shell, foundations, the theme playground, the Layout, Type and Actions component pages, and the page gates.
7. **Plan 4b:** the Forms, Display and Overlay-and-navigation component pages (18), the templates (editorial article, dashboard, landing page), visual regression (4 combinations × 360, 768 and 1440px), and keyboard walkthroughs of Dialog and Menu.

---

## File structure

```
.gitignore                                   + .astro/, test-results/, playwright-report/
package.json                                 + "e2e" and "verify" scripts

apps/docs/
  package.json, astro.config.mjs, tsconfig.json, vitest.config.ts, playwright.config.ts
  src/
    content.config.ts                        components collection (Zod schema)
    lib/
      settings.ts                            Settings, parse/apply/bind, INIT_SCRIPT
      nav.ts                                 NAV, FOUNDATIONS, ariaCurrent
      html-snippet.ts                        htmlSnippet(Demo)
      contrast-table.ts                      contrastTables(tokens.json)
      components.ts                          GROUPS, sortComponents, groupComponents, neighbours
    styles/docs.css                          docs-only classes (tokens only)
    layouts/Base.astro                       html shell, header, main#main, footer
    layouts/DocPage.astro                    hanging page grid: aside + article
    components/
      SiteHeader.astro, SiteFooter.astro, FoundationsNav.astro
      CodeBlock.astro, Example.astro, DataTable.astro, PropsTable.astro
    pages/
      index.astro                            Principles
      foundations/{grid,type,colour,motion}.astro
      themes.astro
      components/index.astro, components/[slug].astro
    content/components/                      13 .mdx files (Layout, Type, Actions)
    demos/                                   one .tsx per example
  test/                                      Vitest unit tests
  e2e/                                       Playwright: pages.ts, settings.ts, islands.ts, *.spec.ts

docs/superpowers/specs/2026-11-04-raster-design-system-design.md   §9–§11 updates
```

**Conventions for every task:**
- Work on branch `raster/plan-4a-docs-site`.
- Commands run from the repo root unless a step says otherwise.
- `pnpm --filter @raster/docs <script>` runs a docs script.
- **Order:** `pnpm build` must run before `pnpm --filter @raster/docs typecheck` and before the e2e suite. The docs build needs `@raster/tokens/tokens.json`, `@raster/css/dist` and `@raster/react/dist`. `pnpm -r` builds in dependency order.
- **No raw colours** in `docs.css` or inline styles: use `var(--…)` tokens only. The one exception is the colour page's contrast-table swatches, which display token values as data.
- **No `<h1>` inside demos or page bodies.** Every page has exactly one `h1`, from `DocPage`, and the gate checks this.

---

### Task 1: Scaffold `apps/docs`

**Files:**
- Create: `apps/docs/package.json`, `apps/docs/astro.config.mjs`, `apps/docs/tsconfig.json`, `apps/docs/vitest.config.ts`, `apps/docs/src/pages/index.astro` (placeholder)
- Modify: `.gitignore`, `package.json` (root)

- [ ] **Step 1: Create the branch**

```bash
git checkout -b raster/plan-4a-docs-site
```

- [ ] **Step 2: Write `apps/docs/package.json`**

```json
{
  "name": "@raster/docs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --port 4388 --ignore-lock",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/mdx": "8.1.0",
    "@astrojs/react": "7.1.0",
    "@fontsource-variable/geist": "5.3.0",
    "@fontsource-variable/geist-mono": "5.3.0",
    "@raster/css": "workspace:*",
    "@raster/react": "workspace:*",
    "@raster/tokens": "workspace:*",
    "astro": "7.4.1",
    "lucide-react": "^1.68.0",
    "react": "19.1.10",
    "react-dom": "19.1.10"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.14.0",
    "@playwright/test": "1.64.1",
    "@types/node": "^22.0.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "jsdom": "26.1.0",
    "prettier": "3.9.10",
    "typescript": "5.9.3",
    "vitest": "3.2.7"
  }
}
```

- [ ] **Step 3: Write `apps/docs/astro.config.mjs`**

```js
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  // Every internal link ends in "/", so pages build to <path>/index.html and match exactly.
  trailingSlash: "always",
  integrations: [mdx(), react()],
});
```

- [ ] **Step 4: Write `apps/docs/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": ["src/lib", "src/demos", "test", "e2e", "playwright.config.ts", "vitest.config.ts"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["node"]
  }
}
```

- [ ] **Step 5: Write `apps/docs/vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Unit tests use the React source, so they run without building @raster/react first.
    alias: { "@raster/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)) },
  },
  esbuild: { jsx: "automatic" },
  test: { include: ["test/**/*.test.{ts,tsx}"] },
});
```

- [ ] **Step 6: Write a placeholder `apps/docs/src/pages/index.astro`**

Task 4 replaces this file.

```astro
---
import "@raster/css/raster.css";
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Raster</title>
  </head>
  <body>
    <main id="main" class="sw-container sw-section"><h1>Raster</h1></main>
  </body>
</html>
```

- [ ] **Step 7: Update `.gitignore` and the root scripts**

Append to `.gitignore`:

```
.astro/
test-results/
playwright-report/
```

In the root `package.json`, replace the `"scripts"` object with:

```json
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck",
    "e2e": "pnpm --filter @raster/docs run e2e",
    "verify": "pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm e2e"
  },
```

- [ ] **Step 8: Install and build**

Run: `pnpm install && pnpm build`

Expected:
- The install completes and updates `pnpm-lock.yaml`.
- The build ends with the docs app printing `1 page(s) built` and `Complete!`.
- `apps/docs/dist/index.html` exists.

If pnpm prints "Ignored build scripts" for any package, leave it, unless the build fails.

- [ ] **Step 9: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml apps/docs
git commit -m "chore(docs): scaffold the Astro docs app"
```

---

### Task 2: Display settings and navigation model

**Files:**
- Create: `apps/docs/src/lib/settings.ts`, `apps/docs/src/lib/nav.ts`
- Test: `apps/docs/test/settings.test.ts`, `apps/docs/test/nav.test.ts`

- [ ] **Step 1: Write the failing settings tests**

`apps/docs/test/settings.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  applySettings,
  bindSettings,
  DEFAULT_SETTINGS,
  INIT_SCRIPT,
  parseSettings,
  type Settings,
  STORAGE_KEY,
} from "../src/lib/settings";

function memoryStorage(initial?: Settings) {
  const data = new Map<string, string>();
  if (initial) data.set(STORAGE_KEY, JSON.stringify(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-mode");
  document.documentElement.removeAttribute("data-motion");
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("parseSettings", () => {
  it("returns the defaults for missing or corrupt storage", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{not json")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("42")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid fields and replaces invalid ones with defaults", () => {
    expect(parseSettings(JSON.stringify({ theme: "zurich", mode: "sepia", grid: "on" }))).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "zurich",
      grid: "on",
    });
  });
});

describe("applySettings", () => {
  it("sets non-default theme, mode and motion on the root and toggles the page grid overlay", () => {
    document.body.innerHTML = `<div data-page-grid></div><div class="other"></div>`;
    const root = document.documentElement;
    applySettings(root, { theme: "zurich", mode: "dark", motion: "reduce", grid: "on" });
    expect(root.dataset.theme).toBe("zurich");
    expect(root.dataset.mode).toBe("dark");
    expect(root.dataset.motion).toBe("reduce");
    expect(document.querySelector("[data-page-grid]")!.hasAttribute("data-grid-debug")).toBe(true);
    expect(document.querySelector(".other")!.hasAttribute("data-grid-debug")).toBe(false);
  });

  it("removes the attributes for the defaults (Alpine, system mode, full motion, no overlay)", () => {
    document.body.innerHTML = `<div data-page-grid data-grid-debug></div>`;
    const root = document.documentElement;
    root.dataset.theme = "zurich";
    root.dataset.mode = "dark";
    root.dataset.motion = "reduce";
    applySettings(root, DEFAULT_SETTINGS);
    expect(root.hasAttribute("data-theme")).toBe(false);
    expect(root.hasAttribute("data-mode")).toBe(false);
    expect(root.hasAttribute("data-motion")).toBe(false);
    expect(document.querySelector("[data-page-grid]")!.hasAttribute("data-grid-debug")).toBe(false);
  });
});

describe("INIT_SCRIPT", () => {
  it.each<Settings>([
    { theme: "zurich", mode: "dark", motion: "reduce", grid: "on" },
    { theme: "alpine", mode: "light", motion: "full", grid: "off" },
    DEFAULT_SETTINGS,
  ])("applies theme, mode and motion exactly as applySettings does (%o)", (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    new Function(INIT_SCRIPT)();
    const fromScript = ["data-theme", "data-mode", "data-motion"].map((a) =>
      document.documentElement.getAttribute(a),
    );
    const expected = document.createElement("html");
    applySettings(expected, settings);
    expect(fromScript).toEqual(["data-theme", "data-mode", "data-motion"].map((a) => expected.getAttribute(a)));
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(() => new Function(INIT_SCRIPT)()).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("bindSettings", () => {
  const markup = `
    <button data-setting="theme" data-value="alpine"></button>
    <button data-setting="theme" data-value="zurich"></button>
    <button data-setting="grid" data-value="on" data-toggle></button>
    <div data-page-grid></div>`;

  it("applies stored settings and marks the matching buttons pressed", () => {
    document.body.innerHTML = markup;
    bindSettings(document, memoryStorage({ ...DEFAULT_SETTINGS, theme: "zurich" }));
    expect(document.documentElement.dataset.theme).toBe("zurich");
    const [alpine, zurich] = document.querySelectorAll<HTMLButtonElement>('[data-setting="theme"]');
    expect(alpine.getAttribute("aria-pressed")).toBe("false");
    expect(zurich.getAttribute("aria-pressed")).toBe("true");
  });

  it("updates, applies and stores a setting on click", () => {
    document.body.innerHTML = markup;
    const storage = memoryStorage();
    bindSettings(document, storage);
    document.querySelector<HTMLButtonElement>('[data-value="zurich"]')!.click();
    expect(document.documentElement.dataset.theme).toBe("zurich");
    expect(parseSettings(storage.getItem(STORAGE_KEY)).theme).toBe("zurich");
  });

  it("flips a data-toggle button back to the default when pressed again", () => {
    document.body.innerHTML = markup;
    bindSettings(document, memoryStorage());
    const grid = document.querySelector<HTMLButtonElement>('[data-setting="grid"]')!;
    const pageGrid = document.querySelector("[data-page-grid]")!;
    grid.click();
    expect(grid.getAttribute("aria-pressed")).toBe("true");
    expect(pageGrid.hasAttribute("data-grid-debug")).toBe(true);
    grid.click();
    expect(grid.getAttribute("aria-pressed")).toBe("false");
    expect(pageGrid.hasAttribute("data-grid-debug")).toBe(false);
  });
});
```

- [ ] **Step 2: Write the failing nav tests**

`apps/docs/test/nav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ariaCurrent, FOUNDATIONS, NAV } from "../src/lib/nav";

const item = (label: string) => NAV.find((i) => i.label === label)!;

describe("ariaCurrent", () => {
  it("marks an exact match", () => {
    expect(ariaCurrent("/", item("Principles"))).toBe("page");
    expect(ariaCurrent("/themes/", item("Themes"))).toBe("page");
  });

  it("marks a section link on any page inside the section", () => {
    expect(ariaCurrent("/foundations/type/", item("Foundations"))).toBe("page");
    expect(ariaCurrent("/components/button/", item("Components"))).toBe("page");
  });

  it("does not treat the home page as a section", () => {
    expect(ariaCurrent("/components/", item("Principles"))).toBeUndefined();
  });

  it("tolerates a missing trailing slash", () => {
    expect(ariaCurrent("/foundations/type", FOUNDATIONS[1])).toBe("page");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @raster/docs test`

Expected: FAIL, because `../src/lib/settings` and `../src/lib/nav` do not exist.

- [ ] **Step 4: Implement `apps/docs/src/lib/settings.ts`**

```ts
export type Settings = {
  theme: "alpine" | "zurich";
  mode: "system" | "light" | "dark";
  motion: "full" | "reduce";
  grid: "off" | "on";
};

export const STORAGE_KEY = "raster-docs:settings";

export const DEFAULT_SETTINGS: Settings = { theme: "alpine", mode: "system", motion: "full", grid: "off" };

const ALLOWED: { [K in keyof Settings]: readonly Settings[K][] } = {
  theme: ["alpine", "zurich"],
  mode: ["system", "light", "dark"],
  motion: ["full", "reduce"],
  grid: ["off", "on"],
};

function isSetting(key: string): key is keyof Settings {
  return Object.hasOwn(ALLOWED, key);
}

function isValue<K extends keyof Settings>(key: K, value: unknown): value is Settings[K] {
  return (ALLOWED[key] as readonly unknown[]).includes(value);
}

/** Reads stored settings; any missing or invalid field falls back to its default. */
export function parseSettings(raw: string | null): Settings {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    // Corrupt storage: use the defaults.
  }
  const pick = <K extends keyof Settings>(key: K): Settings[K] => {
    const stored = data[key];
    return isValue(key, stored) ? stored : DEFAULT_SETTINGS[key];
  };
  return { theme: pick("theme"), mode: pick("mode"), motion: pick("motion"), grid: pick("grid") };
}

function setOrRemove(el: Element, name: string, value: string | null): void {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

/**
 * Writes settings onto the root element and the page grids ([data-page-grid]).
 * Alpine, system mode and full motion are the CSS defaults, so their attributes are removed.
 */
export function applySettings(root: HTMLElement, settings: Settings): void {
  setOrRemove(root, "data-theme", settings.theme === "alpine" ? null : settings.theme);
  setOrRemove(root, "data-mode", settings.mode === "system" ? null : settings.mode);
  setOrRemove(root, "data-motion", settings.motion === "full" ? null : settings.motion);
  root.ownerDocument.querySelectorAll("[data-page-grid]").forEach((grid) => {
    grid.toggleAttribute("data-grid-debug", settings.grid === "on");
  });
}

/**
 * Binds every button[data-setting][data-value]: aria-pressed mirrors the current setting, and a
 * click sets, applies and stores it. A button with data-toggle flips back to the default when
 * pressed again (the header's Grid button).
 */
export function bindSettings(doc: Document, storage: Pick<Storage, "getItem" | "setItem">): void {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): start from the defaults.
  }
  let settings = parseSettings(raw);
  const buttons = Array.from(doc.querySelectorAll<HTMLButtonElement>("button[data-setting][data-value]"));

  const render = () => {
    applySettings(doc.documentElement, settings);
    for (const button of buttons) {
      const key = button.dataset.setting ?? "";
      const pressed = isSetting(key) && settings[key] === button.dataset.value;
      button.setAttribute("aria-pressed", String(pressed));
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const key = button.dataset.setting ?? "";
      const value = button.dataset.value;
      if (!isSetting(key) || !isValue(key, value)) return;
      const next = button.hasAttribute("data-toggle") && settings[key] === value ? DEFAULT_SETTINGS[key] : value;
      settings = { ...settings, [key]: next } as Settings;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Storage unavailable: the setting still applies to this page.
      }
      render();
    });
  }
  render();
}

/**
 * Inline <head> script: applies theme, mode and motion before first paint, mirroring
 * applySettings. The grid overlay waits for bindSettings, since the page grid is not parsed yet.
 */
export const INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}");var r=document.documentElement;if(s.theme==="zurich")r.setAttribute("data-theme","zurich");if(s.mode==="light"||s.mode==="dark")r.setAttribute("data-mode",s.mode);if(s.motion==="reduce")r.setAttribute("data-motion","reduce");}catch(e){}})();`;
```

- [ ] **Step 5: Implement `apps/docs/src/lib/nav.ts`**

```ts
export type NavItem = {
  href: string;
  label: string;
  /** Path prefix that also counts as current (a section link). */
  section?: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Principles" },
  { href: "/foundations/grid/", label: "Foundations", section: "/foundations/" },
  { href: "/components/", label: "Components", section: "/components/" },
  { href: "/themes/", label: "Themes" },
];

export const FOUNDATIONS: NavItem[] = [
  { href: "/foundations/grid/", label: "Grid and spacing" },
  { href: "/foundations/type/", label: "Type" },
  { href: "/foundations/colour/", label: "Colour" },
  { href: "/foundations/motion/", label: "Motion" },
];

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** "page" when the link is the current page, or the section that contains it. */
export function ariaCurrent(pathname: string, item: NavItem): "page" | undefined {
  const path = withSlash(pathname);
  if (path === item.href) return "page";
  return item.section !== undefined && path.startsWith(item.section) ? "page" : undefined;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @raster/docs test`

Expected: PASS (`settings.test.ts` and `nav.test.ts`).

- [ ] **Step 7: Commit**

```bash
git add apps/docs/src/lib apps/docs/test
git commit -m "feat(docs): display settings and navigation model"
```

---

### Task 3: HTML snippets, code blocks, examples and tables

**Files:**
- Create: `apps/docs/src/lib/html-snippet.ts`, `apps/docs/src/components/CodeBlock.astro`, `apps/docs/src/components/Example.astro`, `apps/docs/src/components/DataTable.astro`
- Test: `apps/docs/test/html-snippet.test.tsx`

- [ ] **Step 1: Write the failing tests**

`apps/docs/test/html-snippet.test.tsx`:

```tsx
import { Button, IconButton, Stack } from "@raster/react";
import { X } from "lucide-react";
import { describe, expect, it } from "vitest";
import { htmlSnippet } from "../src/lib/html-snippet";

describe("htmlSnippet", () => {
  it("removes React Aria runtime attributes and formats one element per line", async () => {
    const Demo = () => (
      <Stack direction="row" gap={3}>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
      </Stack>
    );
    const html = await htmlSnippet(Demo);
    expect(html).toBe(
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
    expect(html).toContain('aria-label="Close"');
  });

  it("keeps tabindex on elements that are not natively focusable", async () => {
    const Demo = () => (
      <div tabIndex={0} role="region" aria-label="Scrollable">
        x
      </div>
    );
    expect(await htmlSnippet(Demo)).toContain('tabindex="0"');
  });
});
```

The first test's attribute order (`class`, then `data-gap`, then `data-direction`) is the order `Stack` renders them. If React prints them in a different order, keep the test's lines as React renders them; the point is that no `data-rac`, `id`, `tabindex` or `data-react-aria-pressable` attributes remain.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @raster/docs exec vitest run html-snippet`

Expected: FAIL, because `../src/lib/html-snippet` does not exist.

- [ ] **Step 3: Implement `apps/docs/src/lib/html-snippet.ts`**

```ts
import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as htmlPlugin from "prettier/plugins/html";
import { format } from "prettier/standalone";

/**
 * The HTML a static demo renders, as a readable snippet of the @raster/css class contract.
 * React Aria's runtime attributes (generated ids, press markers, tabindex on native controls) are
 * removed, and Lucide icon paths are collapsed, since none of them is part of the contract.
 */
export async function htmlSnippet(Demo: ComponentType): Promise<string> {
  const markup = renderToStaticMarkup(createElement(Demo))
    .replace(/ data-rac=""/g, "")
    .replace(/ data-react-aria-pressable="true"/g, "")
    .replace(/ id="react-aria-[^"]*"/g, "")
    .replace(/(<(?:button|a)\b[^>]*?) tabindex="0"/g, "$1")
    .replace(/<svg\b[^>]*class="lucide[^"]*"[^>]*>.*?<\/svg>/g, '<svg aria-hidden="true"><!-- Lucide icon --></svg>');
  const formatted = await format(markup, {
    parser: "html",
    plugins: [htmlPlugin],
    printWidth: 88,
    htmlWhitespaceSensitivity: "ignore",
  });
  return formatted.trim();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @raster/docs exec vitest run html-snippet`

Expected: PASS (3 tests).

- [ ] **Step 5: Write `apps/docs/src/components/CodeBlock.astro`**

```astro
---
interface Props {
  code: string;
  /** Accessible name of the scrollable region, unique on the page (for example "React code: Variants"). */
  label: string;
}
const { code, label } = Astro.props;
---
<pre class="docs-code" tabindex="0" role="region" aria-label={label}><code>{code.trim()}</code></pre>
```

The `tabindex` and the named region let keyboard users scroll long lines (axe `scrollable-region-focusable`).

- [ ] **Step 6: Write `apps/docs/src/components/Example.astro`**

```astro
---
import type { ComponentType } from "react";
import { htmlSnippet } from "../lib/html-snippet";
import CodeBlock from "./CodeBlock.astro";

interface Props {
  /** Caption, unique on the page; it also names the code regions. */
  title: string;
  /** The demo file's source, imported with ?raw. Shown as the React snippet. */
  source: string;
  /** The demo component. When given, its rendered HTML is shown as the HTML snippet. Omit for interactive demos. */
  of?: ComponentType;
}

const { title, source, of } = Astro.props;
const html = of ? await htmlSnippet(of) : undefined;
---
<figure class="docs-example">
  <figcaption class="docs-example-title sw-type-label sw-text-secondary">{title}</figcaption>
  <div class="docs-example-demo"><slot /></div>
  <div class="docs-example-code">
    <p class="sw-type-label sw-text-secondary">React</p>
    <CodeBlock code={source} label={`React code: ${title}`} />
    {
      html && (
        <>
          <p class="sw-type-label sw-text-secondary">HTML</p>
          <CodeBlock code={html} label={`HTML code: ${title}`} />
        </>
      )
    }
  </div>
</figure>
```

- [ ] **Step 7: Write `apps/docs/src/components/DataTable.astro`**

This is the `.sw-table` HTML contract. Rows go in the default slot.

```astro
---
interface Props {
  /** Id of the caption, unique on the page; it names the scrollable region. */
  id: string;
  caption: string;
  columns: string[];
}
const { id, caption, columns } = Astro.props;
---
<div class="sw-table-wrap" role="region" aria-labelledby={id} tabindex="0">
  <table class="sw-table">
    <caption id={id}>{caption}</caption>
    <thead>
      <tr>{columns.map((column) => <th scope="col">{column}</th>)}</tr>
    </thead>
    <tbody>
      <slot />
    </tbody>
  </table>
</div>
```

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter @raster/docs typecheck`

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add apps/docs/src/lib/html-snippet.ts apps/docs/src/components apps/docs/test/html-snippet.test.tsx
git commit -m "feat(docs): HTML snippets from demos, code blocks, examples and tables"
```

---

### Task 4: Site shell (layouts, header, footer, docs styles)

**Files:**
- Create: `apps/docs/src/styles/docs.css`, `apps/docs/src/layouts/Base.astro`, `apps/docs/src/layouts/DocPage.astro`, `apps/docs/src/components/SiteHeader.astro`, `apps/docs/src/components/SiteFooter.astro`
- Modify: `apps/docs/src/pages/index.astro` (temporary content on `DocPage`; Task 6 writes the real page)

- [ ] **Step 1: Write `apps/docs/src/styles/docs.css`**

These are all the docs-only classes the plan uses. Later tasks only reference them.

```css
/*
 * Docs-site styles. Unlayered, so they override Raster's cascade layers.
 * Tokens only: no raw colours (the rule stylelint enforces in @raster/css).
 */

/* Shell */
.docs-brand {
  color: var(--text-primary);
  font-weight: 500;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.docs-brand:hover {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.docs-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.docs-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-inline-size: 0;
}

.docs-content > h2 {
  margin-block-start: var(--space-7);
}

.docs-lead {
  --_size: var(--text-h4-size);
  --_leading: var(--text-h4-leading);
}

.docs-local-nav ul,
.docs-plain-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-5);
  margin-block-start: var(--space-7);
  padding-block-start: var(--space-5);
  border-block-start: 1px solid var(--border);
}

/* Examples and code */
.docs-example {
  display: flex;
  flex-direction: column;
  margin: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.docs-example-title {
  padding: var(--space-3) var(--space-5);
  border-block-end: 1px solid var(--border);
}

/* A size container, so grids inside a demo respond to the frame, not the page. */
.docs-example-demo {
  container-type: inline-size;
  padding: var(--space-6) var(--space-5);
}

.docs-example-code {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5) var(--space-5);
  border-block-start: 1px solid var(--border);
}

.docs-code {
  margin: 0;
  padding: var(--space-4);
  overflow-x: auto;
  border-radius: var(--radius);
  background-color: var(--surface-subtle);
  color: var(--text-primary);
  font-size: var(--text-caption-size);
  line-height: 1.6;
  tab-size: 2;
}

/* Inset ring: the block scrolls, which would clip an outset outline. */
.docs-code:focus-visible {
  outline-offset: calc(-1 * var(--focus-width));
}

/* Demo-only filler for grid cells. */
.docs-cell {
  padding: var(--space-3);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
  font-family: var(--font-mono);
  font-size: var(--text-caption-size);
}

/* Display settings */
.docs-settings {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5) var(--space-7);
}

.docs-setting {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.docs-segment {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

/* Pressed: tint, accent border and weight, so the state never relies on colour alone. */
.docs-toggle[aria-pressed="true"] {
  border-color: var(--accent);
  background-color: var(--accent-subtle);
  color: var(--on-accent-subtle);
  font-weight: 500;
}

@media (forced-colors: active) {
  .docs-toggle[aria-pressed="true"] {
    border-color: Highlight;
    background-color: Highlight;
    color: HighlightText;
  }
}

.docs-footer {
  margin-block-start: var(--space-8);
  padding-block: var(--space-7);
  border-block-start: 1px solid var(--border);
}

.docs-footer-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Foundations */
.docs-frame {
  container-type: inline-size;
  max-inline-size: 100%;
  padding: var(--space-3);
  border: 1px dashed var(--border-strong);
}

.docs-frame[data-frame="360"] {
  inline-size: 360px;
}

.docs-frame[data-frame="720"] {
  inline-size: 720px;
}

.docs-figure {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.docs-space-bar {
  display: block;
  block-size: var(--space-3);
  background-color: var(--accent);
}

.docs-swatch {
  display: inline-block;
  flex: none;
  inline-size: var(--space-5);
  block-size: var(--space-5);
  vertical-align: middle;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
}

.docs-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
  gap: var(--space-3) var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-swatches li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.docs-specimen {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-4);
  border-block-start: 1px solid var(--border);
}

.docs-principles {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-principles li {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.docs-reveal-demo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 10rem), 1fr));
  gap: var(--space-4);
}

/* Themes */
.docs-theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-5);
}

.docs-theme-tile {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* Components index */
.docs-component-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-component-list li {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

- [ ] **Step 2: Write `apps/docs/src/components/SiteHeader.astro`**

```astro
---
import { ariaCurrent, NAV } from "../lib/nav";
const path = Astro.url.pathname;
---
<header class="sw-header" data-sticky>
  <a class="sw-skip-link" href="#main">Skip to content</a>
  <div class="sw-header-inner">
    <div class="sw-header-brand"><a class="docs-brand" href="/">Raster</a></div>
    <nav class="sw-header-nav" aria-label="Main">
      {NAV.map((item) => <a class="sw-link" href={item.href} aria-current={ariaCurrent(path, item)}>{item.label}</a>)}
    </nav>
    <div class="sw-header-actions">
      <button type="button" class="sw-button docs-toggle" data-variant="ghost" data-setting="grid" data-value="on" data-toggle aria-pressed="false">Grid</button>
    </div>
  </div>
</header>
```

- [ ] **Step 3: Write `apps/docs/src/components/SiteFooter.astro`**

```astro
---
const GROUPS = [
  { key: "theme", label: "Theme", options: [["alpine", "Alpine"], ["zurich", "Zürich"]] },
  { key: "mode", label: "Mode", options: [["system", "System"], ["light", "Light"], ["dark", "Dark"]] },
  { key: "motion", label: "Motion", options: [["full", "Full"], ["reduce", "Reduced"]] },
] as const;
---
<footer class="docs-footer">
  <div class="sw-container docs-footer-inner">
    <div class="sw-grid" data-layout="hanging">
      <h2 class="sw-type-label sw-text-secondary">Display</h2>
      <div class="docs-settings">
        {
          GROUPS.map((group) => (
            <div class="docs-setting" role="group" aria-labelledby={`setting-${group.key}`}>
              <span id={`setting-${group.key}`} class="sw-type-label sw-text-secondary">
                {group.label}
              </span>
              <div class="docs-segment">
                {group.options.map(([value, label]) => (
                  <button
                    type="button"
                    class="sw-button docs-toggle"
                    data-variant="secondary"
                    data-setting={group.key}
                    data-value={value}
                    aria-pressed="false"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </div>
    <p class="sw-type-caption sw-text-secondary">Raster, a Swiss Style design system. Set in Geist.</p>
  </div>
</footer>
```

- [ ] **Step 4: Write `apps/docs/src/layouts/Base.astro`**

```astro
---
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
// raster.css before motion.css (spec §11); docs.css last so its unlayered rules win.
import "@raster/css/raster.css";
import "@raster/css/motion.css";
import "../styles/docs.css";
import SiteFooter from "../components/SiteFooter.astro";
import SiteHeader from "../components/SiteHeader.astro";
import { INIT_SCRIPT } from "../lib/settings";

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title === "Raster" ? title : `${title} · Raster`}</title>
    <script is:inline set:html={INIT_SCRIPT} />
  </head>
  <body>
    <SiteHeader />
    <main id="main" tabindex="-1" class="sw-container sw-section">
      <slot />
    </main>
    <SiteFooter />
    <script>
      import { bindSettings } from "../lib/settings";
      bindSettings(document, localStorage);
    </script>
  </body>
</html>
```

- [ ] **Step 5: Write `apps/docs/src/layouts/DocPage.astro`**

```astro
---
import Base from "./Base.astro";

interface Props {
  title: string;
  /** Lead paragraph and meta description. */
  description: string;
  /** Mono label in the hanging column, for example the section name. */
  eyebrow: string;
}
const { title, description, eyebrow } = Astro.props;
---
<Base title={title} description={description}>
  <div class="sw-grid" data-layout="hanging" data-page-grid>
    <div class="docs-aside">
      <p class="sw-type-label sw-text-secondary">{eyebrow}</p>
      <slot name="aside" />
    </div>
    <article class="docs-content">
      <slot name="before-title" />
      <h1>{title}</h1>
      <p class="docs-lead sw-measure sw-text-secondary">{description}</p>
      <slot />
    </article>
  </div>
</Base>
```

- [ ] **Step 6: Point the placeholder home page at `DocPage`**

Replace `apps/docs/src/pages/index.astro`:

```astro
---
import DocPage from "../layouts/DocPage.astro";
---
<DocPage
  title="Raster"
  eyebrow="Principles"
  description="A Swiss Style design system for the web: a fluid grid, a calm hierarchy and accessibility as a constraint."
/>
```

- [ ] **Step 7: Build and inspect the output**

Run: `pnpm --filter @raster/docs build && grep -c 'class="sw-skip-link" href="#main"' apps/docs/dist/index.html && grep -c 'data-page-grid' apps/docs/dist/index.html && grep -c 'aria-current="page"' apps/docs/dist/index.html`

Expected: the build succeeds and each `grep -c` prints `1` (the skip link, one page grid, and "Principles" current).

- [ ] **Step 8: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): site shell with header, display settings and page layout"
```

---

### Task 5: Page gates (Playwright)

**Files:**
- Create: `apps/docs/playwright.config.ts`, `apps/docs/e2e/pages.ts`, `apps/docs/e2e/settings.ts`, `apps/docs/e2e/islands.ts`, `apps/docs/e2e/a11y.spec.ts`, `apps/docs/e2e/site.spec.ts`

- [ ] **Step 1: Write `apps/docs/playwright.config.ts`**

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
  webServer: {
    // Astro 7 tracks preview servers in a lock file; --ignore-lock keeps this one in the foreground.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 2: Write the e2e helpers**

`apps/docs/e2e/pages.ts`:

```ts
import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));

/** Every built page as a URL path ("/", "/components/button/"), read from dist/. */
export function builtPages(): string[] {
  if (!existsSync(DIST)) throw new Error("apps/docs/dist is missing: run `pnpm build` before the e2e tests.");
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== "_astro") walk(join(dir, entry.name));
      } else if (entry.name === "index.html") {
        const path = relative(DIST, dir).split(sep).join("/");
        pages.push(path ? `/${path}/` : "/");
      }
    }
  };
  walk(DIST);
  return pages.sort();
}
```

`apps/docs/e2e/settings.ts`:

```ts
import type { Page } from "@playwright/test";
import { DEFAULT_SETTINGS, type Settings, STORAGE_KEY } from "../src/lib/settings";

export const COMBOS = [
  { theme: "alpine", mode: "light" },
  { theme: "alpine", mode: "dark" },
  { theme: "zurich", mode: "light" },
  { theme: "zurich", mode: "dark" },
] as const satisfies ReadonlyArray<Pick<Settings, "theme" | "mode">>;

/** Stores display settings before every navigation of this page (they survive reloads). */
export async function useSettings(page: Page, settings: Partial<Settings>): Promise<void> {
  const value = JSON.stringify({ ...DEFAULT_SETTINGS, ...settings });
  await page.addInitScript(([key, stored]) => window.localStorage.setItem(key, stored), [STORAGE_KEY, value] as const);
}
```

`apps/docs/e2e/islands.ts`:

```ts
import { expect, type Page } from "@playwright/test";

/** Waits until every React island has hydrated (Astro removes the ssr attribute on hydration). */
export async function waitForIslands(page: Page): Promise<void> {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}
```

- [ ] **Step 3: Write the gate `apps/docs/e2e/a11y.spec.ts`**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { builtPages } from "./pages";
import { COMBOS, useSettings } from "./settings";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const path of builtPages()) {
  test.describe(`page ${path}`, () => {
    test("has a title, one h1 and a focusable main landmark", async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/Raster/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveAttribute("tabindex", "-1");
    });

    test("reflows at 320px without horizontal scrolling", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    for (const combo of COMBOS) {
      test(`has no axe violations in ${combo.theme} ${combo.mode}`, async ({ page }) => {
        // Reduced motion: scroll reveals start transparent, which axe would read as low contrast.
        await page.emulateMedia({ reducedMotion: "reduce" });
        await useSettings(page, { ...combo, motion: "reduce" });
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-mode", combo.mode);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        const violations = results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
        );
        expect(violations).toEqual([]);
      });
    }
  });
}
```

- [ ] **Step 4: Write the site behaviour tests `apps/docs/e2e/site.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("the skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("the header marks the current page", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Principles" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Components" })).not.toHaveAttribute("aria-current");
});

test("theme, mode and motion buttons apply and persist", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const theme = page.getByRole("group", { name: "Theme" });
  const mode = page.getByRole("group", { name: "Mode" });

  await theme.getByRole("button", { name: "Zürich" }).click();
  await mode.getByRole("button", { name: "Dark" }).click();
  await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Reduced" }).click();
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(html).toHaveAttribute("data-mode", "dark");
  await expect(html).toHaveAttribute("data-motion", "reduce");
  await expect(theme.getByRole("button", { name: "Zürich" })).toHaveAttribute("aria-pressed", "true");
  await expect(theme.getByRole("button", { name: "Alpine" })).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(html).toHaveAttribute("data-mode", "dark");

  await page.getByRole("group", { name: "Mode" }).getByRole("button", { name: "System" }).click();
  await expect(html).not.toHaveAttribute("data-mode");
});

test("the Grid toggle overlays the page grid and persists", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Grid", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-grid-debug", "");

  await page.reload();
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-grid-debug", "");
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await expect(page.locator("[data-page-grid]")).not.toHaveAttribute("data-grid-debug");
});
```

- [ ] **Step 5: Run the gates**

Run: `pnpm build && pnpm e2e`

Expected: PASS. That is 6 a11y tests for `/` (structure, reflow, 4 axe combos) plus 4 site tests.

If axe reports violations, fix the cause in the shell, never by excluding rules. For example, a code region needs a name, or a toggle needs contrast.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/playwright.config.ts apps/docs/e2e
git commit -m "test(docs): axe, reflow and site behaviour gates on every built page"
```

---

### Task 6: Principles (home page)

**Files:**
- Modify: `apps/docs/src/pages/index.astro`

- [ ] **Step 1: Write `apps/docs/src/pages/index.astro`**

```astro
---
import CodeBlock from "../components/CodeBlock.astro";
import DocPage from "../layouts/DocPage.astro";

const PRINCIPLES = [
  {
    number: "01",
    title: "The grid is the identity",
    body: "Every page sits on 4, 8 or 12 columns that follow the space they are given, not the device. Alignment, not decoration, is what makes a Raster page recognisable.",
  },
  {
    number: "02",
    title: "A calm hierarchy",
    body: "Headings are smaller and lighter than you expect. Size steps are few, weight changes are rare, and white space does the separating that boxes and shadows do elsewhere.",
  },
  {
    number: "03",
    title: "Accessibility is a constraint",
    body: "Every colour pairing is checked when the tokens build, every interactive component works from the keyboard, and these pages are tested with axe in both themes and both modes.",
  },
  {
    number: "04",
    title: "Motion is optional",
    body: "Movement runs along the grid's axes, briefly, and never decorates. The expressive tier is a separate stylesheet, and reduced motion turns it off.",
  },
  {
    number: "05",
    title: "HTML first",
    body: "The class contract is the API. The React components render exactly the same markup, so a page built with @raster/css alone looks the same as one built with @raster/react.",
  },
];

const CSS_USAGE = `<link rel="stylesheet" href="@raster/css/raster.css" />
<!-- Optional, after raster.css: scroll reveals, page transitions, weight shift -->
<link rel="stylesheet" href="@raster/css/motion.css" />

<main class="sw-container sw-section">
  <div class="sw-grid" data-layout="hanging">
    <p class="sw-type-label">01 / Intro</p>
    <h1>Form follows grid</h1>
  </div>
</main>`;

const REACT_USAGE = `import "@raster/css/raster.css";
import { Container, Eyebrow, Grid, Heading } from "@raster/react";

export function Intro() {
  return (
    <Container as="main" className="sw-section">
      <Grid layout="hanging">
        <Eyebrow as="p">01 / Intro</Eyebrow>
        <Heading level={1}>Form follows grid</Heading>
      </Grid>
    </Container>
  );
}`;
---
<DocPage
  title="Raster"
  eyebrow="Principles"
  description="A Swiss Style design system for the web: a fluid grid, a calm hierarchy and accessibility as a constraint."
>
  <ol class="docs-principles">
    {
      PRINCIPLES.map((p) => (
        <li>
          <span class="sw-type-label sw-text-secondary">{p.number}</span>
          <h2 class="sw-type-h3">{p.title}</h2>
          <p class="sw-measure">{p.body}</p>
        </li>
      ))
    }
  </ol>

  <h2>Get started</h2>
  <p class="sw-measure">
    Raster ships as three workspace packages: <code>@raster/tokens</code>, <code>@raster/css</code> and
    <code>@raster/react</code>. They are consumed inside this repository and are not published to npm yet.
  </p>
  <p class="sw-type-label sw-text-secondary">HTML and CSS</p>
  <CodeBlock code={CSS_USAGE} label="HTML and CSS usage" />
  <p class="sw-type-label sw-text-secondary">React</p>
  <CodeBlock code={REACT_USAGE} label="React usage" />
</DocPage>
```

- [ ] **Step 2: Build and run the gates**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/pages/index.astro
git commit -m "feat(docs): principles page"
```

---

### Task 7: Foundations, grid and spacing

**Files:**
- Create: `apps/docs/src/components/FoundationsNav.astro`, `apps/docs/src/pages/foundations/grid.astro`
- Test: `apps/docs/e2e/foundations.spec.ts` (created here, then extended in Tasks 8–10)

- [ ] **Step 1: Write the failing e2e test**

`apps/docs/e2e/foundations.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const columnCount = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

test.describe("grid and spacing", () => {
  test("a 360px frame shows 4 columns and a 720px frame shows 8", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/foundations/grid/");
    expect(await columnCount(page, '[data-frame="360"] > .sw-grid')).toBe(4);
    expect(await columnCount(page, '[data-frame="720"] > .sw-grid')).toBe(8);
  });

  test("lists the nine spacing steps", async ({ page }) => {
    await page.goto("/foundations/grid/");
    await expect(page.getByRole("table", { name: "Spacing scale" }).locator("tbody tr")).toHaveCount(9);
  });

  test("marks the current foundation in the local navigation", async ({ page }) => {
    await page.goto("/foundations/grid/");
    const nav = page.getByRole("navigation", { name: "Foundations" });
    await expect(nav.getByRole("link", { name: "Grid and spacing" })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test foundations`

Expected: FAIL. `/foundations/grid/` does not exist, so the frames, the table and the nav are missing.

- [ ] **Step 3: Write `apps/docs/src/components/FoundationsNav.astro`**

```astro
---
import { ariaCurrent, FOUNDATIONS } from "../lib/nav";
const path = Astro.url.pathname;
---
<nav class="docs-local-nav" aria-label="Foundations">
  <ul>
    {
      FOUNDATIONS.map((item) => (
        <li>
          <a class="sw-link" href={item.href} aria-current={ariaCurrent(path, item)}>
            {item.label}
          </a>
        </li>
      ))
    }
  </ul>
</nav>
```

- [ ] **Step 4: Write `apps/docs/src/pages/foundations/grid.astro`**

```astro
---
import { foundationTokens } from "@raster/tokens";
import CodeBlock from "../../components/CodeBlock.astro";
import DataTable from "../../components/DataTable.astro";
import FoundationsNav from "../../components/FoundationsNav.astro";
import DocPage from "../../layouts/DocPage.astro";

const tokens = foundationTokens();
const SPACES = Array.from({ length: 9 }, (_, i) => `space-${i + 1}`);
const FRAMES = [
  { width: "360", caption: "A 360px container: four columns." },
  { width: "720", caption: "A 720px container: eight columns (fewer if your screen is narrower)." },
];
const CELLS = [
  { span: "--span-4: 4; --span-8: 4", label: "4 · 4" },
  { span: "--span-4: 2; --span-8: 2", label: "2 · 2" },
  { span: "--span-4: 2; --span-8: 2", label: "2 · 2" },
];

const PRESETS = [
  { name: "hanging", split: "2 + 6 of 8, 3 + 9 of 12", use: "Labels or numbers hanging beside content." },
  { name: "split-5-7", split: "3 + 5 of 8, 5 + 7 of 12", use: "Text beside a larger image or table." },
  { name: "split-1-2", split: "3 + 5 of 8, 4 + 8 of 12", use: "A third and two thirds." },
];

const GRID_HTML = `<main class="sw-container">           <!-- the size container -->
  <div class="sw-grid">
    <div class="sw-col" style="--span-8: 4; --span-12: 8">Wide</div>
    <div class="sw-col" style="--span-8: 4; --span-12: 4">Narrow</div>
  </div>
  <div class="sw-grid" data-layout="hanging">
    <p class="sw-type-label">01</p>
    <p>Content in the wide column.</p>
  </div>
</main>`;
---
<DocPage
  title="Grid and spacing"
  eyebrow="Foundations"
  description="Four, eight or twelve columns, chosen by the width of the container rather than the screen, on a 4px spacing scale."
>
  <FoundationsNav slot="aside" />

  <h2>Columns follow the container</h2>
  <p class="sw-measure">
    A grid measures its nearest size container: under 600px it has four columns, from 600px eight,
    and from 1024px twelve. The same component therefore lays itself out correctly in a sidebar and
    in a full-width section. Press <strong>Grid</strong> in the header to see this page's own grid.
  </p>
  {
    FRAMES.map((frame) => (
      <figure class="docs-figure">
        <div class="docs-frame" data-frame={frame.width}>
          <div class="sw-grid" data-grid-debug>
            {CELLS.map((cell) => (
              <div class="sw-col" style={cell.span}>
                <div class="docs-cell">{cell.label}</div>
              </div>
            ))}
          </div>
        </div>
        <figcaption class="sw-type-caption sw-text-secondary">{frame.caption}</figcaption>
      </figure>
    ))
  }
  <CodeBlock code={GRID_HTML} label="Grid markup" />

  <h2>Layout presets</h2>
  <DataTable id="presets-caption" caption="Layout presets" columns={["data-layout", "Columns", "Use"]}>
    {
      PRESETS.map((p) => (
        <tr>
          <td><code>{p.name}</code></td>
          <td>{p.split}</td>
          <td>{p.use}</td>
        </tr>
      ))
    }
  </DataTable>
  <p class="sw-measure">All presets stack into one column below 600px of container width.</p>

  <h2>Gutters and margins</h2>
  <DataTable id="layout-caption" caption="Layout tokens" columns={["Token", "Value"]}>
    {
      ["grid-gutter", "page-margin", "content-max"].map((name) => (
        <tr>
          <td><code>--{name}</code></td>
          <td><code>{tokens[name]}</code></td>
        </tr>
      ))
    }
  </DataTable>

  <h2>Spacing</h2>
  <p class="sw-measure">
    Steps 1 to 6 are fixed; steps 7 to 9 grow with the viewport, so sections breathe more on large
    screens without changing the rhythm inside components.
  </p>
  <DataTable id="spacing-caption" caption="Spacing scale" columns={["Token", "Value", "Size"]}>
    {
      SPACES.map((name) => (
        <tr>
          <td><code>--{name}</code></td>
          <td><code>{tokens[name]}</code></td>
          <td><span class="docs-space-bar" style={`inline-size: var(--${name})`} /></td>
        </tr>
      ))
    }
  </DataTable>
</DocPage>
```

If `tokens[name]` fails to typecheck in the build because `foundationTokens()` returns `Record<string, string>`, it should not. If it does, use `tokens[name] ?? ""`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS. The foundations tests pass, and the a11y gate now also covers `/foundations/grid/`, including reflow at 320px. The 720px frame shrinks with `max-inline-size: 100%`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src apps/docs/e2e/foundations.spec.ts
git commit -m "feat(docs): grid and spacing foundations page"
```

---

### Task 8: Foundations, type

**Files:**
- Create: `apps/docs/src/pages/foundations/type.astro`
- Modify: `apps/docs/e2e/foundations.spec.ts`

- [ ] **Step 1: Add the failing test**

Append to `apps/docs/e2e/foundations.spec.ts`:

```ts
test.describe("type", () => {
  test("shows eight specimens; the h1 step is 42px at 1440 and 33px at 360", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/foundations/type/");
    await expect(page.locator(".docs-specimen")).toHaveCount(8);
    const h1 = page.locator(".docs-specimen .sw-type-h1");
    await expect(h1).toHaveCSS("font-size", "42px");
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(h1).toHaveCSS("font-size", "33px");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test foundations`

Expected: the new test FAILS (404, no specimens).

- [ ] **Step 3: Write `apps/docs/src/pages/foundations/type.astro`**

```astro
---
import { TYPE_STEPS } from "@raster/tokens";
import CodeBlock from "../../components/CodeBlock.astro";
import FoundationsNav from "../../components/FoundationsNav.astro";
import DocPage from "../../layouts/DocPage.astro";

const steps = Object.entries(TYPE_STEPS).map(([name, step]) => ({
  name,
  size: step.min === step.max ? `${step.min}px` : `${step.min}–${step.max}px`,
  ...step,
}));

const HEADING_REACT = `<Heading level={2} size="h4">Level 2 in the outline, h4 on screen</Heading>`;
const HEADING_HTML = `<h2 class="sw-type-h4">Level 2 in the outline, h4 on screen</h2>`;
---
<DocPage
  title="Type"
  eyebrow="Foundations"
  description="Geist in a short, light scale: sizes interpolate between 360px and 1440px screens, and headings stay smaller than habit suggests."
>
  <FoundationsNav slot="aside" />

  <h2>Scale</h2>
  <div>
    {
      steps.map((step) => (
        <div class="docs-specimen">
          <p class="sw-type-label sw-text-secondary">
            {step.name} · {step.size} · weight {step.weight} · tracking {step.tracking} · leading {step.leading}
          </p>
          <p class={`sw-type-${step.name}`}>Raster und Raum</p>
        </div>
      ))
    }
  </div>

  <h2>Level and size are separate</h2>
  <p class="sw-measure">
    The heading level describes the document outline; the size describes its visual weight. Choose
    the level for structure and the size for the design, and never skip a level to get a smaller look.
  </p>
  <CodeBlock code={HEADING_REACT} label="Heading in React" />
  <CodeBlock code={HEADING_HTML} label="Heading in HTML" />

  <h2>Typefaces</h2>
  <ul class="sw-measure">
    <li>Geist (variable) for text and headings; weights 300 to 500 only.</li>
    <li>Geist Mono for labels, numbers in tables and code.</li>
    <li>Noto Sans as the fallback for scripts Geist does not cover.</li>
  </ul>

  <h2>Rules</h2>
  <ul class="sw-measure">
    <li>Flush left, ragged right; never justified.</li>
    <li>Body text holds a 66-character measure (<code>.sw-measure</code>).</li>
    <li>Hyphenation follows the page's <code>lang</code> attribute.</li>
    <li>Line heights round to a 4px rhythm where the browser supports <code>round()</code>.</li>
  </ul>
</DocPage>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/pages/foundations/type.astro apps/docs/e2e/foundations.spec.ts
git commit -m "feat(docs): type foundations page with specimen"
```

---

### Task 9: Foundations, colour (contrast table from `tokens.json`)

**Files:**
- Create: `apps/docs/src/lib/contrast-table.ts`, `apps/docs/src/pages/foundations/colour.astro`
- Test: `apps/docs/test/contrast-table.test.ts`
- Modify: `apps/docs/e2e/foundations.spec.ts`

- [ ] **Step 1: Write the failing unit test**

`apps/docs/test/contrast-table.test.ts`:

```ts
import { contrastPairs, contrastRatio, tokensJson } from "@raster/tokens";
import { describe, expect, it } from "vitest";
import { contrastTables, formatRatio, type TokensJson } from "../src/lib/contrast-table";

const tables = contrastTables(tokensJson() as unknown as TokensJson);

describe("contrastTables", () => {
  it("has one table per theme and mode, in order", () => {
    expect(tables.map((t) => `${t.theme}/${t.mode}`)).toEqual([
      "alpine/light",
      "alpine/dark",
      "zurich/light",
      "zurich/dark",
    ]);
  });

  it("checks every promised pairing, and every pairing passes", () => {
    for (const table of tables) {
      expect(table.rows).toHaveLength(contrastPairs().length);
      expect(table.rows.every((row) => row.passes)).toBe(true);
    }
  });

  it("computes ratios from the token values", () => {
    const first = tables[0].rows[0];
    expect(first).toMatchObject({ foreground: "text-primary", background: "surface-page" });
    expect(first.ratio).toBe(contrastRatio(first.foregroundValue, first.backgroundValue));
  });
});

describe("formatRatio", () => {
  it("prints two decimals", () => {
    expect(formatRatio(4.5)).toBe("4.50:1");
    expect(formatRatio(17.234)).toBe("17.23:1");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/docs exec vitest run contrast-table`

Expected: FAIL, because `../src/lib/contrast-table` does not exist.

- [ ] **Step 3: Implement `apps/docs/src/lib/contrast-table.ts`**

```ts
import { contrastPairs, contrastRatio } from "@raster/tokens";

type ColourToken = { $value: string };
type ModeTokens = Record<string, ColourToken>;

/** The part of tokens.json (W3C DTCG) this page reads. */
export type TokensJson = { themes: Record<string, { light: ModeTokens; dark: ModeTokens }> };

export type ContrastRow = {
  foreground: string;
  background: string;
  foregroundValue: string;
  backgroundValue: string;
  ratio: number;
  minimum: number;
  passes: boolean;
};

export type ContrastTable = { theme: string; mode: "light" | "dark"; rows: ContrastRow[] };

function value(tokens: ModeTokens, role: string, where: string): string {
  const token = tokens[role];
  if (!token) throw new Error(`tokens.json has no ${role} in ${where}`);
  return token.$value;
}

/** Every pairing the token build checks, recomputed from tokens.json for each theme and mode. */
export function contrastTables(json: TokensJson): ContrastTable[] {
  const tables: ContrastTable[] = [];
  for (const [theme, modes] of Object.entries(json.themes)) {
    for (const mode of ["light", "dark"] as const) {
      const rows = contrastPairs().map(({ foreground, background, minimum }) => {
        const foregroundValue = value(modes[mode], foreground, `${theme}/${mode}`);
        const backgroundValue = value(modes[mode], background, `${theme}/${mode}`);
        const ratio = contrastRatio(foregroundValue, backgroundValue);
        return { foreground, background, foregroundValue, backgroundValue, ratio, minimum, passes: ratio >= minimum };
      });
      tables.push({ theme, mode, rows });
    }
  }
  return tables;
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

export const THEME_NAMES: Record<string, string> = { alpine: "Alpine", zurich: "Zürich" };
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @raster/docs exec vitest run contrast-table`

Expected: PASS (4 tests).

- [ ] **Step 5: Add the failing e2e test**

Append to `apps/docs/e2e/foundations.spec.ts`:

```ts
test.describe("colour", () => {
  test("shows four contrast tables of 32 pairings, all passing", async ({ page }) => {
    await page.goto("/foundations/colour/");
    const tables = page.getByRole("table", { name: /contrast$/ });
    await expect(tables).toHaveCount(4);
    // 7 text roles × 3 surfaces + border-strong × 3 surfaces + 4 statuses × (fill + tint).
    for (let i = 0; i < 4; i++) await expect(tables.nth(i).locator("tbody tr")).toHaveCount(32);
    await expect(page.locator("td", { hasText: "Fails" })).toHaveCount(0);
  });

  test("swatches follow the current theme", async ({ page }) => {
    await page.goto("/foundations/colour/");
    const accent = page.locator('[data-role="accent"] .docs-swatch');
    const before = await accent.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Zürich" }).click();
    await expect.poll(() => accent.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  });
});
```

- [ ] **Step 6: Write `apps/docs/src/pages/foundations/colour.astro`**

```astro
---
import tokens from "@raster/tokens/tokens.json";
import { ROLES } from "@raster/tokens";
import DataTable from "../../components/DataTable.astro";
import FoundationsNav from "../../components/FoundationsNav.astro";
import DocPage from "../../layouts/DocPage.astro";
import { contrastTables, formatRatio, THEME_NAMES, type TokensJson } from "../../lib/contrast-table";

const tables = contrastTables(tokens as unknown as TokensJson);
---
<DocPage
  title="Colour"
  eyebrow="Foundations"
  description="Two themes, each in light and dark, built from semantic roles. Every pairing the system promises is checked when the tokens build, and again below."
>
  <FoundationsNav slot="aside" />

  <h2>Roles</h2>
  <p class="sw-measure">
    Components use roles, never raw colours. The swatches show the theme and mode you have chosen in
    the display settings at the foot of the page.
  </p>
  <ul class="docs-swatches">
    {
      ROLES.map((role) => (
        <li data-role={role}>
          <span class="docs-swatch" style={`background-color: var(--${role})`} />
          <code>--{role}</code>
        </li>
      ))
    }
  </ul>

  <h2>Usage</h2>
  <ul class="sw-measure">
    <li>Pages are white or near-white in light mode: Alpine uses pure white, Zürich a warm off-white.</li>
    <li>The accent marks links, focus and the one primary action in a view.</li>
    <li>In Alpine, red appears only for alerts and destructive actions.</li>
    <li>State is never shown by colour alone; a border, icon, weight or text always comes with it.</li>
  </ul>

  <h2>Verified contrast</h2>
  <p class="sw-measure">
    Text roles need 4.5:1 on every surface, <code>border-strong</code> needs 3:1, and every
    <code>on-*</code> colour needs 4.5:1 on its fill and tint. These tables are computed from
    <code>tokens.json</code> at build time.
  </p>
  {
    tables.map((table) => (
      <DataTable
        id={`contrast-${table.theme}-${table.mode}`}
        caption={`${THEME_NAMES[table.theme] ?? table.theme} ${table.mode} contrast`}
        columns={["Foreground", "Background", "Ratio", "Minimum", "Result"]}
      >
        {table.rows.map((row) => (
          <tr>
            <td>
              <span class="docs-swatch" style={`background-color: ${row.foregroundValue}`} /> <code>{row.foreground}</code>
            </td>
            <td>
              <span class="docs-swatch" style={`background-color: ${row.backgroundValue}`} /> <code>{row.background}</code>
            </td>
            <td><code>{formatRatio(row.ratio)}</code></td>
            <td><code>{row.minimum}:1</code></td>
            <td>{row.passes ? "Passes" : "Fails"}</td>
          </tr>
        ))}
      </DataTable>
    ))
  }
</DocPage>
```

The contrast tables' swatches use the token values from `tokens.json` (data, not styling), so they show every theme regardless of the current one.

- [ ] **Step 7: Run all tests**

Run: `pnpm --filter @raster/docs test && pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/src apps/docs/test/contrast-table.test.ts apps/docs/e2e/foundations.spec.ts
git commit -m "feat(docs): colour foundations page with contrast tables from tokens.json"
```

---

### Task 10: Foundations, motion (replayable demos)

**Files:**
- Create: `apps/docs/src/demos/motion/OverlayMotion.tsx`, `apps/docs/src/pages/foundations/motion.astro`
- Modify: `apps/docs/e2e/foundations.spec.ts`

- [ ] **Step 1: Add the failing e2e tests**

Append to `apps/docs/e2e/foundations.spec.ts` (and add `import { waitForIslands } from "./islands";` to its imports):

```ts
test.describe("motion", () => {
  test("the overlay demo can be replayed", async ({ page }) => {
    await page.goto("/foundations/motion/");
    await waitForIslands(page);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Open dialog" }).click();
      await expect(page.getByRole("dialog", { name: "Overlay motion" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("reveals run by default and stop when motion is reduced", async ({ page }) => {
    await page.goto("/foundations/motion/");
    const card = page.locator(".sw-reveal[data-stagger] > *").first();
    const animation = () => card.evaluate((el) => getComputedStyle(el).animationName);
    await expect.poll(animation).toBe("sw-reveal-in");
    await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Reduced" }).click();
    await expect.poll(animation).toBe("none");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test foundations`

Expected: the motion tests FAIL (404).

- [ ] **Step 3: Write `apps/docs/src/demos/motion/OverlayMotion.tsx`**

```tsx
import { Button, Dialog, DialogTrigger, Stack, Text, Tooltip, TooltipTrigger } from "@raster/react";

export default function OverlayMotion() {
  return (
    <Stack direction="row" gap={3}>
      <DialogTrigger>
        <Button>Open dialog</Button>
        <Dialog title="Overlay motion">
          {({ close }) => (
            <Stack gap={5}>
              <Text>The dialog fades in and rises 8px; the scrim fades. Close it and open it again to replay.</Text>
              <Button variant="primary" onPress={close}>
                Close
              </Button>
            </Stack>
          )}
        </Dialog>
      </DialogTrigger>
      <TooltipTrigger>
        <Button>Hover or focus me</Button>
        <Tooltip>Tooltips fade in from their placement.</Tooltip>
      </TooltipTrigger>
    </Stack>
  );
}
```

- [ ] **Step 4: Write `apps/docs/src/pages/foundations/motion.astro`**

```astro
---
import { foundationTokens } from "@raster/tokens";
import CodeBlock from "../../components/CodeBlock.astro";
import DataTable from "../../components/DataTable.astro";
import FoundationsNav from "../../components/FoundationsNav.astro";
import OverlayMotion from "../../demos/motion/OverlayMotion";
import DocPage from "../../layouts/DocPage.astro";

const tokens = Object.entries(foundationTokens()).filter(([name]) => /^(dur|ease)-/.test(name));
const USES: Record<string, string> = {
  "dur-fast": "Hover and press",
  "dur-base": "Overlays",
  "dur-slow": "Panels",
  "dur-layout": "Layout changes",
  "ease-standard": "Everything that moves",
  "ease-linear": "Opacity",
};

const REVEAL_HTML = `<link rel="stylesheet" href="@raster/css/motion.css" />

<div class="sw-reveal" data-stagger>
  <div class="sw-card">One</div>
  <div class="sw-card">Two</div>
  <div class="sw-card">Three</div>
</div>`;
---
<DocPage
  title="Motion"
  eyebrow="Foundations"
  description="Calm by default, expressive on request. Movement runs only along the grid's axes, never bounces, and switches off for people who ask for less."
>
  <FoundationsNav slot="aside" />

  <h2>Tokens</h2>
  <DataTable id="motion-caption" caption="Motion tokens" columns={["Token", "Value", "Use"]}>
    {
      tokens.map(([name, value]) => (
        <tr>
          <td><code>--{name}</code></td>
          <td><code>{value}</code></td>
          <td>{USES[name] ?? ""}</td>
        </tr>
      ))
    }
  </DataTable>

  <h2>Core: overlays</h2>
  <p class="sw-measure">
    Shipped in <code>raster.css</code>: overlays fade and travel at most 8px from their placement.
    Open the dialog or the tooltip again to replay it.
  </p>
  <div class="docs-example">
    <div class="docs-example-demo"><OverlayMotion client:load /></div>
  </div>

  <h2>Expressive: scroll reveals</h2>
  <p class="sw-measure">
    Opt in with <code>motion.css</code>. Children of a staggered reveal fade and rise one after
    another as they scroll into view, driven by CSS scroll timelines with no JavaScript. Browsers
    without scroll-driven animations show the content at once.
  </p>
  <div class="sw-reveal docs-reveal-demo" data-stagger>
    {["One", "Two", "Three", "Four", "Five", "Six"].map((n) => <div class="sw-card"><p>{n}</p></div>)}
  </div>
  <CodeBlock code={REVEAL_HTML} label="Reveal markup" />

  <h2>Expressive: weight shift and page transitions</h2>
  <p class="sw-measure">
    <code>.sw-weight-shift</code> eases Geist's variable weight on hover and focus. With
    <code>motion.css</code> loaded, moving between pages of this site cross-fades using the View
    Transitions API.
  </p>
  <div>
    <button type="button" class="sw-button sw-weight-shift" data-variant="ghost">Hover or focus me</button>
  </div>

  <h2>Reduced motion</h2>
  <p class="sw-measure">
    With <code>prefers-reduced-motion: reduce</code>, or <code>data-motion="reduce"</code> on an
    ancestor, transforms are removed, fades are capped at 120ms and the expressive tier is off. Page
    transitions follow only the operating-system setting. Try <strong>Motion: Reduced</strong> in the
    display settings below.
  </p>
</DocPage>
```

- [ ] **Step 5: Run all tests**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src apps/docs/e2e/foundations.spec.ts
git commit -m "feat(docs): motion foundations page with replayable demos"
```

---

### Task 11: Theme playground

**Files:**
- Create: `apps/docs/src/demos/themes/ThemePlayground.tsx`, `apps/docs/src/pages/themes.astro`
- Test: `apps/docs/e2e/themes.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/docs/e2e/themes.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";

const REGIONS = ["Alpine light", "Alpine dark", "Zürich light", "Zürich dark"];

test("shows all four themes and modes side by side", async ({ page }) => {
  await page.goto("/themes/");
  for (const name of REGIONS) await expect(page.getByRole("region", { name })).toBeVisible();
  const region = page.getByRole("region", { name: "Zürich dark" });
  await expect(region).toHaveAttribute("data-theme", "zurich");
  await expect(region).toHaveAttribute("data-mode", "dark");
  const bg = (el: import("@playwright/test").Locator) => el.evaluate((n) => getComputedStyle(n).backgroundColor);
  expect(await bg(region)).not.toBe(await bg(page.getByRole("region", { name: "Alpine light" })));
});

test("a select opened in a region renders in that region's theme and mode", async ({ page }) => {
  await page.goto("/themes/");
  await waitForIslands(page);
  await page.getByRole("region", { name: "Zürich dark" }).getByRole("button", { name: /Typeface/ }).click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const host = page.locator(".sw-portal-host", { has: listbox });
  await expect(host).toHaveAttribute("data-theme", "zurich");
  await expect(host).toHaveAttribute("data-mode", "dark");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @raster/docs build && pnpm --filter @raster/docs exec playwright test themes`

Expected: FAIL (404).

- [ ] **Step 3: Write `apps/docs/src/demos/themes/ThemePlayground.tsx`**

```tsx
import { Button, Callout, Eyebrow, Heading, Select, SelectItem, Stack, Tag, Text, ThemeRegion } from "@raster/react";

const REGIONS = [
  { theme: "alpine", mode: "light", name: "Alpine light" },
  { theme: "alpine", mode: "dark", name: "Alpine dark" },
  { theme: "zurich", mode: "light", name: "Zürich light" },
  { theme: "zurich", mode: "dark", name: "Zürich dark" },
] as const;

export default function ThemePlayground() {
  return (
    <div className="docs-theme-grid">
      {REGIONS.map((region) => (
        <ThemeRegion
          key={region.name}
          as="section"
          theme={region.theme}
          mode={region.mode}
          aria-label={region.name}
          className="docs-theme-tile"
        >
          <Stack gap={4}>
            <Eyebrow>{region.name}</Eyebrow>
            <Heading level={2} size="h3">
              Form follows grid
            </Heading>
            <Text tone="secondary">Flush left, ragged right, and every pairing above 4.5:1.</Text>
            <Stack direction="row" gap={3}>
              <Button variant="primary">Primary</Button>
              <Button>Secondary</Button>
            </Stack>
            <Select label="Typeface" defaultValue="geist">
              <SelectItem id="geist">Geist</SelectItem>
              <SelectItem id="geist-mono">Geist Mono</SelectItem>
            </Select>
            <Stack direction="row" gap={2}>
              <Tag tone="accent">Accent</Tag>
              <Tag tone="success">Success</Tag>
              <Tag tone="danger">Danger</Tag>
            </Stack>
            <Callout tone="info" title="Overlays follow the region">
              Open the select: its list renders in this theme and mode.
            </Callout>
          </Stack>
        </ThemeRegion>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `apps/docs/src/pages/themes.astro`**

```astro
---
import CodeBlock from "../components/CodeBlock.astro";
import ThemePlayground from "../demos/themes/ThemePlayground";
import DocPage from "../layouts/DocPage.astro";

const HTML = `<html data-theme="zurich" data-mode="dark">   <!-- the whole page -->
<section data-theme="alpine" data-mode="light">  <!-- one region -->`;

const REACT = `import { ThemeRegion } from "@raster/react";

<ThemeRegion theme="zurich" mode="dark">
  {/* Selects, menus, dialogs and tooltips opened in here keep the region's theme. */}
</ThemeRegion>`;
---
<DocPage
  title="Themes"
  eyebrow="Themes"
  description="Alpine is the default, calm and cool; Zürich is warmer and squarer. Each has a light and a dark mode, and any part of a page can switch."
>
  <h2>Side by side</h2>
  <ThemePlayground client:load />

  <h2>Switching</h2>
  <p class="sw-measure">
    Set <code>data-theme</code> and <code>data-mode</code> on any element; everything inside
    re-themes with no component changes. Without <code>data-mode</code>, the system preference
    decides. In React, <code>ThemeRegion</code> also carries the theme to overlays, which render at
    the end of the page.
  </p>
  <CodeBlock code={HTML} label="Theme attributes in HTML" />
  <CodeBlock code={REACT} label="ThemeRegion in React" />
</DocPage>
```

- [ ] **Step 5: Run all tests**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS. The a11y gate runs on `/themes/` in all four page combinations; the regions keep their own themes.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src apps/docs/e2e/themes.spec.ts
git commit -m "feat(docs): theme playground"
```

---

### Task 12: Component pages (collection, route, index, Button)

**Files:**
- Create: `apps/docs/src/lib/components.ts`, `apps/docs/src/content.config.ts`, `apps/docs/src/components/PropsTable.astro`, `apps/docs/src/pages/components/index.astro`, `apps/docs/src/pages/components/[slug].astro`, `apps/docs/src/content/components/button.mdx`, `apps/docs/src/demos/button/Variants.tsx`, `apps/docs/src/demos/button/Disabled.tsx`
- Test: `apps/docs/test/components.test.ts`, `apps/docs/e2e/components.spec.ts`

- [ ] **Step 1: Write the failing unit tests**

`apps/docs/test/components.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { componentHref, groupComponents, neighbours, sortComponents } from "../src/lib/components";

const entry = (id: string, group: string, order: number) => ({ id, data: { title: id, group, order } }) as const;

const entries = [
  entry("link", "Actions", 3),
  entry("grid", "Layout", 3),
  entry("button", "Actions", 1),
  entry("heading", "Type", 1),
  entry("container", "Layout", 1),
];

describe("sortComponents", () => {
  it("orders by group (Layout, Type, Actions, …), then by order", () => {
    expect(sortComponents(entries).map((e) => e.id)).toEqual(["container", "grid", "heading", "button", "link"]);
  });
});

describe("groupComponents", () => {
  it("returns only the groups that have entries, in group order", () => {
    expect(groupComponents(entries).map((g) => [g.group, g.entries.map((e) => e.id)])).toEqual([
      ["Layout", ["container", "grid"]],
      ["Type", ["heading"]],
      ["Actions", ["button", "link"]],
    ]);
  });
});

describe("neighbours", () => {
  it("finds the previous and next entries", () => {
    const sorted = sortComponents(entries);
    expect(neighbours(sorted, "heading")).toEqual({ previous: sorted[1], next: sorted[3] });
    expect(neighbours(sorted, "container").previous).toBeUndefined();
    expect(neighbours(sorted, "link").next).toBeUndefined();
  });
});

describe("componentHref", () => {
  it("builds the page URL", () => {
    expect(componentHref("button")).toBe("/components/button/");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @raster/docs exec vitest run components`

Expected: FAIL, because `../src/lib/components` does not exist.

- [ ] **Step 3: Implement `apps/docs/src/lib/components.ts`**

```ts
export const GROUPS = ["Layout", "Type", "Actions", "Forms", "Display", "Overlay and navigation"] as const;
export type Group = (typeof GROUPS)[number];

type Entry = { id: string; data: { title: string; group: string; order: number } };

const groupIndex = (group: string) => {
  const i = (GROUPS as readonly string[]).indexOf(group);
  return i === -1 ? GROUPS.length : i;
};

/** By group (in GROUPS order), then by order, then by title. */
export function sortComponents<T extends Entry>(entries: readonly T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      groupIndex(a.data.group) - groupIndex(b.data.group) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function groupComponents<T extends Entry>(entries: readonly T[]): { group: Group; entries: T[] }[] {
  const sorted = sortComponents(entries);
  return GROUPS.map((group) => ({ group, entries: sorted.filter((e) => e.data.group === group) })).filter(
    (g) => g.entries.length > 0,
  );
}

export function neighbours<T extends Entry>(sorted: readonly T[], id: string): { previous?: T; next?: T } {
  const i = sorted.findIndex((e) => e.id === id);
  return { previous: i > 0 ? sorted[i - 1] : undefined, next: i >= 0 ? sorted[i + 1] : undefined };
}

export const componentHref = (id: string) => `/components/${id}/`;
```

- [ ] **Step 4: Run them to verify they pass**

Run: `pnpm --filter @raster/docs exec vitest run components`

Expected: PASS (4 tests).

- [ ] **Step 5: Write `apps/docs/src/content.config.ts`**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { GROUPS } from "./lib/components";

const prop = z.object({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  description: z.string(),
});

const components = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/components" }),
  schema: z.object({
    title: z.string(),
    group: z.enum(GROUPS),
    /** Position within the group. */
    order: z.number().int(),
    summary: z.string(),
    /** Needs a React island (client:*) in Astro to respond to input. */
    interactive: z.boolean().default(false),
    props: z.array(prop).min(1),
    a11y: z.array(z.string()).min(1),
  }),
});

export const collections = { components };
```

- [ ] **Step 6: Write `apps/docs/src/components/PropsTable.astro`**

```astro
---
import DataTable from "./DataTable.astro";

interface Props {
  title: string;
  props: { name: string; type: string; default?: string; description: string }[];
}
const { title, props } = Astro.props;
---
<DataTable id="props-caption" caption={`${title} props`} columns={["Prop", "Type", "Default", "Description"]}>
  {
    props.map((p) => (
      <tr>
        <td><code>{p.name}</code></td>
        <td><code>{p.type}</code></td>
        <td>{p.default ? <code>{p.default}</code> : "—"}</td>
        <td>{p.description}</td>
      </tr>
    ))
  }
</DataTable>
```

- [ ] **Step 7: Write the route `apps/docs/src/pages/components/[slug].astro`**

```astro
---
import { getCollection, render } from "astro:content";
import PropsTable from "../../components/PropsTable.astro";
import DocPage from "../../layouts/DocPage.astro";
import { componentHref, neighbours, sortComponents } from "../../lib/components";

export async function getStaticPaths() {
  const entries = sortComponents(await getCollection("components"));
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry, ...neighbours(entries, entry.id) },
  }));
}

const { entry, previous, next } = Astro.props;
const { Content } = await render(entry);
const { title, group, summary, interactive, props, a11y } = entry.data;
---
<DocPage title={title} description={summary} eyebrow={group}>
  <nav slot="before-title" aria-label="Breadcrumbs">
    <ol class="sw-breadcrumbs">
      <li class="sw-breadcrumb">
        <a class="sw-link" href="/components/">Components</a>
        <span class="sw-breadcrumb-separator" aria-hidden="true">/</span>
      </li>
      <li class="sw-breadcrumb"><span class="sw-link" aria-current="page">{title}</span></li>
    </ol>
  </nav>
  {
    interactive && (
      <p slot="aside" class="sw-type-caption sw-text-secondary">
        Interactive. In Astro, render it inside a React island with a <code>client:*</code> directive.
      </p>
    )
  }

  <h2>Examples</h2>
  <Content />

  <h2>Props</h2>
  <PropsTable title={title} props={props} />

  <h2>Accessibility</h2>
  <ul class="sw-measure">{a11y.map((note) => <li>{note}</li>)}</ul>

  <nav class="docs-pager" aria-label="Previous and next component">
    {previous && <a class="sw-link" href={componentHref(previous.id)} rel="prev">Previous: {previous.data.title}</a>}
    {next && <a class="sw-link" href={componentHref(next.id)} rel="next">Next: {next.data.title}</a>}
  </nav>
</DocPage>
```

- [ ] **Step 8: Write the index `apps/docs/src/pages/components/index.astro`**

```astro
---
import { getCollection } from "astro:content";
import DocPage from "../../layouts/DocPage.astro";
import { componentHref, groupComponents } from "../../lib/components";

const groups = groupComponents(await getCollection("components"));
---
<DocPage
  title="Components"
  eyebrow="Components"
  description="Each component is a class contract in @raster/css and a thin React component in @raster/react that renders the same markup."
>
  {
    groups.map(({ group, entries }) => (
      <>
        <h2>{group}</h2>
        <ul class="docs-component-list">
          {entries.map((entry) => (
            <li>
              <a class="sw-link" href={componentHref(entry.id)}>
                {entry.data.title}
              </a>
              <span class="sw-type-caption sw-text-secondary">{entry.data.summary}</span>
            </li>
          ))}
        </ul>
      </>
    ))
  }
</DocPage>
```

- [ ] **Step 9: Write the Button demos**

`apps/docs/src/demos/button/Variants.tsx`:

```tsx
import { Button, Stack } from "@raster/react";

export default function Variants() {
  return (
    <Stack direction="row" gap={3}>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete</Button>
    </Stack>
  );
}
```

`apps/docs/src/demos/button/Disabled.tsx`:

```tsx
import { Button, Stack } from "@raster/react";

export default function Disabled() {
  return (
    <Stack direction="row" gap={3}>
      <Button variant="primary" isDisabled>
        Save
      </Button>
      <Button isDisabled>Cancel</Button>
    </Stack>
  );
}
```

- [ ] **Step 10: Write `apps/docs/src/content/components/button.mdx`**

```mdx
---
title: Button
group: Actions
order: 1
summary: Triggers an action. Secondary is the default; use at most one primary per view.
interactive: true
props:
  - name: variant
    type: '"primary" | "secondary" | "ghost" | "danger"'
    default: '"secondary"'
    description: Visual weight. Danger is for destructive actions only.
  - name: onPress
    type: "(event: PressEvent) => void"
    description: Called on mouse, touch, keyboard and screen reader activation. Use it instead of onClick.
  - name: isDisabled
    type: boolean
    default: "false"
    description: Disables the button and removes it from the tab order.
  - name: type
    type: '"button" | "submit" | "reset"'
    default: '"button"'
    description: Form behaviour, as on a native button.
  - name: className
    type: string
    description: Extra classes, added after sw-button.
a11y:
  - Renders a native button, so Enter and Space activate it and it is announced as a button.
  - Variants differ in fill, border and weight, not only in colour, and stay distinct in forced-colours mode.
  - The control is 40px tall and its hit area is padded to at least 44px (WCAG 2.5.8).
  - Disabled buttons cannot be focused. If people need to learn why an action is unavailable, keep the button enabled and explain on press.
---
import Example from "../../components/Example.astro";
import Variants from "../../demos/button/Variants";
import variantsSource from "../../demos/button/Variants.tsx?raw";
import Disabled from "../../demos/button/Disabled";
import disabledSource from "../../demos/button/Disabled.tsx?raw";

<Example title="Variants" source={variantsSource} of={Variants}>
  <Variants />
</Example>

<Example title="Disabled" source={disabledSource} of={Disabled}>
  <Disabled />
</Example>
```

- [ ] **Step 11: Write the generic component-page e2e test**

`apps/docs/e2e/components.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { builtPages } from "./pages";

const componentPages = builtPages().filter((path) => /^\/components\/[^/]+\/$/.test(path));

test("the index links to every component page", async ({ page }) => {
  await page.goto("/components/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveCount(componentPages.length);
});

for (const path of componentPages) {
  test(`${path} has examples with code, props, accessibility notes and breadcrumbs`, async ({ page }) => {
    await page.goto(path);
    const title = (await page.locator("h1").textContent())?.trim() ?? "";
    const crumbs = page.getByRole("navigation", { name: "Breadcrumbs" });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(title);

    const examples = page.locator("figure.docs-example");
    expect(await examples.count()).toBeGreaterThan(0);
    for (const example of await examples.all()) {
      await expect(example.getByRole("region", { name: /^React code: / })).toBeVisible();
    }

    await expect(page.getByRole("heading", { level: 2, name: "Props" })).toBeVisible();
    await expect(page.getByRole("table", { name: `${title} props` }).locator("tbody tr").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Accessibility" })).toBeVisible();
  });
}

test("static examples show the HTML they render", async ({ page }) => {
  await page.goto("/components/button/");
  const html = page.getByRole("region", { name: "HTML code: Variants" });
  await expect(html).toContainText('<button data-variant="primary" class="sw-button" type="button">Save</button>');
  await expect(html).not.toContainText("react-aria");
});
```

- [ ] **Step 12: Build and run everything**

Run: `pnpm --filter @raster/docs test && pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS. `/components/` and `/components/button/` are now in the a11y gate as well.

- [ ] **Step 13: Commit**

```bash
git add apps/docs/src apps/docs/test/components.test.ts apps/docs/e2e/components.spec.ts
git commit -m "feat(docs): component pages from an MDX collection, with Button"
```

---

### Task 13: Layout component pages

**Files:**
- Create: `apps/docs/src/content/components/{container,section,grid,col,stack,rule}.mdx`
- Create demos: `apps/docs/src/demos/container/Basic.tsx`, `section/Basic.tsx`, `grid/Spans.tsx`, `grid/Hanging.tsx`, `col/Offsets.tsx`, `stack/Column.tsx`, `stack/Row.tsx`, `rule/Variants.tsx`

The generic tests in `e2e/components.spec.ts` and `e2e/a11y.spec.ts` cover these pages, so there is no new test file. Each page must pass them.

- [ ] **Step 1: Write the demos**

`apps/docs/src/demos/container/Basic.tsx`:

```tsx
import { Container, Text } from "@raster/react";

export default function Basic() {
  return (
    <Container>
      <Text measure>Content sits inside the page margins and stops growing at the maximum content width.</Text>
    </Container>
  );
}
```

`apps/docs/src/demos/section/Basic.tsx`:

```tsx
import { Heading, Section, Text } from "@raster/react";

export default function Basic() {
  return (
    <Section aria-labelledby="section-demo-title">
      <Heading level={2} size="h3" id="section-demo-title">
        Studio
      </Heading>
      <Text tone="secondary">Sections add the large vertical rhythm between page regions.</Text>
    </Section>
  );
}
```

`apps/docs/src/demos/grid/Spans.tsx`:

```tsx
import { Col, Grid } from "@raster/react";

export default function Spans() {
  return (
    <Grid debug rowGap={3}>
      <Col span={{ 8: 5, 12: 8 }}>
        <div className="docs-cell">span 8:5 12:8</div>
      </Col>
      <Col span={{ 8: 3, 12: 4 }}>
        <div className="docs-cell">span 8:3 12:4</div>
      </Col>
      <Col span={{ 4: 2, 8: 2, 12: 3 }}>
        <div className="docs-cell">span 4:2 8:2 12:3</div>
      </Col>
      <Col span={{ 4: 2, 8: 6, 12: 9 }}>
        <div className="docs-cell">span 4:2 8:6 12:9</div>
      </Col>
    </Grid>
  );
}
```

`apps/docs/src/demos/grid/Hanging.tsx`:

```tsx
import { Eyebrow, Grid, Text } from "@raster/react";

export default function Hanging() {
  return (
    <Grid layout="hanging" rules>
      <Eyebrow as="p">01 / Grid</Eyebrow>
      <Text measure>Labels hang in the narrow column and content runs in the wide one.</Text>
      <Eyebrow as="p">02 / Type</Eyebrow>
      <Text measure>Below 600px of container width, each label stacks above its content.</Text>
    </Grid>
  );
}
```

`apps/docs/src/demos/col/Offsets.tsx`:

```tsx
import { Col, Grid } from "@raster/react";

export default function Offsets() {
  return (
    <Grid debug rowGap={3}>
      <Col span={{ 4: 3, 8: 4, 12: 6 }} start={{ 4: 2, 8: 5, 12: 7 }}>
        <div className="docs-cell">start 4:2 8:5 12:7</div>
      </Col>
      <Col span={{ 4: 2, 8: 4, 12: 4 }} start={{ 4: 1, 8: 3, 12: 5 }}>
        <div className="docs-cell">start 4:1 8:3 12:5</div>
      </Col>
    </Grid>
  );
}
```

`apps/docs/src/demos/stack/Column.tsx`:

```tsx
import { Stack, Text } from "@raster/react";

export default function Column() {
  return (
    <Stack gap={3}>
      <Text>First</Text>
      <Text>Second</Text>
      <Text>Third</Text>
    </Stack>
  );
}
```

`apps/docs/src/demos/stack/Row.tsx`:

```tsx
import { Stack, Tag } from "@raster/react";

export default function Row() {
  return (
    <Stack direction="row" gap={2}>
      <Tag>Grid</Tag>
      <Tag>Type</Tag>
      <Tag>Colour</Tag>
    </Stack>
  );
}
```

`apps/docs/src/demos/rule/Variants.tsx`:

```tsx
import { Rule, Stack, Text } from "@raster/react";

export default function Variants() {
  return (
    <Stack gap={4}>
      <Text size="caption" tone="secondary">
        Default
      </Text>
      <Rule />
      <Text size="caption" tone="secondary">
        Strong
      </Text>
      <Rule variant="strong" />
      <Text size="caption" tone="secondary">
        Signal
      </Text>
      <Rule variant="signal" />
    </Stack>
  );
}
```

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/container.mdx`:

```mdx
---
title: Container
group: Layout
order: 1
summary: Centres content at the maximum width with fluid page margins, and is the size container a grid measures.
props:
  - name: as
    type: ElementType
    default: '"div"'
    description: Element to render, for example "main" when the container is the page's main region.
  - name: className
    type: string
    description: Extra classes, added after sw-container.
a11y:
  - Renders a plain div unless you pass as; use a landmark element (main, header, footer) where the container is a page region.
  - Content reflows down to 320px wide without horizontal scrolling (WCAG 1.4.10).
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/container/Basic";
import basicSource from "../../demos/container/Basic.tsx?raw";

<Example title="Basic" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/section.mdx`:

```mdx
---
title: Section
group: Layout
order: 2
summary: Adds the large vertical rhythm between page regions and acts as a size container.
props:
  - name: as
    type: ElementType
    default: '"section"'
    description: Element to render.
  - name: className
    type: string
    description: Extra classes, added after sw-section.
a11y:
  - A section element becomes a region landmark only when it has an accessible name; label it with aria-labelledby pointing at its heading.
  - Use as="div" when the section is purely visual spacing.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/section/Basic";
import basicSource from "../../demos/section/Basic.tsx?raw";

<Example title="Labelled section" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/grid.mdx`:

```mdx
---
title: Grid
group: Layout
order: 3
summary: Four, eight or twelve columns, chosen by the width of the nearest size container.
props:
  - name: layout
    type: '"hanging" | "split-5-7" | "split-1-2"'
    description: A preset that places children in alternating narrow and wide columns. Presets ignore Col spans.
  - name: rules
    type: boolean
    default: "false"
    description: Draws hairlines between columns.
  - name: debug
    type: boolean
    default: "false"
    description: Shows the column overlay.
  - name: rowGap
    type: 1 – 9
    default: "6"
    description: Row gap as a spacing step.
  - name: as
    type: ElementType
    default: '"div"'
    description: Element to render.
a11y:
  - The grid changes only visual placement; reading and tab order follow the source order, so write the source in reading order.
  - Below 600px of container width, presets stack into one column, which keeps content readable at 320px.
---
import Example from "../../components/Example.astro";
import Spans from "../../demos/grid/Spans";
import spansSource from "../../demos/grid/Spans.tsx?raw";
import Hanging from "../../demos/grid/Hanging";
import hangingSource from "../../demos/grid/Hanging.tsx?raw";

A grid must sit inside a size container (Container, Section, Col or the page body). The `docs-cell` class only colours these demos.

<Example title="Spans per column count" source={spansSource} of={Spans}>
  <Spans />
</Example>

<Example title="Hanging layout" source={hangingSource} of={Hanging}>
  <Hanging />
</Example>
```

`apps/docs/src/content/components/col.mdx`:

```mdx
---
title: Col
group: Layout
order: 4
summary: A grid item with a span and start for each column count; it is also a size container for nested grids.
props:
  - name: span
    type: "{ 4?: number; 8?: number; 12?: number }"
    default: full width
    description: Columns to span when the grid has 4, 8 or 12 columns.
  - name: start
    type: "{ 4?: number; 8?: number; 12?: number }"
    default: auto
    description: Column to start at, per column count.
  - name: as
    type: ElementType
    default: '"div"'
    description: Element to render.
  - name: style
    type: CSSProperties
    description: Merged after the span and start variables.
a11y:
  - Offsets move items visually only; keep the source order the same as the reading order.
---
import Example from "../../components/Example.astro";
import Offsets from "../../demos/col/Offsets";
import offsetsSource from "../../demos/col/Offsets.tsx?raw";

<Example title="Starts and spans" source={offsetsSource} of={Offsets}>
  <Offsets />
</Example>
```

`apps/docs/src/content/components/stack.mdx`:

```mdx
---
title: Stack
group: Layout
order: 5
summary: Spaces its children evenly along one axis with a step from the spacing scale.
props:
  - name: gap
    type: 1 – 9
    description: Space between children as a spacing step.
  - name: direction
    type: '"column" | "row"'
    default: '"column"'
    description: Axis of the stack. Rows wrap.
  - name: as
    type: ElementType
    default: '"div"'
    description: Element to render, for example "ul" for a list.
a11y:
  - Stack adds no semantics; render it as ul or ol when the children form a list.
---
import Example from "../../components/Example.astro";
import Column from "../../demos/stack/Column";
import columnSource from "../../demos/stack/Column.tsx?raw";
import Row from "../../demos/stack/Row";
import rowSource from "../../demos/stack/Row.tsx?raw";

<Example title="Column" source={columnSource} of={Column}>
  <Column />
</Example>

<Example title="Row" source={rowSource} of={Row}>
  <Row />
</Example>
```

`apps/docs/src/content/components/rule.mdx`:

```mdx
---
title: Rule
group: Layout
order: 6
summary: A hairline thematic break, in default, strong or signal weight.
props:
  - name: variant
    type: '"default" | "strong" | "signal"'
    default: '"default"'
    description: Line weight and colour. Signal uses the brand colour and is for one break per page at most.
  - name: className
    type: string
    description: Extra classes, added after sw-rule.
a11y:
  - Renders an hr, which screen readers announce as a separator. For purely decorative lines, use a CSS border instead.
---
import Example from "../../components/Example.astro";
import Variants from "../../demos/rule/Variants";
import variantsSource from "../../demos/rule/Variants.tsx?raw";

<Example title="Variants" source={variantsSource} of={Variants}>
  <Variants />
</Example>
```

- [ ] **Step 3: Build and run everything**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS. Seven component pages are now linked from the index.

If the build reports a schema error, the YAML frontmatter is the cause, for example an unquoted type containing `:` or `|`. Quote it.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): layout component pages"
```

---

### Task 14: Type component pages

**Files:**
- Create: `apps/docs/src/content/components/{heading,text,eyebrow,figure}.mdx`
- Create demos: `apps/docs/src/demos/heading/LevelsAndSizes.tsx`, `text/Tones.tsx`, `eyebrow/Basic.tsx`, `figure/Basic.tsx`

- [ ] **Step 1: Write the demos**

Demos never render a level 1 heading, because the page already has its `h1`.

`apps/docs/src/demos/heading/LevelsAndSizes.tsx`:

```tsx
import { Heading, Stack } from "@raster/react";

export default function LevelsAndSizes() {
  return (
    <Stack gap={4}>
      <Heading level={2}>Level 2 at its default size</Heading>
      <Heading level={2} size="h4">
        Level 2 set at h4 size
      </Heading>
      <Heading level={3} size="h2">
        Level 3 set at h2 size
      </Heading>
    </Stack>
  );
}
```

`apps/docs/src/demos/text/Tones.tsx`:

```tsx
import { Stack, Text } from "@raster/react";

export default function Tones() {
  return (
    <Stack gap={3}>
      <Text measure>Primary body text holds a 66-character measure for comfortable reading.</Text>
      <Text tone="secondary">Secondary text for supporting detail.</Text>
      <Text size="caption" tone="muted">
        Muted caption for metadata
      </Text>
      <Text mono size="caption">
        --space-4: 1rem
      </Text>
    </Stack>
  );
}
```

`apps/docs/src/demos/eyebrow/Basic.tsx`:

```tsx
import { Eyebrow, Heading, Stack } from "@raster/react";

export default function Basic() {
  return (
    <Stack gap={2}>
      <Eyebrow>03 / Colour</Eyebrow>
      <Heading level={2} size="h3">
        Two themes, two modes
      </Heading>
    </Stack>
  );
}
```

`apps/docs/src/demos/figure/Basic.tsx`:

```tsx
import { Figure } from "@raster/react";

export default function Basic() {
  return (
    <Figure caption="Figure 1 — Twelve columns, eleven gutters.">
      <svg viewBox="0 0 236 60" width="100%" role="img" aria-label="Twelve vertical bars of equal width">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 20} y="0" width="16" height="60" fill="currentColor" opacity="0.15" />
        ))}
      </svg>
    </Figure>
  );
}
```

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/heading.mdx`:

```mdx
---
title: Heading
group: Type
order: 1
summary: A heading whose outline level and visual size are set independently.
props:
  - name: level
    type: 1 | 2 | 3 | 4 | 5 | 6
    description: Required. The element (h1 to h6) and its place in the document outline.
  - name: size
    type: '"display" | "h1" | "h2" | "h3" | "h4"'
    default: matches the level
    description: Visual size from the type scale. Levels 5 and 6 default to h4.
  - name: className
    type: string
    description: Extra classes, added after the size class.
a11y:
  - Choose the level for structure and the size for appearance; never skip a level to get a smaller heading.
  - Use one level-1 heading per page.
---
import Example from "../../components/Example.astro";
import LevelsAndSizes from "../../demos/heading/LevelsAndSizes";
import levelsSource from "../../demos/heading/LevelsAndSizes.tsx?raw";

<Example title="Levels and sizes" source={levelsSource} of={LevelsAndSizes}>
  <LevelsAndSizes />
</Example>
```

Before writing this page, check `packages/react/src/type/Heading.tsx` for the default size of levels 5 and 6 (`DEFAULT_SIZE`). If it is not `h4`, correct the `size` description.

`apps/docs/src/content/components/text.mdx`:

```mdx
---
title: Text
group: Type
order: 2
summary: Body and caption text in primary, secondary or muted tone, optionally at the reading measure or in mono.
props:
  - name: size
    type: '"body" | "caption"'
    default: '"body"'
    description: Step on the type scale.
  - name: tone
    type: '"primary" | "secondary" | "muted"'
    default: '"primary"'
    description: Text colour role. Every tone passes 4.5:1 on every surface.
  - name: measure
    type: boolean
    default: "false"
    description: Limits the line length to 66 characters.
  - name: mono
    type: boolean
    default: "false"
    description: Sets the text in Geist Mono.
  - name: as
    type: ElementType
    default: '"p"'
    description: Element to render.
a11y:
  - Muted text still meets 4.5:1, but keep essential information in primary or secondary tone.
  - Text resizes with browser zoom up to 200% without loss of content.
---
import Example from "../../components/Example.astro";
import Tones from "../../demos/text/Tones";
import tonesSource from "../../demos/text/Tones.tsx?raw";

<Example title="Tones and sizes" source={tonesSource} of={Tones}>
  <Tones />
</Example>
```

`apps/docs/src/content/components/eyebrow.mdx`:

```mdx
---
title: Eyebrow
group: Type
order: 3
summary: A small mono label that annotates a heading or section, Swiss-style, with numbers and slashes.
props:
  - name: as
    type: ElementType
    default: '"span"'
    description: Element to render; use "p" when the label stands alone.
  - name: className
    type: string
    description: Extra classes, added after sw-type-label.
a11y:
  - An eyebrow is not a heading; keep the real heading as the next element so the outline stays meaningful.
  - It is named Eyebrow, not Label, so it is never confused with a form field label.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/eyebrow/Basic";
import basicSource from "../../demos/eyebrow/Basic.tsx?raw";

<Example title="Above a heading" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/figure.mdx`:

```mdx
---
title: Figure
group: Type
order: 4
summary: An image, chart or table with a caption set in the secondary caption style.
props:
  - name: caption
    type: ReactNode
    description: Required. Rendered as the figcaption, after the content.
  - name: children
    type: ReactNode
    description: Required. The figure content.
  - name: className
    type: string
    description: Extra classes, added after sw-figure.
a11y:
  - The figcaption names the figure for assistive technology; images inside still need their own alt text or role="img" with a label.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/figure/Basic";
import basicSource from "../../demos/figure/Basic.tsx?raw";

<Example title="With a caption" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

- [ ] **Step 3: Build and run everything**

Run: `pnpm --filter @raster/docs build && pnpm e2e`

Expected: PASS (11 component pages).

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): type component pages"
```

---

### Task 15: IconButton and Link pages

**Files:**
- Create: `apps/docs/src/content/components/{icon-button,link}.mdx`
- Create demos: `apps/docs/src/demos/icon-button/Basic.tsx`, `apps/docs/src/demos/link/Kinds.tsx`

- [ ] **Step 1: Write the demos**

`apps/docs/src/demos/icon-button/Basic.tsx`:

```tsx
import { IconButton, Stack } from "@raster/react";
import { Plus, Settings, X } from "lucide-react";

export default function Basic() {
  return (
    <Stack direction="row" gap={2}>
      <IconButton label="Add item">
        <Plus aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <IconButton label="Settings" variant="ghost">
        <Settings aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <IconButton label="Close" variant="ghost">
        <X aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
    </Stack>
  );
}
```

`apps/docs/src/demos/link/Kinds.tsx`:

```tsx
import { Link, Stack, Text } from "@raster/react";

export default function Kinds() {
  return (
    <Stack gap={3}>
      <Text>
        Read the <Link href="/foundations/grid/">grid foundations</Link> first.
      </Text>
      <Text>
        <Link href="https://www.w3.org/WAI/standards-guidelines/wcag/" external>
          WCAG 2.2
        </Link>
      </Text>
      <Text>
        <Link href="/components/link/" aria-current="page">
          The current page
        </Link>
      </Text>
    </Stack>
  );
}
```

If `aria-current` does not typecheck on `Link` (`pnpm --filter @raster/docs typecheck`), drop that third line and its paragraph. Header and Breadcrumbs pages in Plan 4b show the current state instead.

- [ ] **Step 2: Write the MDX pages**

`apps/docs/src/content/components/icon-button.mdx`:

```mdx
---
title: IconButton
group: Actions
order: 2
summary: A square button that shows only an icon and carries its name in a required label.
interactive: true
props:
  - name: label
    type: string
    description: Required. The accessible name, set as aria-label.
  - name: children
    type: ReactElement
    description: Required. One Lucide icon, outline style, stroke 1.5, with aria-hidden.
  - name: variant
    type: '"primary" | "secondary" | "ghost" | "danger"'
    default: '"secondary"'
    description: As on Button.
  - name: onPress
    type: "(event: PressEvent) => void"
    description: Called on activation.
  - name: isDisabled
    type: boolean
    default: "false"
    description: Disables the button.
a11y:
  - The label is the only name screen readers get; describe the action ("Close panel"), not the icon ("X").
  - The visible square is 40px and the hit area is padded to 44px.
  - Pair it with a Tooltip so sighted mouse and keyboard users can read the label too.
---
import Example from "../../components/Example.astro";
import Basic from "../../demos/icon-button/Basic";
import basicSource from "../../demos/icon-button/Basic.tsx?raw";

<Example title="Labelled icons" source={basicSource} of={Basic}>
  <Basic />
</Example>
```

`apps/docs/src/content/components/link.mdx`:

```mdx
---
title: Link
group: Actions
order: 3
summary: An underlined text link in the accent colour; external links add an arrow and say they open a new tab.
props:
  - name: href
    type: string
    description: Destination. Without it the link renders as a span with role="link", for use with onPress only.
  - name: external
    type: boolean
    default: "false"
    description: Opens in a new tab with rel="noopener noreferrer", adds an arrow icon and announces "(opens in a new tab)".
  - name: aria-current
    type: '"page" | "true"'
    description: Marks the link to the current page; it is then shown in primary text without an underline.
  - name: isDisabled
    type: boolean
    default: "false"
    description: Disables the link.
  - name: onPress
    type: "(event: PressEvent) => void"
    description: Called on activation, in addition to navigation.
a11y:
  - Links are underlined, so they are recognisable without colour (WCAG 1.4.1).
  - Write link text that makes sense on its own; avoid "click here".
  - External links say that they open a new tab, in text that screen readers announce.
---
import Example from "../../components/Example.astro";
import Kinds from "../../demos/link/Kinds";
import kindsSource from "../../demos/link/Kinds.tsx?raw";

<Example title="Inline, external and current" source={kindsSource} of={Kinds}>
  <Kinds />
</Example>
```

- [ ] **Step 3: Build and run everything**

Run: `pnpm build && pnpm typecheck && pnpm test && pnpm e2e`

Expected: PASS (13 component pages).

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "feat(docs): IconButton and Link pages"
```

---

### Task 16: Spec notes and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-11-04-raster-design-system-design.md`

- [ ] **Step 1: Update spec §2 (the `docs` row)**

In the "Package responsibilities" table, replace the `docs` row with:

```
| `docs` | all three packages | static site (Astro 7.4.1, pinned: later 7.x releases need Node ≥ 22.23.4) |
```

- [ ] **Step 2: Update spec §10 (the "Pages" row)**

Replace the "Pages" row with:

```
| Pages | axe on every built docs page in all four theme and mode combinations; reflow at 320px; keyboard walkthroughs of Dialog and Menu | Playwright + @axe-core/playwright |
```

- [ ] **Step 3: Replace the "Docs site notes (Plan 4)" bullet in §11 with**

```markdown
- **Docs site (Plan 4a).**
  - **Hydration:** React Aria components need client hydration in Astro, so interactive demos carry a `client:*` directive. Astro passes an island's children as static HTML, so composite components (Tabs, Select, Menu, Dialog) cannot be assembled in `.astro` or MDX: each interactive demo is one `.tsx` file rendered as a single island. Header, Link and Breadcrumbs work as server-rendered HTML.
  - **HTML first:** `.astro` pages write the `sw-` class contract directly; React appears only in `src/demos/*.tsx`. Each example's React snippet is its demo file's source, and static examples also show the demo's rendered HTML with React Aria runtime attributes removed, so snippets never drift.
  - **Stylesheet order:** load `raster.css` before `motion.css`. Both declare the full layer order, so loading them out of order is safe. Vite merges them into one file and drops the order statements, but keeps the layers in canonical first-appearance order.
  - **Page transitions:** loading `motion.css` opts the whole site into cross-document page transitions (`@view-transition`). The `[data-motion="reduce"]` switch cannot turn these off; only the OS reduced-motion setting can.
  - **Sticky header assumption:** `:root:has(.sw-header[data-sticky])` sets `scroll-padding` assuming the header is never taller than `--header-height`.
  - **Tooling:** `astro check` does not resolve under pnpm here, so the docs type check is `tsc` over `.ts`/`.tsx` files, and the build checks `.astro` and `.mdx`. Astro 7's `preview` keeps a lock file, so Playwright starts it with `--ignore-lock`.
```

- [ ] **Step 4: Run the full verification**

Run: `pnpm verify`

Expected:
- **Build:** every package builds, and the docs build reports 20 pages: home, 4 foundations, themes, the components index and 13 component pages.
- **Lint and typecheck:** clean.
- **Unit tests:** tokens 25, css 113, react 110, and docs (settings, nav, html-snippet, contrast-table, components) all pass.
- **e2e:** passes, with 6 a11y tests per page, the site, foundations, themes and component tests.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-11-04-raster-design-system-design.md
git commit -m "docs(spec): record docs-site architecture and page gates"
```

---

## Self-review against the spec

- **§1, criterion 1:** HTML snippets are derived from the React demos (Task 3), and the shell is pure HTML contract (Task 4).
- **§1, criterion 4:** axe runs on every built page, in four combinations (Task 5). It applies automatically to 4b pages.
- **§8:** reflow at 320px (Task 5), the skip link and its focus target (Task 5), focus rings on code regions, and pressed states not by colour alone (Task 4).
- **§9:**
  - **Principles:** Task 6.
  - **Grid with the overlay toggle in the header:** Tasks 4 and 7.
  - **Type specimen:** Task 8.
  - **Contrast table from `tokens.json`:** Task 9.
  - **Replayable motion demos:** Task 10.
  - **Theme playground:** Task 11.
  - **Component pages** (demo, HTML and React snippets, props, a11y notes): Tasks 12–15 for 13 components. The remaining 18 components and the templates are in Plan 4b.
- **§10, "Pages" row:** axe in this plan. Keyboard walkthroughs of Dialog and Menu, and visual regression, are in Plan 4b.
- **§11 notes:** honoured. `client:load` is used on the interactive islands, `raster.css` loads before `motion.css`, and the spec text is updated in Task 16.
