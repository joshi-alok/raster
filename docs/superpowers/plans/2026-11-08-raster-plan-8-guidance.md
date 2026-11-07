# Raster Plan 8: Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Say when to use each component and when not to, show five composed patterns, and set a content style that a test checks against the docs' own copy.

**Architecture:** Usage is structured frontmatter (`use`, `avoid`) on every component page, rendered as a fixed "Usage" section, with `instead` links resolved at build time. Patterns are a new `patterns` content collection, rendered at `/patterns/<id>/`, with live examples built only from `@raster/react`. Content style is a page under Foundations plus `src/lib/content-style.ts`, a pure checker that a Vitest test runs over component and pattern frontmatter, example titles and demo copy.

**Tech Stack:** Astro 7.4.1 with MDX and content collections (Zod schemas), React 19.1, `@raster/react`, Vitest, Playwright 1.64, `yaml` (new dev dependency of `apps/docs`, for reading frontmatter in tests).

**Spec:** §18 of `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`.

**Conventions for every task:**
- Work on branch `raster/plan-8`. Never push (there is no remote).
- End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Docs unit tests: `cd apps/docs && npx vitest run <file>`.
- The e2e tests serve `apps/docs/dist` with `astro preview` and reuse a running server. **Always rebuild before e2e** (`pnpm --filter @raster/css build && pnpm --filter @raster/docs build`), and make sure nothing old is listening on port 4388 (`lsof -i :4388`).
- Playwright: use `--project=chromium` or `--project=visual` (with `=`); file names go after the flags.
- British spelling, sentence case, no exclamation marks in all copy you write.

---

## File structure

**Create**
- `apps/docs/src/lib/guidance.ts`: the pattern list, hrefs, the `instead` link resolver, pattern sorting.
- `apps/docs/src/lib/content-style.ts`: the copy checker (pure functions).
- `apps/docs/src/pages/patterns/index.astro`, `apps/docs/src/pages/patterns/[slug].astro`.
- `apps/docs/src/content/patterns/{forms,navigation,data,empty-states,errors-and-feedback}.mdx`.
- `apps/docs/src/demos/patterns/{EnquiryForm,ErrorSummary,SectionPage,Overview,FirstUse,NoMatches,FieldAndPageErrors,Confirmation}.tsx`.
- `apps/docs/src/pages/foundations/content.astro`.
- `apps/docs/test/frontmatter.ts`: reads MDX frontmatter for tests.
- `apps/docs/test/guidance.test.ts`, `apps/docs/test/content-style.test.ts`, `apps/docs/test/copy.test.ts`, `apps/docs/test/patterns.test.ts`.
- `apps/docs/e2e/patterns.spec.ts`.

**Modify**
- `apps/docs/src/content.config.ts`: `use`, `avoid` on components; the `patterns` collection.
- `apps/docs/src/pages/components/[slug].astro`: the Usage section.
- `apps/docs/src/styles/docs.css`: `.docs-usage`, `.docs-rules`.
- `apps/docs/src/lib/nav.ts`: Patterns in `NAV`, Content style in `FOUNDATIONS`.
- All 60 `apps/docs/src/content/components/*.mdx`: `use` and `avoid`.
- `apps/docs/test/nav.test.ts`, `apps/docs/e2e/site.spec.ts`, `apps/docs/e2e/components.spec.ts`, `apps/docs/e2e/visual.spec.ts`.
- Demo and MDX copy that the checker flags (Task 8).

---

### Task 1: Usage section, link resolver, and the Actions pages

**Files:**
- Create: `apps/docs/src/lib/guidance.ts`, `apps/docs/test/guidance.test.ts`
- Modify: `apps/docs/src/content.config.ts`, `apps/docs/src/pages/components/[slug].astro`, `apps/docs/src/styles/docs.css`, `apps/docs/src/content/components/{button,icon-button,link}.mdx`

- [ ] **Step 1: Write the failing test**

`apps/docs/test/guidance.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PATTERNS, patternHref, sortPatterns, usageLink } from "../src/lib/guidance";

const titles = new Map([
  ["select", "Select"],
  ["link", "Link"],
]);

describe("usageLink", () => {
  it("links a component by id", () => {
    expect(usageLink("select", titles)).toEqual({ href: "/components/select/", text: "Use Select instead." });
  });

  it("links a pattern by patterns/<id>", () => {
    expect(usageLink("patterns/forms", titles)).toEqual({ href: "/patterns/forms/", text: "See the Forms pattern." });
  });

  it("returns null for an id that names nothing", () => {
    expect(usageLink("selekt", titles)).toBeNull();
    expect(usageLink("patterns/wizards", titles)).toBeNull();
  });
});

describe("patterns", () => {
  it("lists the five patterns in reading order", () => {
    expect(PATTERNS.map((p) => p.id)).toEqual(["forms", "navigation", "data", "empty-states", "errors-and-feedback"]);
    expect(patternHref("data")).toBe("/patterns/data/");
  });

  it("sorts entries in that order", () => {
    const entries = [{ id: "data" }, { id: "forms" }, { id: "errors-and-feedback" }];
    expect(sortPatterns(entries).map((e) => e.id)).toEqual(["forms", "data", "errors-and-feedback"]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `cd apps/docs && npx vitest run test/guidance.test.ts`
Expected: FAIL, `Cannot find module '../src/lib/guidance'`.

- [ ] **Step 3: Write `guidance.ts`**

`apps/docs/src/lib/guidance.ts`:

```ts
import { componentHref } from "./components";

/** The pattern pages, in reading order. Their MDX files are src/content/patterns/<id>.mdx. */
export const PATTERNS = [
  { id: "forms", title: "Forms" },
  { id: "navigation", title: "Navigation" },
  { id: "data", title: "Data" },
  { id: "empty-states", title: "Empty states" },
  { id: "errors-and-feedback", title: "Errors and feedback" },
] as const;

export const patternHref = (id: string) => `/patterns/${id}/`;

const PATTERN_PREFIX = "patterns/";

/**
 * The link for an `avoid` item's `instead`: a component id ("select") or a pattern ("patterns/forms").
 * Null when it names nothing, so the page build can fail loudly.
 */
export function usageLink(instead: string, componentTitles: ReadonlyMap<string, string>): { href: string; text: string } | null {
  if (instead.startsWith(PATTERN_PREFIX)) {
    const id = instead.slice(PATTERN_PREFIX.length);
    const pattern = PATTERNS.find((p) => p.id === id);
    return pattern ? { href: patternHref(id), text: `See the ${pattern.title} pattern.` } : null;
  }
  const title = componentTitles.get(instead);
  return title ? { href: componentHref(instead), text: `Use ${title} instead.` } : null;
}

/** Pattern entries in PATTERNS order; unknown ids last. */
export function sortPatterns<T extends { id: string }>(entries: readonly T[]): T[] {
  const rank = (id: string) => {
    const i = PATTERNS.findIndex((p) => p.id === id);
    return i === -1 ? PATTERNS.length : i;
  };
  return [...entries].sort((a, b) => rank(a.id) - rank(b.id));
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `cd apps/docs && npx vitest run test/guidance.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add `use` and `avoid` to the schema, optional for now**

In `apps/docs/src/content.config.ts`, add above `const components`:

```ts
const avoidItem = z.object({
  text: z.string(),
  /** A component id ("select") or a pattern ("patterns/forms") to use instead. */
  instead: z.string().optional(),
});
```

and add to the components schema object, after `summary`:

```ts
    /** What the component is for. Required from Task 7. */
    use: z.array(z.string()).min(1).optional(),
    /** What it is not for, and what to use instead. Required from Task 7. */
    avoid: z.array(avoidItem).min(1).optional(),
```

- [ ] **Step 6: Render the Usage section**

In `apps/docs/src/pages/components/[slug].astro`:

Add the import `import { usageLink } from "../../lib/guidance";` and, after `const { Content } = await render(entry);`, replace the destructuring line with:

```ts
const { title, group, summary, interactive, props, a11y, use = [], avoid = [] } = entry.data;
const componentTitles = new Map((await getCollection("components")).map((c) => [c.id, c.data.title]));
const avoidItems = avoid.map((item) => {
  const link = item.instead === undefined ? null : usageLink(item.instead, componentTitles);
  if (item.instead !== undefined && link === null) {
    throw new Error(`${entry.id}: avoid item "${item.text}" points to "${item.instead}", which is not a component or pattern.`);
  }
  return { text: item.text, link };
});
```

Then, directly before `<h2>Examples</h2>`, insert:

```astro
  {
    (use.length > 0 || avoidItems.length > 0) && (
      <>
        <h2>Usage</h2>
        <div class="docs-usage">
          <section aria-labelledby="usage-use">
            <h3 id="usage-use" class="sw-type-label sw-text-secondary">Use it to</h3>
            <ul>{use.map((item) => <li>{item}</li>)}</ul>
          </section>
          <section aria-labelledby="usage-avoid">
            <h3 id="usage-avoid" class="sw-type-label sw-text-secondary">Avoid it for</h3>
            <ul>
              {
                avoidItems.map((item) => (
                  <li>
                    {item.text}
                    {item.link && (
                      <>
                        {" "}
                        <a class="sw-link" href={item.link.href}>
                          {item.link.text}
                        </a>
                      </>
                    )}
                  </li>
                ))
              }
            </ul>
          </section>
        </div>
      </>
    )
  }
```

- [ ] **Step 7: Style it**

Append to `apps/docs/src/styles/docs.css`:

```css
/* Usage: two columns, "Use it to" and "Avoid it for", each hung from a hairline. */
.docs-usage {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-6);
  max-inline-size: var(--measure, 72ch);
}

.docs-usage section {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding-block-start: var(--space-3);
  border-block-start: 1px solid var(--border-strong);
}

.docs-usage h3 {
  margin: 0;
}

