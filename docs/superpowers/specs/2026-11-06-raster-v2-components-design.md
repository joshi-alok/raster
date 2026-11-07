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

## 12. Plan 7d design: combobox, dates and files

Agreed on 2026-11-06. Five components, taking Raster from 52 to 57.

| Component | HTML route | React route |
|---|---|---|
| Combobox | `<input list>` with a `<datalist>`; the suggestion list is the browser's own and accepts free text | `ComboBox`: the list opens in the Select popover and listbox, filtered as you type |
| DatePicker | `<input type="date">`; the calendar is the browser's own | `DatePicker`: day, month and year segments in the reader's locale, and a Calendar in a popover |
| DateRangePicker | Two date inputs, From and To, in a `fieldset` with a legend | `DateRangePicker`: start and end segments and a RangeCalendar |
| Calendar, RangeCalendar | None: no native calendar exists; the DatePicker page points to `<input type="date">` | `Calendar`, `RangeCalendar` |
| FileUpload | The file input is itself the drop zone: browsers accept dropped files on it, and it shows the chosen names; no script | `FileUpload`: a `DropZone` with a Choose files button, and a list of files with size, Remove and optional progress |

**Visual rules:**
- **Calendar:** a 7-column grid of 44px cells, mono numbers, narrow weekday initials in the label style, the month heading at body size and weight 500, previous and next buttons that mirror in right-to-left text.
- **Calendar states, never colour alone:** today has a 2px underline; a selected day has the accent fill and weight 500; a range has solid ends and a subtle fill between; an unavailable day is struck through and muted; days outside the month are hidden.
- **Date field:** one `sw-input` holding the segments and a calendar button at the inline end behind a hairline; the focused segment takes the accent fill.
- **Drop zone:** a dashed `border-strong` hairline at rest. While files are dragged over it, the border turns solid accent, the fill turns `accent-subtle` and the text changes to "Drop to add". The native route has no drag-over state.
- **File list:** rows between hairlines; the name truncates, the size is mono, Remove is a ghost button named "Remove <file name>", and an upload in progress shows a 4px bar under the row.

**Testing:** no parity screenshots in this plan. Each native control is drawn by the browser (the datalist list, the date input's calendar, the file input's button and text), so the two routes cannot match pixel for pixel. Keyboard walkthroughs run on both routes, a drop is tested on the React route, and forced-colours screenshots cover the calendars, the date field and the drop zone.

## 13. Settled in Plan 7d

