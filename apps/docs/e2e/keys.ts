import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

/** Presses Tab from the top of the page until the target has focus, like a keyboard user would. */
export async function tabTo(page: Page, target: Locator, maxPresses = 80): Promise<void> {
  await page.locator("body").evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Could not reach the target with ${maxPresses} Tab presses`);
}

/** Runs WCAG axe rules on the element (an open overlay). */
export async function expectNoViolations(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
}
