# Raster version 2: components for real products

- **Date:** 2026-11-06
- **Status:** Approved design, pending implementation plans 7a–7c
- **Extends:** [Raster design system](2026-11-04-raster-design-system-design.md). Everything in that spec still holds; this document adds to it.

## 1. Purpose

Version 1 has 31 components. Building Studio Achse, a realistic agency website, exposed what real sites and products still need: a phone menu, disclosure, filters, media frames and status displays. This spec adds 21 components in three families of work (Plans 7a, 7b and 7c), bringing Raster to 52.

It is the first of five tracks on Raster's road to a world-class system (section 8).

### Success criteria

1. Every new interactive component works on **both routes**: plain HTML using native elements, and React using React Aria. A parity test proves the two render the same.
2. The selection and navigation components work without JavaScript on the HTML route, except where section 3 names a small optional script.
3. Every new docs page passes axe in all four theme and mode combinations and reflows at 320px, as version 1 pages do.
4. The docs header uses the new compact mode, so it no longer scrolls sideways on phones.

## 2. Approach: one CSS contract, two routes

Each interactive component has one CSS contract that styles two kinds of markup:

- **HTML route:** native elements carry the behaviour: `<details>`/`<summary>`, `<dialog>` opened by invoker commands (`commandfor`/`command`), the `popover` attribute, `<input type="search | number | range | checkbox | radio">`, `<progress>` and `<meter>`.
- **React route:** thin wrappers over React Aria Components, as in version 1.

The contract uses the existing conventions: `sw-` classes, state and variants as data attributes, ARIA attributes as styling hooks where they exist (`aria-current`, `aria-expanded`, `[open]`, `:checked`). Where native and React Aria markup differ, the CSS targets both with `:is()` selectors.

**Rejected alternatives:**
- **React-only behaviour:** about 30% less work, but it breaks the version 1 promise that plain HTML users are not second class.
- **A Web Components package:** widest reach, largest effort. It belongs to the Distribution track if teams outside React ask for it.

## 3. Components

| # | Component | HTML route | React route |
|---|---|---|---|
| **Navigation** | | | |
| 1 | Header, compact mode | Below 600px of header width, links collapse into a Menu button that opens a full-screen `<dialog>` via invoker commands; a script of about 15 lines covers browsers without them | `Header` `compact` behaviour on `Modal` |
| 2 | Pagination | `<nav aria-label>` with a list of links; `aria-current="page"` on the current page | `Pagination` (markup only, no behaviour) |
| 3 | SideNav | `<nav>` with nested lists; collapsible groups are `<details>` | `SideNav`, groups on `Disclosure` |
| **Disclosure and layers** | | | |
| 4 | Disclosure, Accordion | `<details>`/`<summary>`; a shared `name` attribute makes a group open one at a time | `Disclosure`, `DisclosureGroup` |
| 5 | Popover | `popover` attribute; CSS anchor positioning where supported, a fixed placement under the trigger otherwise | `Popover` with `DialogTrigger` |
| 6 | Drawer, Sheet | `<dialog>` docked to the inline-end edge (`data-placement="end"`) or the bottom (`"bottom"`) | `Modal` with `placement` |
| **Selection and input** | | | |
| 7 | TagGroup, selectable | Checkbox inputs styled as chips (multi-select) or radio inputs (single) | `TagGroup` with `selectionMode` |
| 8 | SegmentedControl | Radio inputs in a `fieldset` styled as one segmented row | `ToggleButtonGroup` |
| 9 | SearchField | `<input type="search">` plus a clear button (a 5-line optional script clears and refocuses) | `SearchField` |
| 10 | NumberField | `<input type="number">` with native steppers | `NumberField` with − and + buttons |
| 11 | Slider | `<input type="range">` with an `<output>` showing the value | `Slider`, one or two thumbs |
| **Feedback and display** | | | |
| 12 | ProgressBar | `<progress>` | `ProgressBar` |
| 13 | Meter | `<meter>` with `low`, `high`, `optimum` | `Meter` |
| 14 | Skeleton | `aria-hidden` blocks; the loading region has `aria-busy="true"` | `Skeleton` |
| 15 | Banner | A page-level strip, `role="status"` or `role="alert"` by tone | `Banner`, optionally dismissable |
| 16 | EmptyState | Label, heading, one sentence and one action on the hanging grid | `EmptyState` |
| 17 | Media | `<figure>` with `data-ratio` (1:1, 4:3, 3:2, 16:9, 21:9) holding `<img>`, `<video>` or SVG | `Media` |
| 18 | Avatar | Image or initials | `Avatar` |
| 19 | Badge | A count or status marker, always with a text equivalent | `Badge` |
| 20 | DescriptionList | `<dl>` laid out as facts on the grid | `DescriptionList` |
| 21 | Stat | Value, label and optional change | `Stat` |

The header's compact mode is an extension of the existing Header, and Accordion is a grouping of Disclosure, so the count of new components is 21 and the total becomes 52.

