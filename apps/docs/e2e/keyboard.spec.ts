import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { example } from "./examples";
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
  await expect(tip).toHaveText("Duplicate the selected project");
  await page.keyboard.press("Escape");
  await expect(tip).toHaveCount(0);
});

test("toast: announced with its tone, reached with F6 and dismissed from the keyboard", async ({ page }) => {
  await page.goto("/components/toast/");
  await waitForIslands(page);
  // The error toast has no timeout, so it cannot expire mid-test.
  const trigger = page.getByRole("button", { name: "Simulate an error" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const toast = page.locator(".sw-toast");
  await expect(toast).toHaveCount(1);
  await expect(toast).toContainText("Error: Connection lost");
  await expectNoViolations(page, ".sw-toast-region");

  await page.keyboard.press("F6");
  const region = page.locator(".sw-toast-region");
  await expect.poll(() => region.evaluate((r) => r.contains(document.activeElement))).toBe(true);
  const dismiss = toast.getByRole("button", { name: "Dismiss" });
  for (let i = 0; i < 4 && !(await dismiss.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(dismiss).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toast).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("tabs: one tab stop, arrows select, disabled tabs are skipped", async ({ page }) => {
  await page.goto("/components/tabs/");
  await waitForIslands(page);
  const list = page.getByRole("tablist", { name: "Foundations" });
  await tabTo(page, list.getByRole("tab", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Type" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Type" })).toContainText("Geist");
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Colour" })).toBeFocused();
  // The next tab, Motion, is disabled: focus must skip it.
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Motion" })).not.toBeFocused();
  await expect(list.getByRole("tab", { name: "Grid" })).toBeFocused();
  await expect(list.getByRole("tab", { name: "Grid" })).toHaveAttribute("aria-selected", "true");
  // Tab leaves the list for the selected panel.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel", { name: "Grid" })).toBeFocused();
});

/** True when focus sits outside every open dialog (focus on <body> counts as inside). */
const focusEscapedDialog = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return false;
    const open = [...document.querySelectorAll("dialog[open], [role=dialog]")];
    return !open.some((d) => d.contains(active));
  });

/** The expanded state Chromium's accessibility tree reports for the element `selector` matches. */
async function browserExpanded(page: import("@playwright/test").Page, selector: string): Promise<boolean | undefined> {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
    const expanded = nodes[0]?.properties?.find((p) => p.name === "expanded");
    return expanded ? Boolean(expanded.value.value) : undefined;
  } finally {
    await cdp.detach();
  }
}

test("compact menu, native (docs header at 360px): opens, holds focus, Escape returns it", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const menuButton = page.locator("body > .sw-header").getByRole("button", { name: "Menu" });
  await tabTo(page, menuButton);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await focusEscapedDialog(page)).toBe(false);
  }
  await expectNoViolations(page, "dialog.sw-header-menu[open]");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("compact menu, React: opens, holds focus, Escape returns it", async ({ page }) => {
  await page.goto("/components/header/");
  await waitForIslands(page);
  const menuButton = example(page, "Compact menu").getByRole("button", { name: "Menu" });
  await tabTo(page, menuButton);
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await expect.poll(() => menu.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await focusEscapedDialog(page)).toBe(false);
  }
  await expectNoViolations(page, ".sw-header-menu-overlay");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(menuButton).toBeFocused();
});

test("compact menu, React: a link in the menu navigates even with reduced motion", async ({ page }) => {
  // With no exit animation the menu unmounts at once; closing during the click would remove the
  // link before the browser follows it.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/header/");
  await waitForIslands(page);
  await example(page, "Compact menu").getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Templates" }).click();
  await expect(page).toHaveURL(/\/templates\/$/);
});