.docs-usage ul {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding-inline-start: 1.25em;
}
```

If `--measure` is not a token in this repo, check `packages/css/src` for the reading-measure custom property (`grep -rn "measure" packages/css/src/base packages/css/src/utilities 2>/dev/null | head`) and use that; if none exists, use `max-inline-size: 72ch`.

- [ ] **Step 8: Write usage for the three Actions pages**

Add to each file's frontmatter, after `summary:`:

`apps/docs/src/content/components/button.mdx`
```yaml
use:
  - Trigger an action on the current page, such as saving or sending.
  - Submit a form, with one primary button per view.
avoid:
  - text: Going to another page.
    instead: link
  - text: An action shown only as an icon.
    instead: icon-button
  - text: Choosing between options.
    instead: segmented-control
```

`apps/docs/src/content/components/icon-button.mdx`
```yaml
use:
  - Repeat a familiar action in a tight space, such as a toolbar or a table row.
avoid:
  - text: An action people may not recognise from its icon alone.
    instead: button
  - text: Going to another page.
    instead: link
```

`apps/docs/src/content/components/link.mdx`
```yaml
use:
  - Go to another page, or to another place on this one.
  - Point to a source or an outside site in running text.
avoid:
  - text: An action that changes data.
    instead: button
  - text: The steps between the pages of a list.
    instead: pagination
```

- [ ] **Step 9: Build and look**

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build`
Expected: the build succeeds.

Then start a preview (`cd apps/docs && pnpm exec astro preview --port 4390`), open `http://localhost:4390/components/button/` at 1440px and 360px, and check by screenshot:
- "Usage" sits between the lead and "Examples";
- two columns at 1440px, stacked at 360px;
- the three links read "Use Link instead.", "Use IconButton instead." and "Use SegmentedControl instead.", and go to those pages.

Stop the preview server afterwards.

- [ ] **Step 10: Commit**

```bash
git add apps/docs/src/lib/guidance.ts apps/docs/test/guidance.test.ts apps/docs/src/content.config.ts "apps/docs/src/pages/components/[slug].astro" apps/docs/src/styles/docs.css apps/docs/src/content/components/button.mdx apps/docs/src/content/components/icon-button.mdx apps/docs/src/content/components/link.mdx
git commit -m "docs: Usage section on component pages, with links to what to use instead

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Usage for Layout, Type, and Overlay and navigation (22 pages)

**Files:** Modify the 22 MDX files named below.

Add each block to the file's frontmatter, directly after `summary:`. Use the text exactly; ids in `instead` are component ids or `patterns/<id>`. Pattern pages arrive in Tasks 5–6; the build already accepts them, because `usageLink` knows the five pattern ids.

- [ ] **Step 1: Layout**

`container.mdx`
```yaml
use:
  - Hold page content at the maximum width, with fluid margins.
  - Give a grid the size container it measures.
avoid:
  - text: Space between page regions.
    instead: section
  - text: A grouped, bordered surface.
    instead: card
```

`grid.mdx`
```yaml
use:
  - Lay out page regions on four, eight or twelve columns.
  - Align content in different sections to the same columns.
avoid:
  - text: One row or column of evenly spaced items.
    instead: stack
  - text: Tabular data.
    instead: table
```

`col.mdx`
```yaml
use:
  - Place an item in a grid, with a span and a start for each column count.
avoid:
  - text: Content outside a grid.
    instead: stack
```

`section.mdx`
```yaml
use:
  - Separate the large regions of a page with the vertical rhythm.
avoid:
  - text: A visible break inside a region.
    instead: rule
  - text: Space within a group of items.
    instead: stack
```

`stack.mdx`
```yaml
use:
  - Space items evenly in a row or a column.
avoid:
  - text: Layouts that align to columns in two directions.
    instead: grid
```

`rule.mdx`
```yaml
use:
  - Mark a thematic break between blocks of content.
avoid:
  - text: Space between page regions.
    instead: section
  - text: Grouping content on a surface.
    instead: card
```

- [ ] **Step 2: Type**

`eyebrow.mdx`
```yaml
use:
  - Label a section or heading with its number or category.
avoid:
  - text: The status or category of an item.
    instead: tag
  - text: The heading itself.
    instead: heading
```

`figure.mdx`
```yaml
use:
  - Caption an image, chart or table that the text refers to.
avoid:
  - text: Images that only decorate.
    instead: media
```

`heading.mdx`
```yaml
use:
  - Title a page or a section, with the outline level set apart from the size.
avoid:
  - text: Emphasis inside a paragraph.
    instead: text
  - text: A small label above a heading.
    instead: eyebrow
```

`text.mdx`
```yaml
use:
  - Set body copy and captions in the right tone and at the reading measure.
avoid:
  - text: Section titles.
    instead: heading
  - text: A message that needs attention.
    instead: callout
```

- [ ] **Step 3: Overlay and navigation**

`breadcrumbs.mdx`
```yaml
use:
  - Show where a page sits in a hierarchy two or more levels deep.
avoid:
  - text: The steps of a process.
    instead: patterns/navigation
  - text: The main sections of a site.
    instead: header
```

`dialog.mdx`
```yaml
use:
  - Ask for a decision or a short task that must be finished before going on.
  - Confirm an action that cannot be undone.
avoid:
  - text: Details or filters beside the current page.
    instead: drawer
  - text: A few controls anchored to a button.
    instead: popover
  - text: The result of an action.
    instead: toast
```

`disclosure.mdx`
```yaml
use:
  - Hide detail that most people do not need, such as the answers in a list of questions.
avoid:
  - text: Switching between views of the same content.
    instead: tabs
  - text: Content everyone needs to read.
    instead: text
```

`drawer.mdx`
```yaml
use:
  - Show details, filters or a form beside the page people are working on.
avoid:
  - text: A decision that must be made before going on.
    instead: dialog
  - text: Section navigation on wide screens.
    instead: side-nav
```

`header.mdx`
```yaml
use:
  - Hold the brand, the primary navigation and site-wide actions at the top of every page.
avoid:
  - text: Navigation within a section.
    instead: side-nav
```

`menu.mdx`
```yaml
use:
  - Offer a list of actions from one button, such as the actions on a table row.
avoid:
  - text: Choosing a value in a form.
    instead: select
  - text: Navigation between pages.
    instead: side-nav
```

`pagination.mdx`
```yaml
use:
  - Move between the pages of a long list or of search results.
avoid:
  - text: The steps of a process.
    instead: patterns/navigation
  - text: Switching between panels on one page.
    instead: tabs
```

`popover.mdx`
```yaml
use:
  - Show extra detail, or a few controls, anchored to the button that opens them.
avoid:
  - text: A short name for a control.
    instead: tooltip
  - text: A task that needs focus held until it is done.
    instead: dialog
  - text: A list of actions.
    instead: menu
```

`side-nav.mdx`
```yaml
use:
  - Move around within a section of documentation or an app.
avoid:
  - text: The main sections of a site.
    instead: header
  - text: Views of the same content.
    instead: tabs
```

`tabs.mdx`
```yaml
use:
  - Switch between panels of related content in place.
avoid:
  - text: Going to other pages.
    instead: side-nav
  - text: Choosing a value, such as a view or a time range.
    instead: segmented-control
```

`toast.mdx`
```yaml
use:
  - Confirm the result of an action, such as "Saved" or "Sent".
  - Report a failure that belongs to no single field.
avoid:
  - text: Errors in a form's fields.
    instead: field
  - text: A message people must act on before going on.
    instead: dialog
  - text: A message about the whole page.
    instead: banner
```

`tooltip.mdx`
```yaml
use:
  - Name a control that shows only an icon, on hover and on focus.
avoid:
  - text: Information people need to finish a task.
    instead: text
  - text: Content people interact with.
    instead: popover
```

- [ ] **Step 4: Build**

Run: `pnpm --filter @raster/docs build`
Expected: success. A wrong `instead` id fails the build with the page and item named; fix the id, not the check.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/content/components
git commit -m "docs: usage for layout, type, overlay and navigation components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Usage for Forms (17 pages)

**Files:** Modify the 17 MDX files named below. Same placement and rules as Task 2.

- [ ] **Step 1: Add the blocks**

`calendar.mdx`
```yaml
use:
  - Choose a day or a range when seeing the whole month helps, such as when booking.
avoid:
  - text: Dates people know by heart, such as a date of birth.
    instead: date-picker
```

`checkbox.mdx`
```yaml
use:
  - Turn one option on or off in a form that is saved.
  - Choose any number of options from a list.
avoid:
  - text: A setting that takes effect at once.
    instead: switch
  - text: One choice from a short list.
    instead: radio-group
```

`combobox.mdx`
```yaml
use:
  - Choose one option from a long list by typing to filter it.
avoid:
  - text: A list of seven or fewer options.
    instead: select
  - text: Searching content.
    instead: search-field
```

`date-picker.mdx`
```yaml
use:
  - Enter one date, typed or chosen from a calendar.
avoid:
  - text: A start and an end date.
    instead: date-range-picker
```

`date-range-picker.mdx`
```yaml
use:
  - Enter a start and an end date in one field.
avoid:
  - text: One date.
    instead: date-picker
```

`field.mdx`
```yaml
use:
  - Label, describe and report errors for a control Raster does not provide.
avoid:
  - text: A text input.
    instead: text-field
  - text: Laying out a whole form.
    instead: patterns/forms
```

`file-upload.mdx`
```yaml
use:
  - Attach one or more files to a form.
avoid:
  - text: A short piece of text people could paste.
    instead: text-area
```

`number-field.mdx`
```yaml
use:
  - Enter a quantity or another small whole number.
avoid:
  - text: Numbers that are identifiers, such as a postcode.
    instead: text-field
  - text: A value whose place in a range matters more than the number.
    instead: slider