**Deferred to later plans:** Combobox, DatePicker and FileUpload (Plan 7d); DataGrid and Charts (Plans 7e and 7f). They have no good native equivalent and need their own design.

## 4. Visual rules

All version 1 rules apply: flat surfaces, hairlines and white space; weights 300–500; no state shown by colour alone; `radius-full` only for Tag and Switch (and therefore TagGroup chips).

| Component | Rule |
|---|---|
| Compact header menu | Full-screen panel on `surface-page`. Links at h2 size, one per row between hairlines, with mono indices (01, 02…) in the label column. The current link has a `brand-signal` bar at its start plus `aria-current`. Close sits where the Menu button was. |
| Pagination | Mono numbers. Current page: 2px underline plus `aria-current`. Previous and next with arrows; long ranges collapse to "…". |
| SideNav | Hairline on the inline-start edge. Current item: 2px accent bar plus weight 500. |
| Disclosure | Full-width rows between hairlines. A plus icon swaps to minus when open (no rotation). |
| Popover | `surface-raised`, hairline border, `shadow-overlay`. No arrow. |
| Drawer | Docked to one edge, `shadow-overlay`, dimmed backdrop. |
| TagGroup chips | Pill shape. Selected: check icon, `accent-subtle` fill and `border-strong` outline. |
| SegmentedControl | Segments share one border. Selected: inset accent outline plus underline, as pressed toggles in version 1. |
| Slider | 2px track; square thumb using the theme's `radius`; 44px hit area. |
| NumberField, SearchField | Standard `sw-input`. Stepper and clear buttons are at least 44px; the clear button is named "Clear search". |
| ProgressBar, Meter | 4px bar on a hairline track; label above, value in mono. A Meter outside its optimum range adds a word ("High", "Low") as well as changing colour. |
| Skeleton | Static `surface-subtle` blocks. Full motion: a slow opacity pulse. Reduced motion: no movement. No gradients. |
| Banner | Full-width strip below the header, never over content. 4px leading rule in the tone colour, an icon and a text label. |
| EmptyState | Hanging grid; no illustration by default. |
| Media | Theme `radius`, `object-fit: cover`, caption below; the fixed ratio prevents layout shift. |
| Avatar | Square with the theme `radius`; initials in mono. `alt=""` when a visible name accompanies it. |
| Badge | Mono, theme `radius`. A count always has a text equivalent ("3 unread"). |
| DescriptionList | Mono labels over values, in a grid of hairline-topped cells. |
| Stat | Value at h1 size, weight 300; mono label. A change shows a sign, an arrow and a phrase ("up 12% on last year"). |

**Motion:**
- Drawer and the compact menu slide along one axis, `dur-slow` (320ms), `ease-standard`.
- Popover fades with at most an 8px translate, `dur-base`.
- Disclosure animates its height over `dur-base` on the native route where `interpolate-size` and `::details-content` are supported. React Aria hides a closed panel with `hidden="until-found"`, so the React route opens instantly; `.sw-disclosure-panel[hidden]` drops the panel's padding so closed rows match on both routes.
- Reduced motion: fades capped at 120ms or no animation; no transforms.

## 5. Code layout

- **CSS:** one file per component in `packages/css/src/components/`, in the `raster.components` layer.
- **React:** wrappers in `packages/react/src/`, in family folders: `navigation/`, `disclosure/`, `selection/`, `feedback/`, `display/` (existing folders reused where they fit). Every component forwards `ref` and merges `className`.
- **Icons:** Lucide, 1.5px stroke, as in version 1.

## 6. Documentation

- One MDX page per component in the existing collection, with live examples, React and HTML snippets, a props table and accessibility notes.
- Interactive components add a **Without React** example built on the native element.
- The components index gains the new families. The site grows from 43 to 64 pages.
- The docs site header adopts compact mode in Plan 7a.

## 7. Testing

- **CSS unit tests:** each new component's selectors exist in the built stylesheet and use no raw colours.
- **React unit tests:** class contract, `ref` forwarding, `className` merging and the React Aria behaviour each wrapper exposes (selection, value, open state).
- **Accessibility:** the existing sweep (structure rules, 320px reflow, axe in four combinations) covers every new page automatically. Open overlays are scanned too.
- **Keyboard walkthroughs, on both routes where a native one exists:**
  - Compact menu: opens, traps focus, closes on Escape, returns focus to Menu, at 360px.
  - Disclosure: Enter and Space toggle; a single-open group closes the others.
  - Drawer and Popover: focus moves in, Escape closes, focus returns.
  - TagGroup and SegmentedControl: arrow keys and Space select, with checkbox or radio semantics.
  - Slider and NumberField: arrows, Page Up/Down and Home/End change the value, and it is announced.
