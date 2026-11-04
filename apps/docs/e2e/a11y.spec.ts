import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { builtPages } from "./pages";
import { COMBOS, useSettings } from "./settings";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// Best-practice rules that WCAG tags miss but that matter for this site's structure.
const STRUCTURE_RULES = ["heading-order", "landmark-unique", "page-has-heading-one"];

const describe = (violations: { id: string; nodes: { target: unknown[] }[] }[]) =>
  violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);

for (const path of builtPages()) {
  test.describe(`page ${path}`, () => {
    test("has a title, one h1, a focusable main landmark and a sound outline", async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/Raster/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toHaveAttribute("tabindex", "-1");
      await waitForIslands(page);
      const results = await new AxeBuilder({ page }).withRules(STRUCTURE_RULES).analyze();
      expect(describe(results.violations)).toEqual([]);
    });

    test("reflows at 320px without horizontal scrolling", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    for (const combo of COMBOS) {
      test(`has no axe violations in ${combo.theme} ${combo.mode}`, async ({ page }) => {
        // Reduced motion: scroll reveals start transparent, which axe would read as low contrast.
        await page.emulateMedia({ reducedMotion: "reduce" });
        await useSettings(page, { ...combo, motion: "reduce" });
        await page.goto(path);
        const html = page.locator("html");
        await expect(html).toHaveAttribute("data-mode", combo.mode);
        if (combo.theme === "alpine") await expect(html).not.toHaveAttribute("data-theme");
        else await expect(html).toHaveAttribute("data-theme", combo.theme);
        await waitForIslands(page);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(describe(results.violations)).toEqual([]);
      });
    }
  });
}