```

`radio-group.mdx`
```yaml
use:
  - Choose one of two to seven options that should all be visible.
avoid:
  - text: Many options.
    instead: select
  - text: Several choices at once.
    instead: checkbox
```

`search-field.mdx`
```yaml
use:
  - Search content, or filter a list as people type.
avoid:
  - text: Choosing one value from a known list.
    instead: combobox
```

`segmented-control.mdx`
```yaml
use:
  - Switch a view or a range between two to five options, applied at once.
avoid:
  - text: A choice saved with a form.
    instead: radio-group
  - text: Switching between panels of content.
    instead: tabs
```

`select.mdx`
```yaml
use:
  - Choose one option from a list in a form.
avoid:
  - text: Five or fewer options that should all be visible.
    instead: radio-group
  - text: A long list people would rather type to find.
    instead: combobox
  - text: A list of actions.
    instead: menu
```

`slider.mdx`
```yaml
use:
  - Set a value or a range where its place in the range matters, such as a price band.
avoid:
  - text: An exact number.
    instead: number-field
```

`switch.mdx`
```yaml
use:
  - Turn a setting on or off at once, with no save step.
avoid:
  - text: An option saved with a form.
    instead: checkbox
```

`tag-group.mdx`
```yaml
use:
  - Filter a list by several values at once.
  - Choose one of a few short options, shown as chips.
avoid:
  - text: A status label people cannot select.
    instead: tag
  - text: Switching a view.
    instead: segmented-control
```

`text-area.mdx`
```yaml
use:
  - Enter several lines of text, such as a message or a brief.
avoid:
  - text: One line of text.
    instead: text-field
```

`text-field.mdx`
```yaml
use:
  - Enter one line of text, such as a name or an email address.
avoid:
  - text: Several lines of text.
    instead: text-area
  - text: Searching.
    instead: search-field
  - text: Numbers people step up and down.
    instead: number-field
```

- [ ] **Step 2: Build**

Run: `pnpm --filter @raster/docs build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/content/components
git commit -m "docs: usage for form components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Usage for Display (18 pages)

**Files:** Modify the 18 MDX files named below. Same placement and rules as Task 2.

- [ ] **Step 1: Add the blocks**

`avatar.mdx`
```yaml
use:
  - Show a person beside their name or in a list of people.
avoid:
  - text: Images of things or places.
    instead: media
```

`badge.mdx`
```yaml
use:
  - Count unread or pending items, beside what they count.
avoid:
  - text: A status or a category.
    instead: tag
```

`banner.mdx`
```yaml
use:
  - Tell people about something that affects the whole page or service, such as maintenance.
  - Sum up the errors in a form, above it.
avoid:
  - text: A note within the content.
    instead: callout
  - text: The result of a single action.
    instead: toast
```

`bar-chart.mdx`
```yaml
use:
  - Compare amounts across categories.
avoid:
  - text: Change over ordered time.
    instead: line-chart
  - text: A single figure.
    instead: stat
  - text: Exact values people look up.
    instead: table
```

`callout.mdx`
```yaml
use:
  - Draw attention to a note, a tip or a warning within the content.
avoid:
  - text: A message about the whole page.
    instead: banner
  - text: The result of an action.
    instead: toast
```

`card.mdx`
```yaml
use:
  - Group related content on a surface, such as one item in a collection.
avoid:
  - text: Page layout alone.
    instead: grid
  - text: A message.
    instead: callout
```

`data-grid.mdx`
```yaml
use:
  - Let people sort, select and work with rows of data.
avoid:
  - text: Data people only read.
    instead: table
  - text: Choosing between a table, a grid and a chart.
    instead: patterns/data
```

`description-list.mdx`
```yaml
use:
  - Show facts as terms and values, such as the details of one project.
avoid:
  - text: Several records with the same fields.
    instead: table
```

`empty-state.mdx`
```yaml
use:
  - Say why an area is empty and what to do next.
avoid:
  - text: Content that is still loading.
    instead: skeleton
  - text: A failure to load.
    instead: patterns/errors-and-feedback
```

`line-chart.mdx`
```yaml
use:
  - Show how values change over ordered categories, such as months.
avoid:
  - text: Categories with no order.
    instead: bar-chart
  - text: A trend beside a figure or in a table.
    instead: sparkline
```

`media.mdx`
```yaml
use:
  - Hold an image or a video at a fixed ratio, so the page does not shift as it loads.
avoid:
  - text: An image the text refers to by its caption.
    instead: figure
  - text: A person.
    instead: avatar
```

`meter.mdx`
```yaml
use:
  - Show a measurement within a known range, such as storage used.
avoid:
  - text: The progress of a task.
    instead: progress-bar
```

`progress-bar.mdx`
```yaml
use:
  - Show how far a task of known length has got.
avoid:
  - text: Content loading in place.
    instead: skeleton
  - text: A measurement that is not progress.
    instead: meter
```

`skeleton.mdx`
```yaml
use:
  - Hold the shape of content while it loads.
avoid:
  - text: A task of known length.
    instead: progress-bar
  - text: An area with nothing to show.
    instead: empty-state
```

`sparkline.mdx`
```yaml
use:
  - Show a trend in a line of text, beside a figure or in a table cell.
avoid:
  - text: A trend people need to read values from.
    instead: line-chart
```

`stat.mdx`
```yaml
use:
  - Lead with one key figure and how it changed.
avoid:
  - text: Several figures compared with each other.
    instead: bar-chart
  - text: Facts that are not figures.
    instead: description-list
```

`table.mdx`
```yaml
use:
  - Show records with the same fields, for people to read and compare.
avoid:
  - text: Data people sort and select.
    instead: data-grid
  - text: Layout.
    instead: grid
```

`tag.mdx`
```yaml
use:
  - Label an item with its status or category.
avoid:
  - text: A label people select to filter.
    instead: tag-group
  - text: A count.
    instead: badge
```

- [ ] **Step 2: Build**

Run: `pnpm --filter @raster/docs build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/content/components
git commit -m "docs: usage for display components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Patterns section, with Forms and Navigation

**Files:**
- Create: `apps/docs/src/pages/patterns/index.astro`, `apps/docs/src/pages/patterns/[slug].astro`, `apps/docs/src/content/patterns/forms.mdx`, `apps/docs/src/content/patterns/navigation.mdx`, `apps/docs/src/demos/patterns/EnquiryForm.tsx`, `apps/docs/src/demos/patterns/ErrorSummary.tsx`, `apps/docs/src/demos/patterns/SectionPage.tsx`, `apps/docs/test/patterns.test.ts`
- Modify: `apps/docs/src/content.config.ts`, `apps/docs/src/lib/nav.ts`, `apps/docs/test/nav.test.ts`, `apps/docs/e2e/site.spec.ts`, `apps/docs/src/styles/docs.css`

- [ ] **Step 1: Write the failing tests**

Add to `apps/docs/test/nav.test.ts`, inside `describe("ariaCurrent", …)`:

```ts
  it("has a Patterns section between Components and Templates", () => {
    expect(NAV.map((i) => i.label)).toEqual(["Principles", "Foundations", "Components", "Patterns", "Templates", "Themes"]);
    expect(ariaCurrent("/patterns/", item("Patterns"))).toBe("page");
    expect(ariaCurrent("/patterns/forms/", item("Patterns"))).toBe("true");
  });
```

Create `apps/docs/test/patterns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validate } from "../src/demos/patterns/EnquiryForm";