test("disclosure, React: Enter and Space toggle; the accordion keeps one row open", async ({ page }) => {
  await page.goto("/components/disclosure/");
  await waitForIslands(page);
  const faq = example(page, "Questions");
  const cost = faq.getByRole("button", { name: "What does a project cost?" });
  const time = faq.getByRole("button", { name: "How long does it take?" });
  await tabTo(page, cost);
  await page.keyboard.press("Enter");
  await expect(cost).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(time).toBeFocused();
  await page.keyboard.press("Space");
  await expect(time).toHaveAttribute("aria-expanded", "true");
  await expect(cost).toHaveAttribute("aria-expanded", "false");
});

test("disclosure, native: Enter and Space toggle; a shared name keeps one row open", async ({ page }) => {
  await page.goto("/components/disclosure/");
  const faq = example(page, "Questions without React");
  const rows = faq.locator("details");
  const first = faq.locator("summary").nth(0);
  await tabTo(page, first);
  await page.keyboard.press("Enter");
  await expect(rows.nth(0)).toHaveAttribute("open", "");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(rows.nth(1)).toHaveAttribute("open", "");
  await expect(faq.locator("details[open]")).toHaveCount(1);
});

test("popover, React: focus moves in, Escape returns it to the trigger", async ({ page }) => {
  await page.goto("/components/popover/");
  await waitForIslands(page);
  const trigger = example(page, "Grid units").getByRole("button", { name: "Grid units" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Grid units" });
  await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await expectNoViolations(page, ".sw-popover-content:not(#grid-units)");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("popover, native: Tab moves from the button into the popover, Escape returns focus", async ({ page }) => {
  await page.goto("/components/popover/");
  const trigger = example(page, "Grid units without React").getByRole("button", { name: "Grid units" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const popover = page.locator("#grid-units");
  await expect(popover).toBeVisible();
  // Focus stays on the button when a native popover opens, so its panel is a named group, not a dialog.
  await expect(popover.getByRole("group", { name: "Grid units" })).toBeVisible();
  await expect(popover.getByRole("dialog")).toHaveCount(0);
  // popovertarget exposes the expanded state in the browser's accessibility tree, not as a DOM
  // attribute, and getByRole reads only aria-expanded, so ask Chromium's tree directly.
  await expect.poll(() => browserExpanded(page, '[popovertarget="grid-units"]')).toBe(true);
  await page.keyboard.press("Tab");
  await expect(popover.getByRole("link", { name: "Read about the grid" })).toBeFocused();
  await expectNoViolations(page, "#grid-units");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const route of ["React", "native"] as const) {
  test(`drawer, ${route}: opens as a modal, holds focus, Escape returns it`, async ({ page }) => {
    await page.goto("/components/drawer/");
    await waitForIslands(page);
    const title = route === "React" ? "Project details" : "Project details without React";
    const trigger = example(page, title).getByRole("button", { name: "Project details" });
    await tabTo(page, trigger);
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog", { name: "Linie 7" });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      expect(await focusEscapedDialog(page)).toBe(false);
    }
    await expectNoViolations(page, route === "React" ? ".sw-drawer-overlay" : "dialog.sw-drawer[open]");
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

for (const route of ["React", "native"] as const) {
  test(`side nav, ${route}: a group toggles from the keyboard`, async ({ page }) => {
    await page.goto("/components/side-nav/");
    await waitForIslands(page);
    const nav = example(page, route === "React" ? "Documentation sections" : "Documentation sections without React");
    const toggle = route === "React" ? nav.getByRole("button", { name: "Components" }) : nav.locator("summary", { hasText: "Components" });
    await tabTo(page, toggle);
    await page.keyboard.press("Enter");
    await expect(nav.getByRole("link", { name: "All components" })).toBeVisible();
  });
}

test("tag group, React: arrows move between chips and Space toggles", async ({ page }) => {
  await page.goto("/components/tag-group/");
  await waitForIslands(page);
  const group = example(page, "Disciplines");
  const identity = group.getByRole("row", { name: "Identity" });
  const wayfinding = group.getByRole("row", { name: "Wayfinding" });
  await tabTo(page, identity);
  await page.keyboard.press("ArrowRight");
  await expect(wayfinding).toBeFocused();
  await page.keyboard.press("Space");
  await expect(wayfinding).toHaveAttribute("aria-selected", "true");
  await expect(identity).toHaveAttribute("aria-selected", "true");
});

test("tag group, native: Tab moves between checkboxes and Space toggles", async ({ page }) => {
  await page.goto("/components/tag-group/");
  const group = example(page, "Disciplines without React");
  const identity = group.getByRole("checkbox", { name: "Identity" });
  const wayfinding = group.getByRole("checkbox", { name: "Wayfinding" });
  await tabTo(page, identity);
  await page.keyboard.press("Space");
  await expect(identity).not.toBeChecked();
  await page.keyboard.press("Tab");
  await expect(wayfinding).toBeFocused();
  await page.keyboard.press("Space");
  await expect(wayfinding).toBeChecked();
});

test("segmented control, React: arrows move and Space selects; one segment stays selected", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  await waitForIslands(page);
  const view = example(page, "View");
  await tabTo(page, view.getByRole("radio", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(view.getByRole("radio", { name: "List" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(view.getByRole("radio", { name: "List" })).toBeChecked();
  await expect(view.getByRole("radio", { name: "Grid" })).not.toBeChecked();
});

test("segmented control, native: arrows move the selection", async ({ page }) => {
  await page.goto("/components/segmented-control/");
  const view = example(page, "View without React");
  await tabTo(page, view.getByRole("radio", { name: "Grid" }));
  await page.keyboard.press("ArrowRight");
  await expect(view.getByRole("radio", { name: "List" })).toBeFocused();
  await expect(view.getByRole("radio", { name: "List" })).toBeChecked();
});

for (const route of ["React", "native"] as const) {
  test(`search field, ${route}: Escape clears; the clear button clears and returns focus`, async ({ page }) => {
    await page.goto("/components/search-field/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Project search" : "Project search without React");
    const input = field.getByRole("searchbox", { name: "Search projects" });
    const clear = field.getByRole("button", { name: "Clear search" });
    await tabTo(page, input);
    await expect(clear).toBeHidden();
    await page.keyboard.type("Linie");
    await expect(clear).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await page.keyboard.type("Atlas");
    await clear.click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  });

  test(`number field, ${route}: arrow keys step the value`, async ({ page }) => {
    await page.goto("/components/number-field/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Copies" : "Copies without React");
    const input = route === "React" ? field.getByRole("textbox", { name: "Copies" }) : field.getByRole("spinbutton", { name: "Copies" });
    await tabTo(page, input);
    await page.keyboard.press("ArrowUp");
    await expect(input).toHaveValue("3");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveValue("1");
  });

  test(`slider, ${route}: arrows step, Home and End reach the limits, the value is shown`, async ({ page }) => {
    await page.goto("/components/slider/");
    await waitForIslands(page);
    const field = example(page, route === "React" ? "Gutter" : "Gutter without React");
    const slider = field.getByRole("slider", { name: "Gutter (px)" });
    const output = field.locator(".sw-slider-output");
    // The slider announces its own value; a live output would announce it a second time.
    await expect(output).toHaveAttribute("aria-live", "off");
    await tabTo(page, slider);
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("25");
    await expect(output).toHaveText("25");
    await page.keyboard.press("End");
    await expect(output).toHaveText("32");
    await page.keyboard.press("Home");
    await expect(output).toHaveText("16");
  });
}

test("banner: Dismiss hides it and moves focus to the main content", async ({ page }) => {
  await page.goto("/components/banner/");
  await waitForIslands(page);
  const banner = example(page, "Dismissable banner");
  const dismiss = banner.getByRole("button", { name: "Dismiss" });
  await tabTo(page, dismiss);
  await page.keyboard.press("Enter");
  await expect(banner.locator(".sw-banner")).toHaveCount(0);
  await expect(page.locator("main#main")).toBeFocused();
});

test("combobox, React: typing filters, arrows and Enter choose, Escape closes", async ({ page }) => {
  await page.goto("/components/combobox/");
  await waitForIslands(page);
  const input = example(page, "City").getByRole("combobox", { name: "City" });
  await tabTo(page, input);
  await page.keyboard.type("Lu");
  const list = page.getByRole("listbox");
  await expect(list.getByRole("option")).toHaveText(["Lucerne", "Lugano"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("Lucerne");
  await expect(list).toBeHidden();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(input).toBeFocused();
});

test("combobox, native: a labelled input wired to its datalist that takes typed text", async ({ page }) => {
  await page.goto("/components/combobox/");
  const field = example(page, "City without React");
  const input = field.getByRole("combobox", { name: "City" });
  await expect(input).toHaveAttribute("list", "cities");
  await expect(field.locator("datalist#cities option")).toHaveCount(10);
  // The suggestion list itself is browser UI, outside the page, so it is not driven here.
  await tabTo(page, input);
  await page.keyboard.type("Lugano");
  await expect(input).toHaveValue("Lugano");
});

test("date picker, React: arrows step a segment; the calendar opens, moves by day and month, and chooses", async ({ page }) => {
  await page.goto("/components/date-picker/");
  await waitForIslands(page);
  const group = example(page, "Delivery date").getByRole("group", { name: "Delivery date" });
  const segments = group.getByRole("spinbutton");
  await tabTo(page, segments.first());
  await page.keyboard.press("ArrowUp");
  await expect(segments.first()).toHaveText("4");
  await page.keyboard.press("ArrowDown");
  await expect(segments.first()).toHaveText("3");
  const button = group.getByRole("button", { name: /Calendar/ });
  await tabTo(page, button);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText("March 2026");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageDown");
  await expect(dialog.getByRole("heading")).toHaveText("April 2026");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(segments.first()).toHaveText("4");
  await expect(segments.nth(1)).toHaveText("13");
  await expect(button).toBeFocused();
});

test("date picker, native: a labelled date input that takes a date within its limits", async ({ page }) => {
  await page.goto("/components/date-picker/");
  const input = example(page, "Delivery date without React").getByLabel("Delivery date", { exact: true });
  await expect(input).toHaveAttribute("type", "date");
  await expect(input).toHaveAttribute("min", "2026-03-02");
  await input.fill("2026-03-20");
  await expect(input).toHaveValue("2026-03-20");
});

test("date range picker, React: Enter starts the range, a second Enter ends it", async ({ page }) => {
  await page.goto("/components/date-range-picker/");
  await waitForIslands(page);
  const group = example(page, "Project period").getByRole("group", { name: "Project period" });
  const button = group.getByRole("button", { name: /Calendar/ });
  await tabTo(page, button);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Focus opens on the range's start, 9 March. Enter starts a new range there, and React Aria then
  // moves focus on by a day (useCalendarCell: "auto-advance the focused date by one if using
  // keyboard"), so one ArrowRight reaches 11 March.
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", /March 9, 2026/);
  await page.keyboard.press("Enter");
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", /March 10, 2026/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  const segments = group.getByRole("spinbutton");
  await expect(segments.nth(1)).toHaveText("9");
  await expect(segments.nth(4)).toHaveText("11");
});

test("date range picker, native: From and To are labelled inside the named group", async ({ page }) => {
  await page.goto("/components/date-range-picker/");
  const group = example(page, "Project period without React").getByRole("group", { name: "Project period" });
  await expect(group.getByLabel("From")).toHaveValue("2026-03-09");
  await expect(group.getByLabel("To")).toHaveValue("2026-03-13");
});

test("calendar: arrows move by day; an unavailable weekend day cannot be chosen", async ({ page }) => {
  await page.goto("/components/calendar/");
  await waitForIslands(page);
  const calendar = example(page, "Delivery day");
  const selected = calendar.locator(".sw-calendar-cell[data-selected]");
  await expect(selected).toHaveText("12");
  await selected.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(selected).toHaveText("13");
  await page.keyboard.press("ArrowRight");
  await expect(calendar.locator(".sw-calendar-cell[data-focused]")).toHaveAttribute("data-unavailable", "true");
  await page.keyboard.press("Enter");
  await expect(selected).toHaveText("13");
});

test("file upload, React: Choose files from the keyboard adds files; Remove moves focus on", async ({ page }) => {
  await page.goto("/components/file-upload/");
  await waitForIslands(page);
  const field = example(page, "Proofs");
  const choose = field.getByRole("button", { name: "Choose files Proofs" });
  await tabTo(page, choose);
  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooser).setFiles({ name: "index.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
  await expect(field.locator(".sw-file-name")).toHaveText(["cover.pdf", "spread-04.png", "index.pdf"]);
  await field.getByRole("button", { name: "Remove cover.pdf" }).focus();
  await page.keyboard.press("Enter");
  await expect(field.getByRole("button", { name: "Remove spread-04.png" })).toBeFocused();
});

test("file upload, React: a dropped file is added; a wrong type is refused with a message", async ({ page }, testInfo) => {
  await page.goto("/components/file-upload/");
  await waitForIslands(page);
  const field = example(page, "Proofs");
  // A real drop of files from disk, through Chromium's own drag pipeline. A DataTransfer built in
  // the page will not do: React Aria reads dropped files with webkitGetAsEntry(), which returns
  // null for script-made items, so they are skipped.
  const plan = testInfo.outputPath("plan.pdf");
  const notes = testInfo.outputPath("notes.txt");
  await writeFile(plan, "%PDF-1.7");
  await writeFile(notes, "notes");
  const box = await field.locator(".sw-file-drop").boundingBox();
  if (!box) throw new Error("The drop zone has no box");
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const data = { items: [], files: [plan, notes], dragOperationsMask: 1 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchDragEvent", { type: "dragEnter", ...at, data });
  await cdp.send("Input.dispatchDragEvent", { type: "dragOver", ...at, data });
  await expect(field.locator(".sw-file-drop-text")).toHaveText("Drop to add");
  await cdp.send("Input.dispatchDragEvent", { type: "drop", ...at, data });
  await expect(field.locator(".sw-file-name").last()).toHaveText("plan.pdf");
  await expect(field.getByRole("alert")).toHaveText("notes.txt is not an accepted type.");
});

test("file upload, native: the labelled file input takes files", async ({ page }) => {
  await page.goto("/components/file-upload/");
  const input = example(page, "Proofs without React").getByLabel("Proofs", { exact: true });
  await input.setInputFiles({ name: "index.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
  await expect(input).toHaveJSProperty("files.length", 1);
});

test("data grid, React: arrows move, Space selects a row, Enter on a header sorts", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Projects").getByRole("grid", { name: "Studio projects" });
  // React Aria enters the grid on the selected row (Linie 7, sixth by name), not the first.
  const linie = grid.getByRole("row", { name: /^Linie 7/ });
  await tabTo(page, linie);
  await page.keyboard.press("ArrowDown");
  const next = grid.getByRole("row", { name: /^Parkleitsystem/ });
  await expect(next).toBeFocused();
  await page.keyboard.press("Space");
  await expect(next).toHaveAttribute("aria-selected", "true");
  await expect(linie).toHaveAttribute("aria-selected", "true");
  // Into the row: its checkbox, then Project, Client, Discipline, Year; up past six rows to the header.
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  await expect(next.getByRole("gridcell", { name: "2023" })).toBeFocused();
  for (let i = 0; i < 7; i++) await page.keyboard.press("ArrowUp");
  const year = grid.getByRole("columnheader", { name: "Year" });
  await expect(year.locator(".sw-data-grid-label")).toBeFocused();
  await expect(year).toHaveAttribute("aria-sort", "none");
  await page.keyboard.press("Enter");
  await expect(year).toHaveAttribute("aria-sort", "ascending");
  await expect(grid.getByRole("columnheader", { name: "Project" })).toHaveAttribute("aria-sort", "none");
  await expect(grid.getByRole("rowheader").first()).toHaveText("Seebad");
  await page.keyboard.press("Enter");
  await expect(year).toHaveAttribute("aria-sort", "descending");
  await expect(grid.getByRole("rowheader").first()).toHaveText("Plakatsammlung");
});

// A header's focus goes to its first focusable child (React Aria's focusMode "child"). DataGridColumn
// makes the label that child, so Enter sorts even when the column also holds a resize handle.
test("data grid, React: Enter on a sortable, resizable header (Project) sorts it", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Projects").getByRole("grid", { name: "Studio projects" });
  await tabTo(page, grid.getByRole("row", { name: /^Linie 7/ }));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowUp");
  const project = grid.getByRole("columnheader", { name: "Project" });
  await expect(project.locator(".sw-data-grid-label")).toBeFocused();
  await expect(project).toHaveAttribute("aria-sort", "ascending");
  await page.keyboard.press("Enter");
  await expect(project).toHaveAttribute("aria-sort", "descending", { timeout: 3000 });
});

test("data grid, React: a column resizes from the keyboard", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Projects").getByRole("grid", { name: "Studio projects" });
  const client = grid.getByRole("columnheader", { name: "Client" });
  const before = (await client.boundingBox())?.width ?? 0;
  await tabTo(page, grid.getByRole("row", { name: /^Linie 7/ }));
  // The checkbox, Project, Client; then up past five rows (Linie 7 is sixth) to the header.
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowUp");
  // Focus lands on the header's label; ArrowRight moves on to its resize handle's hidden range input.
  await expect(client.locator(".sw-data-grid-label")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const handle = client.locator(".sw-data-grid-resizer input");
  await expect(handle).toBeFocused();
  // Enter starts resizing, each ArrowRight adds 10px, Enter ends it.
  await page.keyboard.press("Enter");
  await expect(client).toHaveAttribute("data-resizing", "true");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(client).not.toHaveAttribute("data-resizing", "true");
  const after = (await client.boundingBox())?.width ?? 0;
  expect(after).toBeGreaterThan(before);
});

test("data grid, React: a virtualised grid draws only the rows in view", async ({ page }) => {
  await page.goto("/components/data-grid/");
  await waitForIslands(page);
  const grid = example(page, "Archive").getByRole("grid", { name: "Archive, 5,000 entries" });
  await expect(grid).toHaveAttribute("aria-rowcount", "5001");
  const drawn = await grid.getByRole("row").count();
  expect(drawn).toBeGreaterThan(5);
  expect(drawn).toBeLessThan(60);
});

test("data grid, native: sort links carry aria-sort; Select all checks every row and shows a partial selection", async ({ page }) => {
  await page.goto("/components/data-grid/");
  const grid = example(page, "Projects without React").getByRole("table", { name: "Studio projects" });
  await expect(grid.getByRole("columnheader", { name: /Project/ })).toHaveAttribute("aria-sort", "ascending");
  await expect(grid.getByRole("link", { name: /^Project ?, sort descending$/ })).toHaveAttribute("href", "?sort=name&dir=desc");
  const all = grid.getByRole("checkbox", { name: "Select all projects" });
  const rows = grid.locator('tbody input[type="checkbox"]');
  await all.check();
  for (const box of await rows.all()) await expect(box).toBeChecked();
  await rows.first().uncheck();
  await expect(all).not.toBeChecked();
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
});
