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
