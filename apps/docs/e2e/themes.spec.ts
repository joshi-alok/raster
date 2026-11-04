import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
  const results = await new AxeBuilder({ page })
    .include(".sw-portal-host")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
