# Raster — a reimagined Swiss Style design system

- **Date:** 2026-11-04
- **Status:** Approved design, pending implementation plan
- **Working name:** Raster (German for "grid"; rename only affects package names)

## 1. Purpose

Reimagine the International Typographic Style (Swiss Style) as a modern web design system. Classic Swiss Style was a print discipline; Raster translates its principles to the screen:

- **Fluid grid as the foundation.** The grid adapts continuously to its container while keeping strict proportions. The grid itself carries the brand identity.
- **Accessibility as a constraint.** WCAG 2.2 AA is enforced by automated checks, not aspirational.
- **Motion as an optional layer.** Calm by default, expressive on opt-in.
- **A new palette and calmer hierarchy.** Moves beyond red/black: sleeker type, smaller headings, white pages.

### Success criteria

1. A team can build a page using only `@raster/css` (no React) or `@raster/react`, and both render identically.
2. Every text/background pairing in every theme and mode passes WCAG AA; the build fails otherwise.
3. Switching theme (`data-theme`) or mode (`data-mode`) re-themes any subtree with no component code changes.
4. The docs site, built entirely with Raster, passes axe with zero violations on every page.

## 2. Architecture

pnpm-workspace monorepo, TypeScript throughout.

```
raster/
  packages/
    tokens/   tokens.ts → build script → CSS per theme + DTCG JSON + contrast check
    css/      reset, base, grid, type, components, utilities, motion.css (Lightning CSS)
    react/    thin components + React Aria behavior (compiled with tsc)
  apps/
    docs/     Astro + MDX, React islands for interactive demos
```

### Dependency direction

`tokens` → `css` → `react` → `docs`. Nothing depends upward. `css` consumes only the generated CSS variables from `tokens`. `react` renders `css` class names and adds behavior; it contains no styling of its own.

### Package responsibilities

| Package | Inputs | Outputs |
|---|---|---|
| `@raster/tokens` | `src/` TypeScript modules (single source of truth) | `dist/tokens.css` (foundation tokens, then Alpine, then Zürich), `dist/tokens.json` (W3C DTCG format), build failure on contrast violation |
| `@raster/css` | token CSS variables | `dist/raster.css` (all layers), `dist/motion.css` (opt-in expressive tier) |
| `@raster/react` | `@raster/css` class contract | ESM + type declarations, emitted by `tsc` (consumed through a bundler) |
| `docs` | all three packages | static site (Astro 7.4.1, pinned: later 7.x releases need Node ≥ 22.23.4) |

The token build script is about 50 lines of TypeScript run with `tsx`. No Style Dictionary.

## 3. Foundations: grid and spacing

### Fluid grid

- **Columns by container width (CSS container queries), not viewport:**
  - Under 600px: 4 columns
  - 600px up to (not including) 1024px: 8 columns
  - 1024px and wider: 12 columns
- **Gutter:** `clamp(16px, 2vw, 32px)`.
- **Page margin:** `clamp(16px, 5vw, 96px)`.
- **Max content width:** 1440px.

### Spacing

- **Base unit:** 4px.
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px (tokens `space-1` … `space-9`). Steps 7–9 (48px and up) scale slightly with viewport via `clamp()`.
- **Baseline rhythm:** line heights rounded to multiples of 4px using CSS `round()`, with a fixed-value fallback where unsupported.

### Layout presets (signature Swiss patterns)

- **Hanging:** labels in columns 1–3, content in 4–12. Collapses to stacked under 8 columns.
- **Asymmetric splits:** 5/7 and 1/3 + 2/3.
- **Full bleed:** content cancels the page margins (`.sw-bleed`). Once the container reaches its maximum width it no longer touches the viewport edge; a viewport-wide variant is a version 2 item.

### Visible grid

- **Column rules:** an optional hairline column-rule treatment (`data-grid-rules`), usable as a design element.
- **Debug overlay:** shows tinted columns (Plan 1). A 4px baseline stripe and the docs-header toggle arrive with the docs site (Plan 4).

## 4. Foundations: typography

- **Families:**
  - **Geist** for all text.
  - **Geist Mono** for labels, grid annotations, code and figures in data contexts (`.sw-mono`). Captions stay in Geist.
  - **Fallbacks:** Noto Sans for scripts Geist does not cover, then `system-ui`.