- **Native controls are the browser's own.** The datalist's list, the date input's calendar and the file input's button and text cannot be styled to match the React route, so Plan 7d has no parity screenshots; both routes have keyboard walkthroughs. Each route orders a date by its own locale source (React Aria by the reader's language, the date input by the browser), so the two can differ on one page.
- **Dates are `CalendarDate` values** from `@internationalized/date`. Raster's package takes its date types from React Aria and adds no runtime dependency; apps and the docs import `parseDate` and friends directly.
- **One calendar body.** Calendar, RangeCalendar and both pickers' popovers share `CalendarBody`: a heading between Previous and Next, and a grid of 44px cells. Its header row is a `div`, because a `header` outside a sectioning element is a page banner. React Aria adds a visually hidden heading and a hidden Next button for screen readers.
- **Date segments are at least 1.125rem wide**, so one-digit segments ("3/9") meet the 24px target spacing. A single digit therefore sits centred in its slot.
- **A narrow range field stacks.** Below 18rem the start sits over the end with the calendar button beside both; wider, the two dates sit together and only the button goes to the end.
- **FileUpload holds no files.** The app owns the list (`files`, `onAdd`, `onRemove`, `progress`); the component checks types and sizes, reports refusals in an alert and keeps focus in place after a removal.
- **The native file input is the drop zone.** No script is needed to drop or to show the chosen names; there is no drag-over state on that route.
- **The drop test uses Chromium's own drag pipeline** (CDP `Input.dispatchDragEvent` with files on disk), because React Aria reads dropped files through `webkitGetAsEntry`, which returns nothing for files built in the page. It runs in Chromium only.

## 14. Plan 7e design: DataGrid

Agreed on 2026-11-06. One component, taking Raster from 57 to 58. Table stays for static data; DataGrid is for data people work with.

| Feature | HTML route | React route |
|---|---|---|
| Sorting | Header links (`?sort=name&dir=desc`) that the server answers; `aria-sort` on the current column | `allowsSorting` columns; Enter or a click sorts; `aria-sort` from React Aria |
| Row selection | Checkbox inputs in the first column, inside the app's form; an optional docs script makes the header checkbox select all and show a partial selection | `selectionMode="multiple"` adds a checkbox column and Select all |
| Empty state | The app renders an EmptyState instead of the table | `emptyState` on the body renders inside the grid |
| Sticky header and first column | The same classes on the same cells | The same classes; the selection column is sticky too |
| Column resizing | None | `allowsResizing` adds a handle; pointer or keyboard |
| Virtualised rows | None (the server pages instead) | `virtualized={{ rowHeight }}` draws only the rows in view |

**Visual rules:**
- DataGrid carries `.sw-table`, so cells, hairlines and the mono caption look as Table does; numbers are end-aligned in tabular mono.
- **Sorting:** a sortable header shows a muted pair of chevrons; the sorted one shows a single chevron in the text colour. Drawn with borders, so it survives forced colours.
- **Selection:** a selected row has the `accent-subtle` fill and a 2px accent bar at its inline start, as well as a ticked checkbox. In forced colours it uses the system highlight.
- **Sticky cells** have a solid page-coloured background; the sticky first column ends in a hairline.
- **Resize handle:** a 1px `border-strong` line at the header's inline end, 2px accent while hovered or resizing, with a 24px-wide hit area.
- **Narrow screens:** the grid scrolls inside its own region; the page never scrolls sideways.

**Testing:** no parity screenshots, because native checkboxes and link headers cannot match React Aria's rendering pixel for pixel. Unit tests cover sorting, selection, the empty state, the handle and the classes. Browser tests cover grid keyboard navigation, sorting and selecting from the keyboard, resizing from the keyboard, virtualisation drawing far fewer rows than it has, and the native sort links and Select all. Forced-colours screenshots cover selected rows, sort chevrons and handles.

## 15. Settled in Plan 7e

- **DataGrid is Table plus behaviour.** It carries `.sw-table`, so the two read as one family; Table stays for read-only data. Mono figures are for the numbers only: numeric headers keep the header type, and native row headers keep the body weight, as in React.
- **Wrappers add the selection column.** `DataGridHeader` and `DataGridRow` read `useTableOptions` and add the Select all and row checkboxes for multiple selection with the default `selectionBehavior="toggle"`, so apps never place them by hand. With `"replace"` there are none.
- **Columns are static.** DataGridHeader takes DataGridColumn elements; rows may be static or rendered from `items`.
- **Sorting is the app's.** The grid reports `onSortChange`; the app sorts. On the native route the server sorts from the header links.
- **A header's focus rests on its label.** React Aria gives a column header's focus to its first focusable child; on a resizable column that was the resize handle's input, where Enter resizes, so the column could not be sorted from the keyboard. The label is focusable by script (`tabIndex={-1}`), comes first and shows the focus ring: Enter sorts, ArrowRight reaches the handle. The header is named by its label alone (`aria-labelledby`, set on the element because Column filters it out), not "Project Resizer". Screen-reader announcement of a focused label has not been checked by hand with VoiceOver or NVDA.
- **Virtualised cells are divs.** React Aria draws them with grid roles inside positioned wrappers, so Table's `th`/`td` rules don't reach them: the grid styles them by class, each cell fills its wrapper, the wrapper takes the selected fill and bar, and sticky columns don't pin. Large grids render on the client only: hydrating a server-rendered 5,000-row React Aria table held the main thread for about ten seconds.
- **Sticky cells get their own layer** (`will-change: transform`): at the fractional row heights fluid type produces, Chrome otherwise drew them a pixel off on some loads, and every header cell needs one or the header rule steps at the sticky column. The React sticky column is offset by the select column's 44px, which React Aria sizes in pixels.
- **The native route needs one optional script,** for Select all. Without it every row checkbox still works and submits. It syncs the header on load, on `pageshow` and after a form reset, since indeterminate can't be written in HTML, and ignores disabled rows. The native checkbox is an 18px target spaced a row apart; React's is a 44px label.
- **No parity screenshots:** native checkboxes and link headers cannot match React Aria's rendering.
- **Known:** a 1px seam where the React grid's sticky column edge crosses the header rule.

## 16. Plan 7f design: Charts

Agreed on 2026-11-07. Three components, taking Raster from 58 to 61: **BarChart** (vertical or horizontal, grouped or stacked), **LineChart** (optionally with an area fill) and **Sparkline** (a small inline trend for Stat and table cells). No pie, donut or scatter; never two y-axes; bar values always start at zero.

**SVG for marks, HTML for words.** Bars, lines and areas are one SVG stretched over the plot (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`); lines keep their 2px with `vector-effect: non-scaling-stroke`. Tick labels, gridlines, category labels, the legend, line markers, end labels and the tooltip are HTML positioned by percentages. Charts therefore reflow to any width without JavaScript and their text never scales. The geometry is pure functions over `d3-scale` (nice ticks and bands; the straight-segment paths are written directly), exported for servers that render without React.

| Feature | HTML route | React route |
|---|---|---|
| Drawing | The documented markup, written by a server: `figure.sw-chart` with the SVG, HTML labels and a data table | `BarChart`, `LineChart`, `Sparkline` compute the same markup from `data`, `x` and `series` |
| Data table | `<details class="sw-chart-data">` "Show data" holding a `sw-table` | The same, generated |
| Reading values | The table, and the visible labels | Plus one Tab stop: arrows move between marks, Home/End jump; each mark is named ("Built, 2022: 4"); a tooltip follows focus and hover |

**Colour.**
- New roles: `chart-1` to `chart-6` and `chart-muted`, defined for each theme and mode.
- The order is fixed: blue, orange, teal, plum, olive, rose. Zürich's blue is its cobalt.
- A series takes its slot in the order the app lists it. Slots are never cycled: a seventh series is an error, and the app folds the rest into "Other".
- `highlight` keeps one series in its colour and draws the rest in `chart-muted`.
- Status colours are never used for series.
- A test in `@raster/tokens` holds every set to these checks in both modes. The thresholds come from the data-visualisation method.
  - **Lightness:** OKLCH L between 0.43 and 0.77 in light mode, between 0.48 and 0.67 in dark mode.
  - **Chroma:** at least 0.10.
  - **Separation for colour-blind readers:** adjacent slots at least 8 apart (ΔE in OKLab ×100). Protanopia and deuteranopia are simulated with Machado 2009 at severity 1.0.
  - **Separation for full-colour readers:** adjacent slots at least 15 apart.
  - **Contrast:** at least 3:1 against every surface.

| Theme / mode | 1 | 2 | 3 | 4 | 5 | 6 | muted |
|---|---|---|---|---|---|---|---|
| Alpine light | #2E6DB4 | #C8661A | #00897B | #8E4FA6 | #9A8A10 | #C2457A | #B4BFC8 |
| Alpine dark | #4A8AD4 | #D07A35 | #1A9E8F | #A26BC0 | #A39418 | #D2638F | #4A5763 |
| Zürich light | #2F4BD8 | #C8661A | #00897B | #8E4FA6 | #9A8A10 | #C2457A | #BDB7AA |
| Zürich dark | #7086F0 | #D07A35 | #1A9E8F | #A26BC0 | #A39418 | #D2638F | #55524C |

**Visual rules:**
- **Bars:** flat with square ends. A 2px gap in the chart's surface colour separates adjacent bars and stacked segments; it is drawn as a non-scaling stroke in `--chart-surface`, which defaults to `surface-page`.
- **Lines:** 2px, with round joins. Markers are 8px squares in the series colour, drawn in HTML. An area fill is the series colour at 12% opacity.
- **Grid and type:**
  - Gridlines are `border` hairlines; the zero line is `text-primary`.
  - Ticks and category labels are mono at label size in `text-secondary`, with tabular figures. There are about five ticks, on nice numbers.
- **Legend:** shown top-left with square swatches when there are two or more series.
  - Lines with four or fewer series are also labelled at their ends.
  - Text never takes a series colour.
- **Size:** the plot is `--chart-height` tall (default 16rem) and fills its column.
- **Focus and tooltip:**
  - A focused mark shows the focus ring on its hit area. Hit areas span the whole band, wider than the bar or marker.
  - The tooltip is `surface-raised` with a hairline border. It shows the category and every series' value at that category, the active series in weight 500. It is hidden from assistive technology, because the focused mark's name already says the same.
- **Sparkline:**
  - 6rem × 1.5rem, a 2px line in `chart-1` with an 8px square marker on the last point.
  - It is one image named with a summary: "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3".
- **Forced colours:** marks keep their series colours (`forced-color-adjust: none`); text, gridlines and the tooltip follow system colours.
- **Motion:** none, beyond the tooltip's fade, which reduced motion removes.

**Testing:**
- Token tests: the colour checks above and the role count.
- Unit tests for the geometry: nice ticks, bands, stacking with negatives, line points, hit testing and the Sparkline summary.
- CSS contract tests.
- React tests:
  - classes, `ref` forwarding and `className` merging;
  - mark names, roving focus with arrows, Home and End;
  - the tooltip;
  - the six-series limit;
  - the generated table.
- A docs test proves each committed native HTML example is exactly what the React component renders without interaction.
- Browser tests:
  - keyboard walkthroughs, and the axe sweep and 320px reflow;
  - native-vs-React parity screenshots for a bar chart and a line chart;
  - forced-colours screenshots and visual baselines.

## 17. Settled in Plan 7f

- **Marks in SVG, words in HTML.** One SVG per plot, `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` and non-scaling strokes, so marks stretch with the box and lines stay 2px. Ticks, end labels, gridlines, focus targets and the tooltip are HTML placed by percentage custom properties (`--at`, `--x`, `--y`, `--w`, `--h`), so text never stretches. Axis labels share one grid cell, so an axis is as wide as its longest label. Geometry is pure functions over `d3-scale`; paths are written directly.
- **The native route is generated.** The docs' plain-HTML examples are the React components' output (`htmlSnippet`), and a test keeps them equal (`UPDATE_CHART_HTML=1` rewrites them). Parity screenshots show 0 pixels of difference. A native chart is static: no focus layer, no tooltip; its data table works without script.
- **The palette is checked, not judged.** `checkChartPalette` holds every theme and mode to the OKLCH lightness band, chroma ≥ 0.10, colour-blind ΔE ≥ 8 and normal ΔE ≥ 15 between neighbours, and 3:1 on every surface. The tokens tests run it on every theme, so a palette that fails fails `pnpm verify`; it is exported for themes made outside Raster.
- **One tab stop.** The marks are a `role="group"` named by the caption; each mark is a `role="img"` span named "Series, category: value" with a roving tabindex. Left and Right move across categories, Up and Down across series (swapped for horizontal bars), Home and End go to the ends. Alt, Ctrl and Meta combinations are left to the browser. Escape dismisses the tooltip. The tab stop and the active mark follow their mark by series key and category label when data changes; if the mark goes, the tab stop returns to the first mark. The tooltip is `aria-hidden`; the mark's name already says what it says.
- **Hit areas.** The pointer picks the nearest mark anywhere in the plot. The keyboard focus ring sits on the bar itself (a zero bar still shows a thin ring) and on a 24px square at a line point. It does not span the whole band, as §16 had it, because grouped bars' bands would overlap.
- **Static charts.** `interactive={false}` draws the same figure with no targets, no tabindex and no tooltip, for print and for charts that sit inside another control.
- **Data must be finite numbers.** Any other value in a series key throws a `TypeError` naming the key; Sparkline does the same. There are no gaps in lines.
- **End labels** go on line charts of two to four series; one series is named by its caption, five or more by the legend. Without end labels the frame has no third column.
- **Narrow charts.** Below 32rem the frame hides minor category labels, and on horizontal bars every other value label, by container query.
- **The zero line sits on the bars' base:** it is nudged up 1px in vertical charts, so positive bars meet it without a gap. Bars below zero show a 1px gap; no docs example has negative values.
- **Known:** screen-reader announcement of the marks has not been checked by hand with VoiceOver or NVDA. Charts lay out left to right in every writing direction (`direction: ltr` on the frame), since their SVG does not mirror.
