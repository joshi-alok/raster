# Raster Plan 6: Studio Achse demo website

> **For agentic workers:** executed inline (executing-plans). Steps use checkbox (`- [ ]`) syntax.

**Goal:** A realistic agency website for a fictional design studio, Studio Achse (Lucerne), built only with `@raster/css`, so Raster can be judged as a client site rather than as documentation. It ships in Alpine, with a small footer switch for Zürich and light/dark.

**Architecture:** A new Astro app, `apps/studio` (`@raster/studio`), with its own header and footer and no docs chrome. HTML class contract only; the one script binds the display switch and the demo contact form. Project imagery is theme-aware SVG placeholder art drawn on the 12-column field, coloured only through role variables. Content lives in `src/data/`.

**Tech stack:** Astro 7.4.1, `@raster/css`, Geist, Playwright + axe.

## Pages

| Path | Content |
|---|---|
| `/` | Statement hero, selected work (3), services on the hanging grid, figures, clients, contact call |
| `/work/` | All six projects as a cover grid, then a typographic index table |
| `/work/<slug>/` | One case study per project: cover, facts, challenge, approach, outcome, figures, results, next project |
| `/studio/` | About, three principles, how we work (4 steps), people (8), joining |
| `/contact/` | Address, hours, map placeholder, a demo enquiry form that sends nothing |

All names, clients, addresses and figures are fictional. Email uses the reserved `example` domain.

## Tasks

### Task 1: Scaffold
- [ ] `apps/studio/package.json`, `astro.config.mjs` (`trailingSlash: "always"`), `tsconfig.json`, `playwright.config.ts` (port 4390).
- [ ] `src/lib/settings.ts`: theme and mode only, storage key `achse:settings`, `INIT_SCRIPT` and `bindSettings` as in the docs.
- [ ] Root `e2e` script runs both apps' suites.

### Task 2: Layout
- [ ] `Site.astro`: head, skip link, sticky header (wordmark, Work, Studio, Contact, "Start a project"), `main#main tabindex=-1`, footer (address, links, display switch, fictional-studio note).
- [ ] `src/styles/studio.css` (unlayered, `st-` prefix) for site-only composition.

### Task 3: Content and graphics
- [ ] `src/data/projects.ts` (6 projects with facts, text, stats, optional quote) and `src/data/studio.ts` (services, people, steps, clients).
- [ ] `Cover.astro`: six cover compositions plus case-study figures (sign family, line diagram, detail), all `role="img"` with labels.

### Task 4: Pages
- [ ] Home, Work index, `work/[slug].astro` via `getStaticPaths`, Studio, Contact.
- [ ] Contact form: native validation; on submit, prevent sending and show a status callout saying the demo sends nothing.

### Task 5: Tests
- [ ] `e2e/a11y.spec.ts`: every built page has a title, one h1, a focusable main, sound outline, 320px reflow, and no axe violations in all four theme/mode combinations.
- [ ] `e2e/site.spec.ts`: nav marks the current section; work index lists six projects linking to case pages; case page shows facts and a next-project link; contact form validates and confirms without navigating; footer switch sets theme and mode.

### Task 6: Verify
- [ ] `pnpm verify` passes; browser check of every page in Alpine light and dark at 360 and 1440px, and a spot check in Zürich.