- **Fluid modular scale:**
  - Ratio 1.2 at a 360px viewport, rising to 1.25 at 1440px.
  - Base font size 16px → 17px.
  - Each size is a `clamp()` combining `rem` and `vw`, so browser zoom still scales text.

| Token | Min → max (px) | Weight | Tracking | Line height |
|---|---|---|---|---|
| `display` | 40 → 52 | 300 | -0.025em | 1.1 |
| `h1` | 33 → 42 | 400 | -0.02em | 1.15 |
| `h2` | 28 → 33 | 400 | -0.015em | 1.15 |
| `h3` | 23 → 27 | 400 | -0.01em | 1.2 |
| `h4` | 19 → 21 | 500 | 0 | 1.3 |
| `body` | 16 → 17 | 400 | 0 | 1.5 |
| `caption` | 13 → 14 | 400 | 0 | 1.4 |
| `label` (mono) | 12 | 400 | +0.04em, uppercase | 1.3 |

### Typography rules

- **Weights:** 300, 400 and 500 only. Never 700.
- **Alignment:** flush left, ragged right. Never justified.
- **Measure:** body text capped at 66ch.
- **Case:** sentence case everywhere. Mono labels are the only uppercase.
- **Hyphenation:** `hyphens: auto`, driven by the `lang` attribute.

## 5. Foundations: colour and theming

### Token layers

1. **Scales.** Per-theme hue ramps at stops 100/300/500/700/900, plus 50 for neutrals. These are design-time references: the token source stores role values directly, and the scales are added to the DTCG JSON and the docs colour page in Plan 4.
2. **Roles.** The only layer components consume:
   - **Surfaces:** `surface-page`, `surface-raised`, `surface-subtle`.
   - **Text:** `text-primary`, `text-secondary`, `text-muted`.
   - **Borders:** `border` (decorative hairline), `border-strong` (control boundaries, ≥ 3:1).
   - **Accent:** `accent`, `accent-subtle`, `on-accent`.
   - **Status:** `success`, `warning`, `danger`, each with `-subtle` and `on-` variants.
