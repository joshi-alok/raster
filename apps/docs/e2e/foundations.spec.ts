import { expect, test } from "@playwright/test";

const columnCount = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

test.describe("grid and spacing", () => {
  test("a 360px frame shows 4 columns and a 720px frame shows 8", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/foundations/grid/");
    expect(await columnCount(page, '[data-frame="360"] > .sw-grid')).toBe(4);
    expect(await columnCount(page, '[data-frame="720"] > .sw-grid')).toBe(8);
  });

  test("lists the nine spacing steps", async ({ page }) => {
    await page.goto("/foundations/grid/");
    await expect(page.getByRole("table", { name: "Spacing scale" }).locator("tbody tr")).toHaveCount(9);
  });

  test("marks the current foundation in the local navigation", async ({ page }) => {
    await page.goto("/foundations/grid/");
    const nav = page.getByRole("navigation", { name: "Foundations" });
    await expect(nav.getByRole("link", { name: "Grid and spacing" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("type", () => {
  test("shows eight specimens; the h1 step is 42px at 1440 and 33px at 360", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/foundations/type/");
    await expect(page.locator(".docs-specimen")).toHaveCount(8);
    const h1 = page.locator(".docs-specimen .sw-type-h1");
    // The fluid clamp() resolves to 41.9995px at 1440px, so compare to the nearest pixel.
    const fontSize = () => h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(Math.round(await fontSize())).toBe(42);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(async () => Math.round(await fontSize())).toBe(33);
  });
});
