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
