import { expect, type Page, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { builtPages } from "./pages";
import { COMBOS, useSettings } from "./settings";

const WIDTHS = [360, 768, 1440] as const;
const pages = builtPages();
const componentPages = pages.filter((p) => /^\/components\/[^/]+\/$/.test(p));
const templatePages = pages.filter((p) => /^\/templates\/[^/]+\/$/.test(p));
const patternPages = pages.filter((p) => /^\/patterns\/[^/]+\/$/.test(p));
/** Long reads: the first screen plus each figure, not a full-page capture (10,000px of text is ~1.5 MB a shot). */
const LONG_TEMPLATES = new Set(["/templates/manifesto/"]);
const slug = (path: string) => path.split("/").filter(Boolean).at(-1) ?? "home";

async function open(page: Page, path: string, combo: (typeof COMBOS)[number], width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await useSettings(page, { ...combo, motion: "reduce" });
  await page.goto(path);
  await waitForIslands(page);
  await page.evaluate(() => document.fonts.ready);
}

for (const combo of COMBOS) {
  for (const width of WIDTHS) {
    const variant = `${combo.theme}-${combo.mode}-${width}`;

    test.describe(variant, () => {
      for (const path of componentPages) {
        test(`examples on ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          // Code is text and covered by unit tests; these screenshots cover what renders.
          await page.addStyleTag({ content: ".docs-example-code { display: none !important; }" });
          const examples = page.locator("figure.docs-example");
          const count = await examples.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(examples.nth(i)).toHaveScreenshot(`${slug(path)}-${i + 1}-${variant}.png`);
          }
        });
      }

      for (const path of patternPages) {
        test(`pattern ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          // Pattern examples can be nearly a screen tall. Below the sticky header, the bottom of a
          // 900px-high viewport would cut one off, so give them room; layout depends only on width.
          await page.setViewportSize({ width, height: 1600 });
          await page.addStyleTag({ content: ".docs-example-code { display: none !important; }" });
          const examples = page.locator("figure.docs-example");
          const count = await examples.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(examples.nth(i)).toHaveScreenshot(`pattern-${slug(path)}-${i + 1}-${variant}.png`);
          }
        });
      }

      for (const path of templatePages) {
        test(`template ${slug(path)}`, async ({ page }) => {
          await open(page, path, combo, width);
          if (!LONG_TEMPLATES.has(path)) {
            await expect(page).toHaveScreenshot(`template-${slug(path)}-${variant}.png`, { fullPage: true });
            return;
          }
          await expect(page).toHaveScreenshot(`template-${slug(path)}-${variant}.png`);
          const figures = page.locator("main figure");
          const count = await figures.count();
          expect(count).toBeGreaterThan(0);
          for (let i = 0; i < count; i++) {
            await expect(figures.nth(i)).toHaveScreenshot(`template-${slug(path)}-figure-${i + 1}-${variant}.png`);
          }
        });
      }
    });
  }
}