- **Parity tests:** for each interactive component, the native and React examples are screenshotted and must match within the visual tolerance (`maxDiffPixelRatio` 0.001), or within a documented per-component tolerance where native controls differ unavoidably (for example a browser's own number steppers).
- **Visual baselines:** every new example in four combinations at three widths, roughly 250 screenshots and 6 MB.

## 8. Roadmap: five tracks

| Plan | Track | Scope |
|---|---|---|
| 7a | Components | Layers and navigation: Disclosure, Popover, Drawer, compact header and menu, Pagination, SideNav; the parity-test harness |
| 7b | Components | Selection and input: TagGroup, SegmentedControl, SearchField, NumberField, Slider |
| 7c | Components | Feedback and display: ProgressBar, Meter, Skeleton, Banner, EmptyState, Media, Avatar, Badge, DescriptionList, Stat |
| 8 | Guidance | When to use and when not to, on every component page; patterns for forms, navigation, data, empty and error states; content style |
| 9 | Distribution | CI with Linux screenshot baselines, a deployed docs site, npm publishing with versioning and changelogs, a design-tool kit |
| 10 | AI-native | A machine-readable component manifest, `llms.txt`, a Raster MCP server, lint rules that catch misuse |
| 11 | Proof in use | Studio Achse upgraded to use the whole system, with Journal and Careers pages and a "Built with Raster" coverage page |
| 7d–7f | Components | Combobox, DatePicker and FileUpload; then DataGrid and Charts as separate projects |

Each track after Plan 7c starts with its own short design discussion and spec addendum. The order after 7c may change.

## 9. Settled in Plan 7a

- **Invoker commands:** Baseline since Safari 26.2 (December 2025). The Header docs page publishes a 12-line fallback for older browsers; Raster ships no script.
- **Anchor positioning:** Baseline since Firefox 147 (January 2026). Native popovers are anchored inside `@supports (position-anchor: --a)`; elsewhere the browser centres them.
- **Parity tolerance:** zero differing pixels (`maxDiffPixels: 0`). The 0.001 ratio used for visual baselines would let a whole current-page bar (about 350 pixels) through on a full-screen menu; the zero cap catches it. Popover parity also checks placement: on both routes the panel sits 4–12px below its trigger with inline-start edges aligned. Two harness measures make the comparison about the components rather than where they sit on the page:
  - Before each screenshot the element is moved onto a whole pixel, because the fluid type scale leaves the React and native examples at different fractional offsets and Chromium places text by that fraction.
  - The native popover is compared with `position: absolute` (the scheme React Aria uses). As a fixed, anchored top-layer element its glyphs land about half a pixel apart even when every box matches. The product keeps `position: fixed`.
- **Full-page screenshot tolerance:** a change the size of the header (about 600px) stays under 0.001 on a full-page template screenshot of about 800,000px, so such baselines can miss it. Plan 7a regenerated them in full; a tighter rule for full-page shots (a `maxDiffPixels` cap) belongs in the Distribution track.

## 10. Settled in Plan 7b

- **NumberField parity:** the native route keeps the browser's own steppers inside the input, so it cannot render like the React route's − and + buttons. NumberField has no parity screenshot; its arrow-key stepping is tested on both routes.
- **Native-route scripts:** a search field's clear button and a slider's `<output>` need a few lines of script on the native route. The docs ship them (`apps/docs/src/lib/native-controls.ts`) and publish them on the component pages; Raster's packages ship no script. Escape still clears a native search field without script.
- **Slider:** neither route draws a filled portion of the track. Chromium has no fill pseudo-element and gradients are not allowed; the value is always shown as text. The React track is inset by half a thumb so its thumb travels exactly as a native range thumb does, and the two routes match at zero differing pixels; no tolerance exception was needed.
- **Chips and segments without script:** the native route uses real checkbox and radio inputs, so a filter or a choice submits with a form.

## 11. Settled in Plan 7c

- **ProgressBar and Meter render native elements on both routes.** The React components output `<progress>` and `<meter>` rather than React Aria's divs: one markup, the browser's own semantics, and no parity gap. There is no indeterminate ProgressBar; waits of unknown length use Skeleton.
- **Meter states come from data-state.** The React Meter computes the HTML meter algorithm (`meterState`) and sets `data-state`; native authors set it themselves. Colour and the shown word always agree: "High" or "Low" outside the middle region, and "Medium" when the middle is not the best region, so an amber bar never stands without a word. Boundaries are normalised as the HTML algorithm does (clamped into the range, high never below low), and no vendor pseudo-classes are needed. A long value moves onto its own line rather than breaking.
- **Static components share one markup.** Skeleton, Banner, EmptyState, Media, Avatar, Badge, DescriptionList and Stat render plain HTML; the docs show the rendered markup as the HTML route, so no parity screenshots are needed. Banner's dismiss button is React-only and moves focus to the main content.
- **A narrow banner stacks its button.** Below 480px of banner width the Dismiss button drops under the text, its label aligned with the text, so the message keeps the full width.
- **A loading area is named by role.** A plain div may not carry aria-label, so the area marked aria-busy is a named group (a card) or a region (a major part of the page).
- **Forced colours are tested.** `apps/docs/e2e/forced-colors.spec.ts` screenshots every bar, thumb, fill and block in forced-colours mode, including Plan 7b's slider and chips.
- **Stat changes are neutral in colour:** a fall is not always bad, so the sign and the words carry the meaning.
