import { expect, type Page } from "@playwright/test";

/** Waits until every React island has hydrated (Astro removes the ssr attribute on hydration). */
export async function waitForIslands(page: Page): Promise<void> {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}