3. **Themes.** A theme is a role-to-scale mapping:
   - **Selector:** `[data-theme="alpine" | "zurich"]` works on any element, and themes can nest. Alpine also applies on `:root` as the default.
   - **Mode:** every colour role is emitted as `light-dark(<light>, <dark>)`. `:root` sets `color-scheme: light dark`, so mode follows `prefers-color-scheme`. `[data-mode="light" | "dark"]` sets `color-scheme` on any element. Because `color-scheme` inherits, nested themes follow the surrounding mode automatically.
   - **Text-on-tint roles:** `on-accent-subtle`, `on-success-subtle`, `on-warning-subtle` and `on-danger-subtle`.
   - **Decorative role:** `brand-signal`. In Alpine it is glacier 500 (#7FA7C9 light, #9DC0DE dark).

### Shade usage rule

- **500 shades:** fills, charts and decoration only.
- **700 shades** (light mode): text, links and button fills.

### Alpine (default theme)

**Scales**

| Hue | 50 | 100 | 300 | 500 | 700 | 900 |
|---|---|---|---|---|---|---|
| slate | #F2F5F7 | #E3E8EC | #B4BFC8 | #7D8A96 | #4A5763 | #1B242C |
| glacier | — | #E3EDF5 | #A9C6DE | #7FA7C9 | #2F5F8A | #183652 |
| moss | — | #E6EEE5 | #B7CBB4 | #7C9A79 | #476445 | #2A3D29 |
| alert | — | #FBE7E4 | #F2AFA4 | #D6402E | #B23422 | #6E1F14 |
| ochre | — | #F7EED9 | #E5C98A | #C9962E | #7F5C14 | #4A360C |

**Roles**

| Role | Light | Dark |
|---|---|---|
| surface-page | #FFFFFF | #12181D |
| surface-raised | #FFFFFF | #1A2229 |
| surface-subtle | #F2F5F7 | #222C34 |
| text-primary | #1B242C | #E6ECF0 |
| text-secondary | #4A5763 | #A3AFB9 |
| text-muted | #63707C | #8794A0 |
| border | #E3E8EC | #2E3943 |
| border-strong | #7D8A96 | #74818D |
| accent / on-accent | #2F5F8A / #FFFFFF | #9DC0DE / #12181D |
| accent-subtle | #E3EDF5 | #183652 |
| success | #476445 | #A3BFA0 |
| warning | #7F5C14 | #E2B85C |
| danger / on-danger | #B23422 / #FFFFFF | #F08A78 / #12181D |

In Alpine, red appears only for errors and destructive actions. Brand identity comes from the grid and type, not from colour.

### Zürich (alternate theme)

**Scales**

| Hue | 50 | 100 | 300 | 500 | 700 | 900 |
|---|---|---|---|---|---|---|
| warm grey | #F4F1EA | #E8E4DA | #BDB7AA | #8A847A | #55524C | #1C1C1E |
| cobalt | — | #E4E8FB | #9DAAF0 | #6A7FEA | #2F4BD8 | #1A2A80 |
| sage | — | #E8EEE7 | #C3D0C1 | #9DB09A | #4F6450 | #2C3A2D |
| signal red | — | #FBE5E1 | #F4A797 | #E5341D | #C02A17 | #6F180D |
| ochre | (same as Alpine) | | | | | |

**Roles**

| Role | Light | Dark |
|---|---|---|
| surface-page | #FCFBF8 | #161513 |
| surface-raised | #FFFFFF | #1F1E1B |
| surface-subtle | #F4F1EA | #282622 |
| text-primary | #1C1C1E | #EDEAE3 |
| text-secondary | #55524C | #B3AEA4 |
| text-muted | #6B665D | #918C82 |
| border | #E8E4DA | #34322D |
| border-strong | #8A847A | #7E796F |
| accent / on-accent | #2F4BD8 / #FFFFFF | #9DAAF0 / #161513 |
| accent-subtle | #E4E8FB | #1A2A80 |
| success | #4F6450 | #A8BBA6 |
| warning | #7F5C14 | #E2B85C |
| danger / on-danger | #C02A17 / #FFFFFF | #F2836F / #161513 |
| brand-signal | #E5341D (decoration only: a single rule or marker; never text) | #F2836F |

### Verified contrast

Worst cases across all text roles on all three surfaces:

| Theme | Worst text pairing | Worst control border |
|---|---|---|
| Alpine light | 4.63:1 | 3.22:1 |
| Alpine dark | 4.58:1 | 3.56:1 |
| Zürich light | 5.05:1 | 3.29:1 |
| Zürich dark | 4.51:1 | 3.49:1 |

The build-time check enforces these thresholds:

- Every text role on every surface: ≥ 4.5:1.
- `border-strong` on every surface: ≥ 3:1.
- Each `on-*` colour on its fill: ≥ 4.5:1.
- Each `-subtle` tint with the text on it: ≥ 4.5:1.

**`-subtle` mapping.** Each `-subtle` tint (accent, success, warning, danger) is the hue's 100 stop in light mode and its 900 stop in dark mode. Text placed on a tint is the hue's 900 stop in light mode and the role colour in dark mode. All pairs were verified; the dark-mode minimum is 4.55:1 (Zürich danger).

### Other tokens

- **Radius:** `radius` is 4px in Alpine and 0 in Zürich. `radius-full` is reserved for Switch and Tag only.
- **Shadow:** `shadow-overlay` is the only shadow token. It is used by Dialog, Menu, Tooltip and Toast.
- **Focus:** a 2px `accent` outline with a 2px offset, from the `focus-width` and `focus-offset` tokens.

## 6. Components

### Build model

- **CSS layers:**

  ```css
  @layer raster.reset, raster.tokens, raster.base, raster.layout, raster.components, raster.utilities;
  ```

  Consumer CSS outside these layers always wins.
- **Class contract:**
  - Component classes use the `sw-` prefix (`.sw-button`).
  - Variants and states are data attributes (`data-variant`, `data-size`, `data-invalid`).
  - This HTML/class contract is the public API of `@raster/css`.
- **Utilities:** spacing, grid span/start and text-style utilities only.
- **React:**
  - Components render the CSS contract.
  - Every component forwards `ref` and merges `className`.
  - Layout primitives accept `as`.
- **Interactive behavior:** React Aria Components powers Dialog, Menu, Select, Tabs, Tooltip, Toast, Checkbox, Radio group and Switch.
- **Icons:** Lucide, outline style, 1.5px stroke.
- **Sizing:**
  - Control height is 40px.
  - Touch targets are at least 44px, padding the hit area where the visual is smaller.

### Visual rules

- **Surfaces:** flat, separated by hairlines and white space. No shadows except `shadow-overlay`.
- **Buttons:**
  - `primary` is an accent fill; use at most one per view.
  - `secondary` is a `border-strong` outline. This is the default.
  - `ghost` is text only.
  - `danger` is a danger fill, for destructive actions only.
- **States:** never conveyed by colour alone. Pair colour with a border, icon or text, so states survive `forced-colors` mode.

### Version 1 set (31 components)

| Group | Components |
|---|---|
| Layout | Container, Grid, Col, Stack, Rule, Section |
| Type | Heading (`level` and `size` independent), Text, Eyebrow (mono annotation label; named to avoid clashing with form labels), Figure |
| Actions | Button, IconButton, Link |
| Forms | Field (label + description + error, wires `aria-describedby`), TextField, TextArea, Select, Checkbox, RadioGroup, Switch |
| Display | Card, Table, Tag, Callout (info / success / warning / danger) |
| Overlay and navigation | Dialog, Menu, Tooltip, Toast, Tabs, Header (includes skip link), Breadcrumbs |

**Deferred to version 2:** DatePicker, Combobox, DataGrid, Charts, SideNav, Pagination, FileUpload.

## 7. Motion

### Tokens

- **Durations:**
  - `dur-fast`: 120ms (hover, press)
  - `dur-base`: 200ms (overlays)
  - `dur-slow`: 320ms (panels)
  - `dur-layout`: 480ms (layout changes)
- **Easing:**
  - `ease-standard`: `cubic-bezier(0.2, 0, 0, 1)`
  - `ease-linear`: for opacity

### Principles

- **Direction:** movement only along grid axes (x or y).
- **Forbidden:** no bounce, overshoot, rotation or scale pops.

### Tiers

- **Core, always shipped in `raster.css`:** micro-interactions and overlay enter/exit (fade plus ≤ 8px translate).
- **Expressive, opt-in via `motion.css` and `<Reveal>`:**
  - Column-staggered scroll reveals (CSS scroll-driven animations).
  - Page transitions (View Transitions API).
  - Geist variable-weight shift on interaction.
  - Progressive enhancement only, with no JS animation library.

### Reduced motion

`prefers-reduced-motion: reduce`, or `[data-motion="reduce"]`:

- All transforms are removed.
- Fades are capped at 120ms.
- The expressive tier is fully disabled.

## 8. Accessibility requirements (WCAG 2.2 AA)

- Contrast enforced at build time (section 5).
- Text resizes to 200% via browser zoom; layouts reflow at 320px without horizontal scroll.
- Heading level is decoupled from visual size.
- Full keyboard operability:
  - Visible focus that is never obscured by sticky elements (2.4.11).
  - Skip link in Header.
- Target size ≥ 44px (exceeds 2.5.8).
- **Internationalisation:**
  - CSS logical properties throughout, so RTL layouts mirror correctly.
  - `lang`-driven hyphenation.
  - Noto Sans fallback for non-Latin scripts.
- Windows high-contrast mode (`forced-colors`) supported; no state relies on colour or background alone.

## 9. Documentation site

Built entirely with Raster. Astro + MDX, React islands only where interactive.

- **Principles:** a short manifesto covering grid as identity, calm hierarchy and accessibility as constraint.
- **Foundations:**
  - **Grid:** live overlay toggle in the header.
  - **Type:** specimen at every step.
  - **Colour:** contrast table generated from `tokens.json`.
  - **Motion:** replayable demos.
- **Components:** one page each, with:
  - a live demo,
  - HTML and React snippets,
  - a props table,
  - accessibility notes.
- **Theme playground:** Alpine and Zürich in light and dark, side by side.
- **Templates:** editorial article, dashboard, landing page.

## 10. Testing and quality gates

| Layer | Check | Tool |
|---|---|---|
| Tokens | All contrast thresholds, 2 themes × 2 modes | Vitest, run in the token build |
| CSS | No raw colour literals in component CSS; tokens only | stylelint (`color-no-hex` + custom rule allowing `var(--…)`) |
| React behavior | Keyboard, state, focus management per component | Vitest + Testing Library |
| React accessibility | axe structural rules on each component in jsdom; colour contrast is enforced by the token build and re-checked in real browsers by the Playwright layer | axe-core (small test helper) |
| Visual regression | Docs component pages × 4 combos × 360 / 768 / 1440px | Playwright screenshots |
| Pages | axe on every built docs page in all four theme and mode combinations; reflow at 320px; keyboard walkthroughs of Dialog and Menu | Playwright + @axe-core/playwright |

## 11. Open decisions carried into later plans

- **Button and React Aria (done in Plan 2b).** `Button` wraps React Aria's `Button` (`onPress`, `isDisabled`, `[data-pressed]`), so it works as the trigger child of React Aria dialogs, menus and tooltips.
- **Publishable ESM (before any npm release).** `tsc` emits extensionless relative imports, which work through bundlers only. Publishing needs `.js` import specifiers with `moduleResolution: "NodeNext"`, or a bundling build step.
- **Shared overlay styles and theme-aware portal (done in Plan 3a).** `overlay.css` holds the popover, listbox, menu and overlay motion rules. `ThemeRegion` portals overlays into a host at the end of `<body>` that carries the region's effective theme and mode, so overlays escape transformed, clipped or stacked ancestors. Stacking uses the `--z-sticky`, `--z-modal` and `--z-toast` tokens.
- **Overlay follow-ups (later).** Menu does not yet expose popover `offset` / `shouldFlip` or `SubmenuTrigger`. The shared `toastQueue` is created at import time, which is fine for static builds but is shared across server-rendered requests. `react-aria` and `react-aria-components` must stay pinned in lockstep, or `ThemeRegion` silently stops working.
- **Link and React Aria (done in Plan 3b).** `Link` wraps React Aria's `Link` (`onPress`, `isDisabled`, `aria-current`). Without an `href` it renders a focusable `span` with `role="link"`, which only makes sense with `onPress`.
- **Docs site (Plan 4a).**
  - **Hydration:** React Aria components need client hydration in Astro, so interactive demos carry a `client:*` directive. Astro passes an island's children as static HTML, so composite components (Tabs, Select, Menu, Dialog) cannot be assembled in `.astro` or MDX: each interactive demo is one `.tsx` file rendered as a single island. Header, Link and Breadcrumbs work as server-rendered HTML.
  - **HTML first:** `.astro` pages write the `sw-` class contract directly; React appears only in `src/demos/*.tsx`. Each example's React snippet is its demo file's source, and static examples also show the demo's rendered HTML with React Aria runtime attributes removed, so snippets never drift.
  - **Stylesheet order:** load `raster.css` before `motion.css`. Both declare the full layer order, so loading them out of order is safe. Vite merges them into one file and drops the order statements, but keeps the layers in canonical first-appearance order.
  - **Page transitions:** loading `motion.css` opts the whole site into cross-document page transitions (`@view-transition`). The `[data-motion="reduce"]` switch cannot turn these off; only the OS reduced-motion setting can.
  - **Sticky header assumption:** `:root:has(.sw-header[data-sticky])` sets `scroll-padding` assuming the header is never taller than `--header-height`.
  - **Tooling:** `astro check` does not resolve under pnpm here, so the docs type check is `tsc` over `.ts`/`.tsx` files, and the build checks `.astro` and `.mdx`. Astro 7's `preview` keeps a lock file, so Playwright starts it with `--ignore-lock`.
- **Checkbox and Switch errors (later).** A standalone required `Checkbox` shows only a red border. React Aria's `CheckboxField` / `SwitchField` would add description and error slots.

## 12. Out of scope for version 1

- Publishing to npm (packages are built and consumed within the workspace).
- Figma library or token sync (the DTCG JSON export makes it possible later).
- Vue or Svelte bindings.
- Version 2 components (section 6).
