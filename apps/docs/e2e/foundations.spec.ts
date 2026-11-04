import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForIslands } from "./islands";

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

test.describe("colour", () => {
  test("shows four contrast tables of 32 pairings, all passing", async ({ page }) => {
    await page.goto("/foundations/colour/");
    const tables = page.getByRole("table", { name: /contrast$/ });
    await expect(tables).toHaveCount(4);
    // 7 text roles × 3 surfaces + border-strong × 3 surfaces + 4 statuses × (fill + tint).
    for (let i = 0; i < 4; i++) await expect(tables.nth(i).locator("tbody tr")).toHaveCount(32);
    await expect(page.locator("td", { hasText: "Fails" })).toHaveCount(0);
  });

  test("swatches follow the current theme", async ({ page }) => {
    await page.goto("/foundations/colour/");
    const accent = page.locator('[data-role="accent"] .docs-swatch');
    const before = await accent.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Zürich" }).click();
    await expect.poll(() => accent.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  });
});

test.describe("motion", () => {
  test("the overlay demo can be replayed", async ({ page }) => {
    await page.goto("/foundations/motion/");
    await waitForIslands(page);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Open dialog" }).click();
      await expect(page.getByRole("dialog", { name: "Overlay motion" })).toBeVisible();
      if (i === 0) {
        // Outside a ThemeRegion the dialog portals straight into <body>.
        const results = await new AxeBuilder({ page })
          .include(".sw-modal-overlay")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => v.id)).toEqual([]);
      }
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("reveals run by default and stop when motion is reduced", async ({ page }) => {
    await page.goto("/foundations/motion/");
    const card = page.locator(".sw-reveal[data-stagger] > *").first();
    const animation = () => card.evaluate((el) => getComputedStyle(el).animationName);
    await expect.poll(animation).toBe("sw-reveal-in");
    await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Reduced" }).click();
    await expect.poll(animation).toBe("none");
  });
});
