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