describe("the enquiry form's checks", () => {
  it("asks for a name and a complete email address", () => {
    expect(validate({ name: " ", email: "studio@" })).toEqual({
      name: "Enter your name.",
      email: "Enter an email address such as name@studio.ch.",
    });
  });

  it("passes a complete enquiry", () => {
    expect(validate({ name: "Anna Keller", email: "anna@studio.ch" })).toEqual({});
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/docs && npx vitest run test/nav.test.ts test/patterns.test.ts`
Expected: FAIL. The nav labels lack "Patterns", and `EnquiryForm` does not exist.

- [ ] **Step 3: Add Patterns to the navigation**

In `apps/docs/src/lib/nav.ts`, insert into `NAV` after the Components item:

```ts
  { href: "/patterns/", label: "Patterns", section: "/patterns/" },
```

In `apps/docs/e2e/site.spec.ts`, change the expected menu links to:

```ts
  await expect(links).toHaveText(["Principles", "Foundations", "Components", "Patterns", "Templates", "Themes"]);
```

- [ ] **Step 4: Write the enquiry form demo**

`apps/docs/src/demos/patterns/EnquiryForm.tsx`:

```tsx
import { Banner, Button, Radio, RadioGroup, Select, SelectItem, Stack, TextArea, TextField } from "@raster/react";
import { type FormEvent, useRef, useState } from "react";

type Errors = Partial<Record<"name" | "email", string>>;

/** The form's checks, run on submit: what is wrong, said as what to do. */
export function validate(values: { name: string; email: string }): Errors {
  const errors: Errors = {};
  if (values.name.trim() === "") errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter an email address such as name@studio.ch.";
  }
  return errors;
}

const FIELD_IDS = { name: "enquiry-name", email: "enquiry-email" } as const;

export default function EnquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const status = useRef<HTMLDivElement>(null);
  const failed = Object.entries(errors) as [keyof Errors, string][];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate({ name, email });
    setErrors(next);
    setSent(Object.keys(next).length === 0);
    // After React draws the summary or the confirmation, move focus to it so it is read out.
    requestAnimationFrame(() => status.current?.focus());
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <Stack gap={5}>
        <div ref={status} tabIndex={-1} className="docs-form-status">
          {failed.length > 0 && (
            <Banner
              tone="danger"
              title={failed.length === 1 ? "Fix 1 field to send the enquiry" : `Fix ${failed.length} fields to send the enquiry`}
            >
              <ul>
                {failed.map(([field, message]) => (
                  <li key={field}>
                    <a className="sw-link" href={`#${FIELD_IDS[field]}`}>
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </Banner>
          )}
          {sent && (
            <Banner tone="success" title="Enquiry sent">
              <p>We reply within two working days.</p>
            </Banner>
          )}
        </div>
        <TextField
          id={FIELD_IDS.name}
          label="Name"
          description="Required."
          isRequired
          validationBehavior="aria"
          value={name}
          onChange={setName}
          isInvalid={errors.name !== undefined}
          errorMessage={errors.name}
        />
        <TextField
          id={FIELD_IDS.email}
          label="Email"
          type="email"
          description="Required. We reply to this address."
          isRequired
          validationBehavior="aria"
          value={email}
          onChange={setEmail}
          isInvalid={errors.email !== undefined}
          errorMessage={errors.email}
        />
        <Select label="Discipline" defaultValue="wayfinding">
          <SelectItem id="wayfinding">Wayfinding</SelectItem>
          <SelectItem id="identity">Identity</SelectItem>
          <SelectItem id="exhibition">Exhibition</SelectItem>
        </Select>
        <RadioGroup label="Budget" defaultValue="middle">
          <Radio value="small">Under CHF 20,000</Radio>
          <Radio value="middle">CHF 20,000 to 80,000</Radio>
          <Radio value="large">Over CHF 80,000</Radio>
        </RadioGroup>
        <TextArea label="Brief" description="Optional. Two or three sentences." rows={4} />
        <div>
          <Button type="submit" variant="primary">
            Send enquiry
          </Button>
        </div>
      </Stack>
    </form>
  );
}
```

Check two assumptions while writing it. If either fails, adjust the demo, not the test:
- **The error links reach their inputs.** React Aria's `TextField` passes `id` to its `<input>`. Check by inspecting the rendered input, and the e2e test in Task 9 also checks it.
- **`TextField` accepts `validationBehavior`.** Check `packages/react/src/forms/TextField.tsx`.

Add to `apps/docs/src/styles/docs.css`:

```css
/* The enquiry form's status region takes focus by script; it needs no ring of its own. */
.docs-form-status:focus {
  outline: none;
}

.docs-form-status:empty {
  display: none;
}
```

- [ ] **Step 5: Write the static error-summary demo**

`apps/docs/src/demos/patterns/ErrorSummary.tsx`:

```tsx
import { Banner } from "@raster/react";

export default function ErrorSummary() {
  return (
    <Banner tone="danger" title="Fix 2 fields to send the enquiry">
      <ul>
        <li>
          <a className="sw-link" href="#enquiry-name">
            Enter your name.
          </a>
        </li>
        <li>
          <a className="sw-link" href="#enquiry-email">
            Enter an email address such as name@studio.ch.
          </a>
        </li>
      </ul>
    </Banner>
  );
}
```

- [ ] **Step 6: Write the navigation demo**

`apps/docs/src/demos/patterns/SectionPage.tsx`:

```tsx
import { Breadcrumb, Breadcrumbs, Heading, Pagination, SideNav, SideNavGroup, SideNavLink, Stack, Text } from "@raster/react";

export default function SectionPage() {
  return (
    <Stack gap={5}>
      <Breadcrumbs aria-label="Example breadcrumbs">
        <Breadcrumb href="#studio">Studio</Breadcrumb>
        <Breadcrumb href="#projects">Projects</Breadcrumb>
        <Breadcrumb>Wayfinding</Breadcrumb>
      </Breadcrumbs>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))",
          gap: "var(--space-6)",
        }}
      >
        <SideNav aria-label="Projects">
          <SideNavLink href="#all">All projects</SideNavLink>
          <SideNavGroup title="Disciplines">
            <SideNavLink href="#wayfinding" current>
              Wayfinding
            </SideNavLink>
            <SideNavLink href="#identity">Identity</SideNavLink>
            <SideNavLink href="#exhibition">Exhibition</SideNavLink>
          </SideNavGroup>
        </SideNav>
        <Stack gap={4}>
          <Heading level={3}>Wayfinding</Heading>
          <Text>Signs, maps and directories for stations, museums and hospitals.</Text>
          <Pagination aria-label="Wayfinding projects" page={2} total={4} href={(page) => `#page-${page}`} />
        </Stack>
      </div>
    </Stack>
  );
}
```

- [ ] **Step 7: Add the `patterns` collection**

In `apps/docs/src/content.config.ts`:

```ts
const patterns = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/patterns" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Numbered rules, shown before the examples. */
    rules: z.array(z.string()).min(1),
    /** Component ids the pattern uses, linked at the foot of the page. */
    components: z.array(z.string()).min(1),
  }),
});

export const collections = { components, patterns };
```

(Replace the existing `export const collections = { components };`.)

- [ ] **Step 8: Write the pattern page and the index**

`apps/docs/src/pages/patterns/[slug].astro`:

```astro
---
import { getCollection, render } from "astro:content";
import DocPage from "../../layouts/DocPage.astro";
import { componentHref } from "../../lib/components";
import { sortPatterns } from "../../lib/guidance";

export async function getStaticPaths() {
  const entries = sortPatterns(await getCollection("patterns"));
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { title, summary, rules, components } = entry.data;
const titles = new Map((await getCollection("components")).map((c) => [c.id, c.data.title]));
const used = components.map((id) => {
  const name = titles.get(id);
  if (name === undefined) throw new Error(`Pattern ${entry.id} lists "${id}", which is not a component.`);
  return { href: componentHref(id), name };
});
---
<DocPage title={title} description={summary} eyebrow="Patterns">
  <nav slot="before-title" aria-label="Breadcrumbs">
    <ol class="sw-breadcrumbs">
      <li class="sw-breadcrumb">
        <a class="sw-link" href="/patterns/">Patterns</a>
        <span class="sw-breadcrumb-separator" aria-hidden="true">/</span>
      </li>
      <li class="sw-breadcrumb"><span class="sw-link" aria-current="page">{title}</span></li>
    </ol>
  </nav>

  <h2>Rules</h2>
  <ol class="docs-rules sw-measure">{rules.map((rule) => <li>{rule}</li>)}</ol>

  <Content />

  <h2>Components</h2>
  <ul class="docs-component-list">
    {
      used.map((c) => (
        <li>
          <a class="sw-link" href={c.href}>
            {c.name}
          </a>
        </li>
      ))
    }
  </ul>
</DocPage>
```

`apps/docs/src/pages/patterns/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import DocPage from "../../layouts/DocPage.astro";
import { patternHref, sortPatterns } from "../../lib/guidance";

const entries = sortPatterns(await getCollection("patterns"));
---
<DocPage
  title="Patterns"
  eyebrow="Patterns"
  description="How the components work together on common tasks: forms, navigation, data, empty areas and errors. Each pattern gives its rules, then shows them working."
>
  <ul class="docs-component-list">
    {
      entries.map((entry) => (
        <li>
          <a class="sw-link" href={patternHref(entry.id)}>
            {entry.data.title}
          </a>
          <span class="sw-type-caption sw-text-secondary">{entry.data.summary}</span>
        </li>
      ))
    }
  </ul>
</DocPage>
```

Append to `apps/docs/src/styles/docs.css`:

```css
/* A pattern's rules: numbered in mono, hung from the reading measure. */
.docs-rules {
  display: grid;
  gap: var(--space-3);
  padding-inline-start: 2em;
}

.docs-rules li::marker {
  font-family: var(--font-mono);
  color: var(--text-secondary);
}
```

- [ ] **Step 9: Write the two pattern pages**

`apps/docs/src/content/patterns/forms.mdx`:

```mdx
---
title: Forms
summary: One column of labelled fields, checked when sent, with every error said once beside its field and once in a summary above.
rules:
  - Lay fields out in one column, in the order people think of the answers.
  - Give every field a visible label. Placeholders are examples, never labels.
  - Say which fields are required in their description, and mark the rest optional.
  - Check the form when it is sent, not while people type.
  - Show each error under its field, saying what to do, such as "Enter your name."
  - Above the form, sum up the errors in a Banner, with each error a link to its field, and move focus to the summary.
  - Use one primary button, named for the outcome, such as "Send enquiry".
components:
  - text-field
  - text-area
  - select
  - radio-group
  - field
  - banner
  - button
---
import Example from "../../components/Example.astro";
import EnquiryForm from "../../demos/patterns/EnquiryForm";
import enquiryFormSource from "../../demos/patterns/EnquiryForm.tsx?raw";
import ErrorSummary from "../../demos/patterns/ErrorSummary";
import errorSummarySource from "../../demos/patterns/ErrorSummary.tsx?raw";

## Examples

Send the form empty to see the errors, then fill it in to send it.

<Example title="Project enquiry" source={enquiryFormSource}>
  <EnquiryForm client:load />
</Example>

<Example title="Error summary" source={errorSummarySource} of={ErrorSummary}>
  <ErrorSummary />
</Example>
```

`apps/docs/src/content/patterns/navigation.mdx`:

```mdx
---
title: Navigation
summary: The header for the site's sections, SideNav within a section, Breadcrumbs for the path, Tabs for views in place and Pagination for long lists.
rules:
  - Put the site's main sections in the header, five to seven at most.
  - Use SideNav within a section that has more pages than fit in the header.
  - Add Breadcrumbs when pages sit two or more levels deep.
  - Use Tabs only to switch views of the same content in place; links that load pages belong in SideNav.
  - Use Pagination for long lists, and keep the page in the address so it can be shared.
  - Mark the current page with aria-current, in every navigation that lists it.
  - For the steps of a process, number the steps in the page heading, such as "Step 2 of 4", and use Back and Continue buttons.
components:
  - header
  - side-nav
  - breadcrumbs
  - tabs
  - pagination
---
import Example from "../../components/Example.astro";
import SectionPage from "../../demos/patterns/SectionPage";
import sectionPageSource from "../../demos/patterns/SectionPage.tsx?raw";

## Examples

<Example title="A page within a section" source={sectionPageSource}>
  <SectionPage client:load />
</Example>
```

- [ ] **Step 10: Run the tests, build, and look**

Run: `cd apps/docs && npx vitest run test/nav.test.ts test/patterns.test.ts test/guidance.test.ts`
Expected: PASS.

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build`
Expected: success, with `dist/patterns/index.html`, `dist/patterns/forms/index.html` and `dist/patterns/navigation/index.html`.

Then preview on port 4390 and check by screenshot at 1440px and 360px:
- **Navigation:** the header shows "Patterns" between Components and Templates.
- **Forms page, empty send:** pressing "Send enquiry" with nothing filled in shows the danger Banner with two links, focus moves to it, and both fields show their errors.
- **Forms page, error links:** each link moves focus to its input.
- **Forms page, complete send:** filling in both fields and sending shows "Enquiry sent".
- **Navigation page:** the SideNav sits beside the content at 1440px and above it at 360px.

Stop the preview server.

- [ ] **Step 11: Commit**

```bash
git add apps/docs/src apps/docs/test apps/docs/e2e/site.spec.ts
git commit -m "docs: Patterns section, with Forms and Navigation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Data, Empty states, and Errors and feedback patterns

**Files:**
- Create: `apps/docs/src/content/patterns/{data,empty-states,errors-and-feedback}.mdx`, `apps/docs/src/demos/patterns/{Overview,FirstUse,NoMatches,FieldAndPageErrors,Confirmation}.tsx`
- Modify: `apps/docs/test/patterns.test.ts`

- [ ] **Step 1: Write the failing test for the search filter**

Append to `apps/docs/test/patterns.test.ts`:

```ts
import { matching, PROJECTS } from "../src/demos/patterns/NoMatches";

describe("the project search", () => {
  it("matches names case-insensitively, ignoring spaces at the ends", () => {
    expect(matching(" museum ")).toEqual(["Museum wayfinding"]);
  });

  it("lists everything for an empty query, and nothing for a query that matches nothing", () => {
    expect(matching("")).toEqual(PROJECTS);
    expect(matching("zeppelin")).toEqual([]);
  });
});
```

(Move this `import` to the top of the file, with the other imports.)

- [ ] **Step 2: Run it to see it fail**

Run: `cd apps/docs && npx vitest run test/patterns.test.ts`
Expected: FAIL, `Cannot find module '../src/demos/patterns/NoMatches'`.

- [ ] **Step 3: Write the demos**

`apps/docs/src/demos/patterns/NoMatches.tsx`:

```tsx
import { Button, EmptyState, SearchField, Stack } from "@raster/react";
import { useState } from "react";

export const PROJECTS = ["Museum wayfinding", "Annual report", "Type specimen", "Station signage", "Exhibition graphics"];

/** Project names containing the query, ignoring case and spaces at the ends. */
export function matching(query: string): string[] {
  const q = query.trim().toLowerCase();
  return PROJECTS.filter((name) => name.toLowerCase().includes(q));
}

export default function NoMatches() {
  const [query, setQuery] = useState("Zeppelin");
  const results = matching(query);
  return (
    <Stack gap={5}>
      <SearchField label="Search projects" value={query} onChange={setQuery} />
      {results.length > 0 ? (
        <ul>
          {results.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <EmptyState
          label="Projects"
          title={`No projects match "${query.trim()}"`}
          headingLevel={3}
          action={<Button onPress={() => setQuery("")}>Clear search</Button>}
        >
          Check the spelling, or search for part of a name.
        </EmptyState>
      )}
    </Stack>
  );
}
```

`apps/docs/src/demos/patterns/FirstUse.tsx`:

```tsx
import { Button, EmptyState } from "@raster/react";

export default function FirstUse() {
  return (
    <EmptyState
      label="Projects"
      title="No projects yet"
      headingLevel={3}
      action={<Button variant="primary">Create a project</Button>}
    >
      Projects you create or join appear here.
    </EmptyState>
  );
}
```

`apps/docs/src/demos/patterns/Overview.tsx`:

```tsx
import { Sparkline, Stack, Stat, Table } from "@raster/react";

const FIGURES = [
  { value: "14", label: "Projects running", change: "+3 on last quarter", trend: "up" as const, data: [9, 10, 10, 11, 12, 14] },
  { value: "86%", label: "Delivered on time", change: "−4 points on last quarter", trend: "down" as const, data: [92, 91, 90, 90, 88, 86] },
];

const ROWS = [
  { project: "Museum wayfinding", hours: "412", budget: "68%" },
  { project: "Annual report", hours: "126", budget: "91%" },
  { project: "Type specimen", hours: "58", budget: "24%" },
];

export default function Overview() {
  return (
    <Stack gap={6}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {FIGURES.map((f) => (
          <Stack key={f.label} gap={3}>
            <Stat value={f.value} label={f.label} change={f.change} trend={f.trend} />
            <Sparkline data={f.data} label={`${f.label}, last 6 quarters`} />
          </Stack>
        ))}
      </div>
      <Table caption="Projects this quarter">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col" data-numeric="">
              Hours
            </th>
            <th scope="col" data-numeric="">
              Budget used
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.project}>
              <td>{r.project}</td>
              <td data-numeric="">{r.hours}</td>
              <td data-numeric="">{r.budget}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
```

`apps/docs/src/demos/patterns/FieldAndPageErrors.tsx`:

```tsx
import { Banner, Stack, TextField } from "@raster/react";

export default function FieldAndPageErrors() {
  return (
    <Stack gap={5}>
      <Banner tone="danger" title="Publishing failed">
        <p>Two pages could not be published. Check the build log and try again.</p>
      </Banner>
      <TextField
        label="Studio email"
        description="Used for invoices only."
        errorMessage="Enter a complete email address, such as name@studio.ch."
        defaultValue="studio@"
        isInvalid
      />
    </Stack>
  );
}
```

`apps/docs/src/demos/patterns/Confirmation.tsx`:

```tsx
import { Button, createToastQueue, ToastRegion } from "@raster/react";

// One queue for this demo; an app creates one near its root.
const queue = createToastQueue();

export default function Confirmation() {
  return (
    <>
      <Button
        onPress={() =>
          queue.add({ title: "Project archived", description: "Find it under Archive.", tone: "success" }, { timeout: 5000 })
        }
      >
        Archive project
      </Button>
      <ToastRegion queue={queue} />
    </>
  );
}
```

- [ ] **Step 4: Write the three pattern pages**

`apps/docs/src/content/patterns/data.mdx`:

```mdx
---
title: Data
summary: A figure for the headline, a chart for the shape, a table for the values, and a grid only when people work with the rows.
rules:
  - Lead with the one or two figures that matter, in Stat, each with how it changed.
  - Add a Sparkline beside a figure when its trend matters more than its values.
  - Use a chart for the shape of the data, a BarChart for amounts and a LineChart for change over time; keep the values one click away.
  - Use a Table for values people read and compare; align numbers at the end in tabular figures.
  - Use a DataGrid only when people sort, select or act on rows.
  - Caption every table and chart with what it shows and its units, such as "Hours, this quarter".
components:
  - stat
  - sparkline
  - bar-chart
  - line-chart
  - table
  - data-grid
---
import Example from "../../components/Example.astro";
import Overview from "../../demos/patterns/Overview";
import overviewSource from "../../demos/patterns/Overview.tsx?raw";

## Examples

<Example title="Quarterly overview" source={overviewSource} of={Overview}>
  <Overview />
</Example>
```

`apps/docs/src/content/patterns/empty-states.mdx`:

```mdx
---
title: Empty states
summary: An empty area says why it is empty and offers the one next step, whether nothing exists yet, nothing matches or everything is done.
rules:
  - Say why the area is empty in the title, such as "No projects yet" or "No projects match these filters".
  - Add one sentence on what to do next, and at most one action.
  - On first use, the action creates the first item.
  - When nothing matches, the action clears the search or the filters, and the title repeats what was searched for.
  - When everything is done, say so and offer nothing to do.
  - While content loads, show a Skeleton, not an empty state.
components:
  - empty-state
  - search-field
  - button
  - skeleton
---
import Example from "../../components/Example.astro";
import FirstUse from "../../demos/patterns/FirstUse";
import firstUseSource from "../../demos/patterns/FirstUse.tsx?raw";
import NoMatches from "../../demos/patterns/NoMatches";
import noMatchesSource from "../../demos/patterns/NoMatches.tsx?raw";

## Examples

<Example title="First use" source={firstUseSource} of={FirstUse}>
  <FirstUse />
</Example>

<Example title="No matches" source={noMatchesSource}>
  <NoMatches client:load />
</Example>
```

`apps/docs/src/content/patterns/errors-and-feedback.mdx`:

```mdx
---
title: Errors and feedback
summary: Say each message once, in the place nearest its cause, and say what happened and what to do next.
rules:
  - Put an error beside its cause, under the field it belongs to.
  - Use a Banner for problems with the whole page or service, and to sum up a form's errors.
  - Use a Toast to confirm the result of an action, and never for something people must act on.
  - Use a Dialog only to confirm an action that cannot be undone.
  - Write what happened and what to do next, such as "Two pages could not be published. Check the build log and try again."
  - Do not blame people, and do not write "Error:" or use exclamation marks.
components:
  - field
  - banner
  - toast
  - dialog
  - callout
---
import DataTable from "../../components/DataTable.astro";
import Example from "../../components/Example.astro";
import Confirmation from "../../demos/patterns/Confirmation";
import confirmationSource from "../../demos/patterns/Confirmation.tsx?raw";
import FieldAndPageErrors from "../../demos/patterns/FieldAndPageErrors";
import fieldAndPageErrorsSource from "../../demos/patterns/FieldAndPageErrors.tsx?raw";

## Which to use

<DataTable id="channels-caption" caption="Where a message goes" columns={["Message", "Use", "Lasts"]}>
  <tr><td>A field's value is wrong</td><td>The field's error</td><td>Until it is fixed</td></tr>
  <tr><td>A form has errors</td><td>Banner above the form, linking to each field</td><td>Until the form is sent again</td></tr>
  <tr><td>The page or service has a problem</td><td>Banner</td><td>Until it is resolved or dismissed</td></tr>
  <tr><td>An action worked</td><td>Toast</td><td>Five seconds</td></tr>
  <tr><td>An action cannot be undone</td><td>Dialog, before the action</td><td>Until people choose</td></tr>
  <tr><td>A note or warning within the content</td><td>Callout</td><td>Always shown</td></tr>
</DataTable>

## Examples

<Example title="Field and page errors" source={fieldAndPageErrorsSource} of={FieldAndPageErrors}>
  <FieldAndPageErrors />
</Example>

<Example title="Confirmation" source={confirmationSource}>
  <Confirmation client:load />
</Example>
```

- [ ] **Step 5: Run the tests, build, and look**

Run: `cd apps/docs && npx vitest run test/patterns.test.ts`
Expected: PASS, 4 tests.

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build`
Expected: success, with five pattern pages under `dist/patterns/`.

Preview on port 4390 and check by screenshot at 1440px and 360px:
- **Index:** `/patterns/` lists all five, in order.
- **Data:** the two stats sit side by side at 1440px, and the table's numbers line up at the end.
- **No matches:** the example opens on the empty state, and "Clear search" brings back the list.
- **Archive project:** shows a toast.
- **Errors and feedback:** the channel table scrolls inside its region at 360px.

Stop the preview server.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/src apps/docs/test
git commit -m "docs: Data, Empty states, and Errors and feedback patterns

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Make usage required, and check every link

**Files:**
- Create: `apps/docs/test/frontmatter.ts`
- Modify: `apps/docs/src/content.config.ts`, `apps/docs/test/guidance.test.ts`, `apps/docs/package.json`

- [ ] **Step 1: Add `yaml` for reading frontmatter in tests**

Run: `pnpm --filter @raster/docs add -D yaml`
Then pin the version that was installed: change the `^` range to an exact version in `apps/docs/package.json`, as the repo pins its other dependencies, and run `pnpm install`.

- [ ] **Step 2: Write the frontmatter reader**

`apps/docs/test/frontmatter.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export const CONTENT = fileURLToPath(new URL("../src/content", import.meta.url));

export interface Entry {
  id: string;
  file: string;
  data: Record<string, unknown>;
  body: string;
}

/** Every MDX entry in src/content/<collection>, with its frontmatter parsed and its body. */
export function entries(collection: "components" | "patterns"): Entry[] {
  const dir = join(CONTENT, collection);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .sort()
    .map((name) => {
      const file = join(dir, name);
      const source = readFileSync(file, "utf8");
      const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source);
      if (!match) throw new Error(`${file} has no frontmatter`);
      return { id: basename(name, ".mdx"), file, data: parse(match[1]) as Record<string, unknown>, body: match[2] };
    });
}
```

- [ ] **Step 3: Write the failing tests**

Append to `apps/docs/test/guidance.test.ts`:

```ts
import { entries } from "./frontmatter";

describe("usage on component pages", () => {
  const components = entries("components");
  const patterns = entries("patterns");
  const titles = new Map(components.map((c) => [c.id, String(c.data.title)]));

  it("covers all 60 components", () => {
    expect(components).toHaveLength(60);
  });

  it.each(components.map((c) => [c.id, c] as const))("%s says when to use it and when not to", (_, c) => {
    expect(Array.isArray(c.data.use) && c.data.use.length > 0).toBe(true);
    expect(Array.isArray(c.data.avoid) && c.data.avoid.length > 0).toBe(true);
  });

  it("points every 'instead' at a page that exists", () => {
    const broken = components.flatMap((c) =>
      ((c.data.avoid as { text: string; instead?: string }[] | undefined) ?? [])
        .filter((a) => a.instead !== undefined && usageLink(a.instead, titles) === null)
        .map((a) => `${c.id}: ${a.instead}`),
    );
    expect(broken).toEqual([]);
  });

  it("has a page for every pattern in PATTERNS, and no others", () => {
    expect(patterns.map((p) => p.id).sort()).toEqual(PATTERNS.map((p) => p.id).sort());
  });

  it("names only real components in each pattern", () => {
    const unknown = patterns.flatMap((p) =>
      (p.data.components as string[]).filter((id) => !titles.has(id)).map((id) => `${p.id}: ${id}`),
    );
    expect(unknown).toEqual([]);
  });
});
```

(Move the import to the top of the file.)

- [ ] **Step 4: Run them**

Run: `cd apps/docs && npx vitest run test/guidance.test.ts`
Expected: PASS if Tasks 1–6 are complete. If any component lacks usage, or any link is broken, write or fix that page's frontmatter now.

To prove the tests can fail, temporarily change one `instead` to `selekt`, run the tests again, see "points every 'instead'…" fail, then revert the change.

- [ ] **Step 5: Make the schema require usage**

In `apps/docs/src/content.config.ts`, replace the two optional fields with:

```ts
    /** What the component is for. */
    use: z.array(z.string()).min(1),
    /** What it is not for, and what to use instead. */
    avoid: z.array(avoidItem).min(1),
```

In `apps/docs/src/pages/components/[slug].astro`:
- Drop the `= []` defaults from the destructuring: `const { title, group, summary, interactive, props, a11y, use, avoid } = entry.data;`.
- Remove the `(use.length > 0 || avoidItems.length > 0) &&` condition, so the Usage section always renders.

- [ ] **Step 6: Build**

Run: `pnpm --filter @raster/docs build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/package.json pnpm-lock.yaml apps/docs/test apps/docs/src/content.config.ts "apps/docs/src/pages/components/[slug].astro"
git commit -m "docs: require usage on every component page, and check its links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Content style page and the copy checker

**Files:**
- Create: `apps/docs/src/lib/content-style.ts`, `apps/docs/test/content-style.test.ts`, `apps/docs/test/copy.test.ts`, `apps/docs/src/pages/foundations/content.astro`
- Modify: `apps/docs/src/lib/nav.ts`, `apps/docs/test/nav.test.ts`, and any copy the checker flags

- [ ] **Step 1: Write the failing unit tests for the checker**

`apps/docs/test/content-style.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkButtonLabel, checkCopy, checkSentenceCase } from "../src/lib/content-style";

const rules = (issues: { rule: string }[]) => issues.map((i) => i.rule);
const NAMES = new Set(["DataGrid", "Select"]);

describe("checkCopy", () => {
  it("passes plain copy", () => {
    expect(checkCopy("Two pages could not be published. Check the build log and try again.")).toEqual([]);
  });

  it("flags exclamation marks, click here, an Error prefix and three dots", () => {
    expect(rules(checkCopy("Saved!"))).toEqual(["exclamation"]);
    expect(rules(checkCopy("To read the guide, click here."))).toEqual(["click-here"]);
    expect(rules(checkCopy("Error: the file is too large."))).toEqual(["error-prefix"]);
    expect(rules(checkCopy("Loading..."))).toEqual(["ellipsis"]);
  });

  it("flags American spellings, and names the British one", () => {
    expect(checkCopy("Pick a color and center it.")).toEqual([
      { rule: "spelling", detail: 'color: write "colour"' },
      { rule: "spelling", detail: 'center: write "centre"' },
    ]);
  });

  it("ignores code", () => {
    expect(checkCopy("Set `color` to `currentColor`!")).toEqual([]);
  });
});

describe("checkSentenceCase", () => {
  it("passes sentence case, proper nouns, component names, acronyms and quoted text", () => {
    expect(checkSentenceCase("Use a DataGrid in Zürich for CSV files", NAMES)).toEqual([]);
    expect(checkSentenceCase('Confirm the result, such as "Saved" or "Sent".', NAMES)).toEqual([]);
    expect(checkSentenceCase("Fix the field. Then send it again.", NAMES)).toEqual([]);
  });

  it("flags title case", () => {
    expect(checkSentenceCase("Project Enquiry Form", NAMES)).toEqual([
      { rule: "sentence-case", detail: '"Enquiry" in "Project Enquiry Form"' },
      { rule: "sentence-case", detail: '"Form" in "Project Enquiry Form"' },
    ]);
  });
});

describe("checkButtonLabel", () => {
  it("flags labels that do not name the outcome", () => {
    expect(rules(checkButtonLabel("OK"))).toEqual(["generic-label"]);
    expect(rules(checkButtonLabel("Submit"))).toEqual(["generic-label"]);
    expect(checkButtonLabel("Send enquiry")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd apps/docs && npx vitest run test/content-style.test.ts`
Expected: FAIL, `Cannot find module '../src/lib/content-style'`.

- [ ] **Step 3: Write the checker**

`apps/docs/src/lib/content-style.ts`:

```ts
/**
 * The content style rules a script can check (see /foundations/content/). Pure functions over
 * strings; test/copy.test.ts runs them over the docs' own copy.
 */
export type CopyRule = "exclamation" | "click-here" | "error-prefix" | "ellipsis" | "spelling" | "sentence-case" | "generic-label";

export interface CopyIssue {
  rule: CopyRule;
  detail: string;
}

/** American spellings and the British ones Raster writes. Whole words only. */
export const SPELLINGS: Readonly<Record<string, string>> = {
  color: "colour",
  colors: "colours",
  colored: "coloured",
  center: "centre",
  centers: "centres",
  centered: "centred",
  gray: "grey",
  behavior: "behaviour",
  behaviors: "behaviours",
  favorite: "favourite",
  favorites: "favourites",
  canceled: "cancelled",
  catalog: "catalogue",
  organize: "organise",
  organized: "organised",
};

/**
 * Words that keep their capital mid-sentence: places, people, products, languages, months,
 * days and key names. Add only real proper nouns; fix any other capital in the copy instead.
 */
export const PROPER_NOUNS: ReadonlySet<string> = new Set([
  "Raster", "Swiss", "Zürich", "Basel", "Bern", "Geneva", "Alpine",
  "React", "Aria", "Astro", "Geist", "Chrome", "Safari", "Firefox", "Windows", "VoiceOver",
  "English", "British", "American", "German", "French", "Italian",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "Enter", "Escape", "Tab", "Space", "Home", "End", "Shift", "Page", "Up", "Down", "Left", "Right", "Backspace", "Delete",
]);

/** Button labels that say nothing about what happens. */
const GENERIC_LABELS = new Set(["ok", "okay", "submit", "yes", "no", "go", "click here"]);

const withoutCode = (text: string) => text.replace(/`[^`]*`/g, " ");
const withoutQuotes = (text: string) => text.replace(/"[^"]*"|“[^”]*”|‘[^’]*’/g, " ");

export function checkCopy(text: string): CopyIssue[] {
  const t = withoutCode(text);
  const issues: CopyIssue[] = [];
  if (t.includes("!")) issues.push({ rule: "exclamation", detail: text });
  if (/\bclick here\b/i.test(t)) issues.push({ rule: "click-here", detail: text });
  if (/^\s*error\s*:/i.test(t)) issues.push({ rule: "error-prefix", detail: text });
  if (t.includes("...")) issues.push({ rule: "ellipsis", detail: text });
  for (const word of t.toLowerCase().match(/\p{L}+/gu) ?? []) {
    const british = SPELLINGS[word];
    if (british !== undefined) issues.push({ rule: "spelling", detail: `${word}: write "${british}"` });
  }
  return issues;
}

function keepsCapital(word: string, names: ReadonlySet<string>): boolean {
  return (
    names.has(word) ||
    PROPER_NOUNS.has(word) ||
    /^[\p{Lu}\d]+s?$/u.test(word) || // acronyms: CSV, URLs, A4
    /\p{Ll}\p{Lu}/u.test(word) || // names with an inner capital: DataGrid, VoiceOver
    /\d/.test(word) ||
    word.split("-").every((part) => PROPER_NOUNS.has(part)) // Müller-Brockmann, once both parts are listed
  );
}

/** Capitals only at the start of a sentence, in proper nouns, names, acronyms and quoted text. */
export function checkSentenceCase(text: string, names: ReadonlySet<string>): CopyIssue[] {
  const issues: CopyIssue[] = [];
  let sentenceStart = true;
  for (const raw of withoutQuotes(withoutCode(text)).split(/\s+/)) {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (word !== "") {
      if (!sentenceStart && /^\p{Lu}/u.test(word) && !keepsCapital(word, names)) {
        issues.push({ rule: "sentence-case", detail: `"${word}" in "${text}"` });
      }
      sentenceStart = false;
    }
    if (/[.?:;]$/.test(raw)) sentenceStart = true;
  }
  return issues;
}

export function checkButtonLabel(label: string): CopyIssue[] {
  return GENERIC_LABELS.has(label.trim().toLowerCase()) ? [{ rule: "generic-label", detail: label }] : [];
}
```

- [ ] **Step 4: Run the unit tests to see them pass**

Run: `cd apps/docs && npx vitest run test/content-style.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the copy test over the docs**

`apps/docs/test/copy.test.ts`:

```ts
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkButtonLabel, checkCopy, type CopyIssue, checkSentenceCase } from "../src/lib/content-style";
import { entries } from "./frontmatter";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const components = entries("components");
const patterns = entries("patterns");
/** Component titles keep their capitals: "Use a DataGrid". */
const NAMES = new Set(components.map((c) => String(c.data.title)));

type Found = { where: string; issue: CopyIssue };
const report = (found: Found[]) => found.map((f) => `${f.where} [${f.issue.rule}] ${f.issue.detail}`);

function prose(where: string, text: string, sentence: boolean): Found[] {
  const issues = [...checkCopy(text), ...(sentence ? checkSentenceCase(text, NAMES) : [])];
  return issues.map((issue) => ({ where, issue }));
}

function demoFiles(dir = join(SRC, "demos")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? demoFiles(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
  );
}

/** Example and NativeExample titles in an MDX body. */
const exampleTitles = (body: string) => [...body.matchAll(/<(?:Native)?Example[^>]*\btitle="([^"]+)"/g)].map((m) => m[1]);

describe("the docs' copy follows the content style", () => {
  it("in component and pattern frontmatter", () => {
    const found: Found[] = [];
    for (const c of components) {
      found.push(...prose(`${c.id} summary`, String(c.data.summary), true));
      for (const u of (c.data.use as string[]) ?? []) found.push(...prose(`${c.id} use`, u, true));
      for (const a of (c.data.avoid as { text: string }[]) ?? []) found.push(...prose(`${c.id} avoid`, a.text, true));
      for (const note of (c.data.a11y as string[]) ?? []) found.push(...prose(`${c.id} a11y`, note, false));
    }
    for (const p of patterns) {
      found.push(...prose(`${p.id} title`, String(p.data.title), true));
      found.push(...prose(`${p.id} summary`, String(p.data.summary), true));
      for (const r of p.data.rules as string[]) found.push(...prose(`${p.id} rule`, r, true));
    }
    expect(report(found)).toEqual([]);
  });

  it("in example titles", () => {
    const found = [...components, ...patterns].flatMap((e) =>
      exampleTitles(e.body).flatMap((title) => prose(`${e.id} example`, title, true)),
    );
    expect(report(found)).toEqual([]);
  });

  it("in the demos' labels, text and buttons", () => {
    const found: Found[] = [];
    for (const file of demoFiles()) {
      const where = relative(SRC, file);
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/\b(label|title|description|errorMessage|aria-label|caption|placeholder)="([^"]+)"/g)) {
        found.push(...prose(`${where} ${m[1]}`, m[2], m[1] !== "placeholder"));
      }
      for (const m of source.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)) {
        found.push(...prose(`${where} text`, m[1].trim(), false));
      }
      for (const m of source.matchAll(/<Button\b[^>]*>\s*([^<{]+?)\s*<\/Button>/g)) {
        found.push(...[...checkButtonLabel(m[1]), ...checkSentenceCase(m[1], NAMES)].map((issue) => ({ where: `${where} button`, issue })));
      }
    }
    expect(report(found)).toEqual([]);
  });
});
```

- [ ] **Step 6: Run it, and fix the copy it flags**

Run: `cd apps/docs && npx vitest run test/copy.test.ts`

Each failure lists the file, the field and the rule. For each one:
- **The copy breaks the rule:** reword it. For example, "Project Enquiry" becomes "Project enquiry", and "Loading..." becomes "Loading…".
- **The word is a real proper noun** (a place, a person, a product, a month, a key name): add it to `PROPER_NOUNS` in `content-style.ts`.
- **The match is not copy** (for example an attribute in a code string inside a demo): narrow the extraction in `copy.test.ts` with a comment saying why. Do not loosen a rule.

Keep a list of every demo you change: their visual baselines change in Task 9. Rerun until the test passes.

- [ ] **Step 7: Write the Content style page**

In `apps/docs/src/lib/nav.ts`, append to `FOUNDATIONS`:

```ts
  { href: "/foundations/content/", label: "Content style" },
```

Add to `apps/docs/test/nav.test.ts`:

```ts
  it("lists Content style under Foundations", () => {
    expect(FOUNDATIONS.at(-1)).toEqual({ href: "/foundations/content/", label: "Content style" });
  });
```

`apps/docs/src/pages/foundations/content.astro`:

```astro
---
import DataTable from "../../components/DataTable.astro";
import FoundationsNav from "../../components/FoundationsNav.astro";
import DocPage from "../../layouts/DocPage.astro";

const PAIRS: [string, string][] = [
  ["Send enquiry", "Submit"],
  ["Delete project", "OK"],
  ["Enter your name.", "Error: name is required!"],
  ["Two pages could not be published. Check the build log and try again.", "Oops! Something went wrong."],
  ["Read the type guide", "Click here"],
  ["Save as…", "Save as..."],
  ["7 November 2026", "11/7/2026"],
  ["12 kg, 40%, CHF 1,200", "12kg, 40 percent, 1200 CHF"],
];
---
<DocPage
  title="Content style"
  eyebrow="Foundations"
  description="Words are part of the grid. Write plainly, say what happens, and keep every label and message as short as it can be while still being clear."
>
  <FoundationsNav slot="aside" />

  <h2>Voice</h2>
  <div class="sw-measure">
    <p>Plain and direct, in the second person. Say what something does, not how impressive it is. Prefer short words and short sentences; one idea a sentence.</p>
    <p>Write in British English: colour, centre, organise, catalogue.</p>
  </div>

  <h2>Capitals</h2>
  <div class="sw-measure">
    <p>Sentence case everywhere: page titles, headings, labels, buttons, captions and tabs. Capitals start sentences and proper nouns, and component names keep theirs: "Use a DataGrid".</p>
  </div>

  <h2>Actions</h2>
  <div class="sw-measure">
    <p>A button starts with a verb and names the outcome: "Send enquiry", "Delete project". A link names where it goes: "Read the type guide". End an action with "…" only when it asks for more input before it happens.</p>
  </div>

  <h2>Messages and errors</h2>
  <div class="sw-measure">
    <p>Say what happened, then what to do next. Do not blame people, do not apologise at length, and do not write "Error:" or use exclamation marks. A field's error says what to enter: "Enter an email address such as name@studio.ch." See the <a class="sw-link" href="/patterns/errors-and-feedback/">Errors and feedback pattern</a> for where each message goes.</p>
  </div>

  <h2>Numbers, dates and units</h2>
  <div class="sw-measure">
    <p>Write dates as "7 November 2026", or "7 Nov" where space is tight. Use the 24-hour clock: 14:30. Put a space between a number and its unit, but not before %: 12 kg, 40%. Put the currency first: CHF 1,200. Use numerals for every number in an interface.</p>
  </div>

  <h2>Write this, not that</h2>
  <DataTable id="content-pairs-caption" caption="Examples" columns={["Write", "Not"]}>
    {
      PAIRS.map(([good, bad]) => (
        <tr>
          <td>{good}</td>
          <td>{bad}</td>
        </tr>
      ))
    }
  </DataTable>

  <h2>Checked by a test</h2>
  <div class="sw-measure">
    <p>A test reads the docs' own copy (component summaries and usage, pattern rules, example titles, and the labels, text and buttons in every demo) and fails on title case, "click here", exclamation marks, an "Error:" prefix, three dots for an ellipsis, American spellings and buttons labelled "OK", "Submit", "Yes" or "No". The rules live in <code>apps/docs/src/lib/content-style.ts</code>.</p>
  </div>
</DocPage>
```

- [ ] **Step 8: Run all docs tests and build**

Run: `cd apps/docs && npx vitest run`
Expected: PASS, all files.

Run: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build`
Expected: success, with `dist/foundations/content/index.html`.

- [ ] **Step 9: Commit**

```bash
git add apps/docs
git commit -m "docs: content style page, and a test that holds the docs' copy to it

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Browser tests and visual baselines

**Files:**
- Create: `apps/docs/e2e/patterns.spec.ts`
- Modify: `apps/docs/e2e/components.spec.ts`, `apps/docs/e2e/visual.spec.ts`, `apps/docs/e2e/foundations.spec.ts`

Rebuild first: `pnpm --filter @raster/css build && pnpm --filter @raster/docs build`, and check that port 4388 is free.

- [ ] **Step 1: Component pages show Usage**

In `apps/docs/e2e/components.spec.ts`, inside the per-page test, after the breadcrumbs assertion, add:

```ts
    await expect(page.getByRole("heading", { level: 2, name: "Usage" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Use it to" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Avoid it for" }).getByRole("listitem").first()).toBeVisible();
```

Add one test that a usage link leads where it says:

```ts
test("an avoid item links to the component to use instead", async ({ page }) => {
  await page.goto("/components/button/");
  await page.getByRole("link", { name: "Use Link instead." }).click();
  await expect(page).toHaveURL(/\/components\/link\/$/);
});
```

The two `<section>` elements are labelled by their `h3`s, so they are named regions. If axe flags a landmark issue for them, check the a11y spec's run in Step 5, and change the sections to `<div>`s with `role="group"` and the same labels.

- [ ] **Step 2: Pattern pages**

`apps/docs/e2e/patterns.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { builtPages } from "./pages";

const patternPages = builtPages().filter((path) => /^\/patterns\/[^/]+\/$/.test(path));

test("the index links to the five patterns, in order", async ({ page }) => {
  await page.goto("/patterns/");
  await expect(page.locator("main .docs-component-list a")).toHaveText([
    "Forms",
    "Navigation",
    "Data",
    "Empty states",
    "Errors and feedback",
  ]);
  expect(patternPages).toHaveLength(5);
});

for (const path of patternPages) {
  test(`${path} has breadcrumbs, rules, examples with code, and links to its components`, async ({ page }) => {
    await page.goto(path);
    const title = (await page.locator("h1").textContent())?.trim() ?? "";
    const crumbs = page.getByRole("navigation", { name: "Breadcrumbs", exact: true });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(title);
    await expect(page.getByRole("heading", { level: 2, name: "Rules" })).toBeVisible();
    expect(await page.locator("ol.docs-rules > li").count()).toBeGreaterThan(2);
    const examples = page.locator("figure.docs-example");
    expect(await examples.count()).toBeGreaterThan(0);
    for (const example of await examples.all()) {
      await expect(example.getByRole("region", { name: /^React code: / })).toBeVisible();
    }
    const links = page.locator("main .docs-component-list a");
    expect(await links.count()).toBeGreaterThan(2);
    for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      expect(builtPages()).toContain(href);
    }
  });
}

test("the enquiry form sums up its errors, links to each field, and then sends", async ({ page }) => {
  await page.goto("/patterns/forms/");
  await waitForIslands(page);
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send enquiry" }) });
  await form.getByRole("button", { name: "Send enquiry" }).click();

  const summary = form.locator(".docs-form-status");
  await expect(summary).toBeFocused();
  await expect(summary).toContainText("Fix 2 fields to send the enquiry");
  await expect(form.getByRole("textbox", { name: "Name" })).toHaveAttribute("aria-invalid", "true");

  await summary.getByRole("link", { name: "Enter an email address such as name@studio.ch." }).click();
  await expect(form.getByRole("textbox", { name: "Email" })).toBeFocused();

  await form.getByRole("textbox", { name: "Name" }).fill("Anna Keller");
  await form.getByRole("textbox", { name: "Email" }).fill("anna@studio.ch");
  await form.getByRole("button", { name: "Send enquiry" }).click();
  await expect(summary).toContainText("Enquiry sent");
  await expect(summary).toBeFocused();
});

test("no matches offers to clear the search, which brings the list back", async ({ page }) => {
  await page.goto("/patterns/empty-states/");
  await waitForIslands(page);
  const example = page.locator("figure.docs-example").filter({ hasText: "No matches" });
  await expect(example.getByRole("heading", { name: 'No projects match "Zeppelin"' })).toBeVisible();
  await example.getByRole("button", { name: "Clear search" }).click();
  await expect(example.getByRole("searchbox", { name: "Search projects" })).toHaveValue("");
  await expect(example.getByRole("listitem")).toHaveCount(5);
});
```

If `example.getByRole("listitem")` also counts list items elsewhere in the figure, such as in the code block, scope it to `example.locator(".docs-example-demo")`.

- [ ] **Step 3: Content style in the Foundations navigation**

Add to `apps/docs/e2e/foundations.spec.ts`:

```ts
test("the content style page is in the Foundations navigation", async ({ page }) => {
  await page.goto("/foundations/content/");
  const nav = page.getByRole("navigation", { name: "Foundations" });
  await expect(nav.getByRole("link", { name: "Content style" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("table", { name: "Examples" })).toBeVisible();
});
```

- [ ] **Step 4: Visual baselines for pattern examples**

In `apps/docs/e2e/visual.spec.ts`:
- Below `templatePages`, add `const patternPages = pages.filter((p) => /^\/patterns\/[^/]+\/$/.test(p));`.
- Inside `test.describe(variant, …)`, after the component loop, add:

```ts
      for (const path of patternPages) {
        test(`pattern ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          await page.addStyleTag({ content: ".docs-example-code { display: none !important; }" });
          const examples = page.locator("figure.docs-example");
          const count = await examples.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(examples.nth(i)).toHaveScreenshot(`pattern-${slug(path)}-${i + 1}-${variant}.png`);
          }
        });
      }
```

Generate the new baselines:

Run: `cd apps/docs && npx playwright test --project=visual -g "pattern " --update-snapshots`
Expected: 8 examples × 4 combinations × 3 widths = 96 new PNGs named `pattern-*`.

If Task 8 changed any component demos, regenerate only those pages' baselines, with a `-g` that names them (for example `-g "examples on (stat|banner)$"`) and `--update-snapshots`. Then run `git status apps/docs/e2e/__screenshots__` and confirm that only those pages' images and the new `pattern-*` images changed.

Look at these baselines with the Read tool and check each:
- `pattern-forms-1-alpine-light-1440`: the form in one column, the Banner area empty and taking no space.
- `pattern-navigation-1-zurich-dark-360`: the SideNav above the content, nothing overflowing.
- `pattern-data-1-alpine-dark-768`: two stats with sparklines, the table's numbers aligned at the end.
- `pattern-empty-states-2-zurich-light-1440`: the empty state, with the search field above it.
- `pattern-errors-and-feedback-1-alpine-light-360`: the danger Banner and the invalid field.

- [ ] **Step 5: Run the browser tests**

Run: `cd apps/docs && npx playwright test --project=chromium`
Expected: all pass. `a11y.spec.ts` now covers the 7 new pages: the index, the 5 pattern pages and Content style. This includes axe in four combinations and reflow at 320px.

Run: `cd apps/docs && npx playwright test --project=visual`
Expected: all pass.

If a test fails on a timeout while the machine is heavily loaded (check `uptime`), rerun that test with `--repeat-each=3` before treating it as a real failure. A pixel difference is always a real failure.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/e2e
git commit -m "test(docs): usage, patterns and content style in the browser; pattern baselines

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Spec notes and verify

**Files:** Modify `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Write §19 "Settled in Plan 8"**

Append a section in the style of §15 and §17: bullets that record what was decided while building. It must cover:
- **Usage:** the frontmatter shape, the `patterns/<id>` link form, and that a broken link fails the build and a unit test.
- **Patterns:** they are a content collection ordered by `PATTERNS`, and their examples reuse `Example`, so static ones show generated HTML and there are no parity screenshots.
- **The copy check:** what it reads and which rules it enforces, the proper-noun allowlist policy (real proper nouns only), and how many copy fixes it caused.
- **Known gaps:**
  - the checker cannot judge voice or whether a button names its outcome, only generic labels;
  - number and date formats are not checked;
  - VoiceOver and NVDA have not been tried by hand on the enquiry form's error summary.

- [ ] **Step 2: Verify**

Run: `pnpm verify`
Expected: build, lint, typecheck, unit tests and e2e all pass. Under heavy load, treat timeouts as in Task 9, Step 5.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 8's outcomes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
