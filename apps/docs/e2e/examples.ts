import type { Locator, Page } from "@playwright/test";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The docs example figure whose caption is exactly `title`. Only the example's own caption
 * counts: a chart inside an example is itself a figure whose figcaption can repeat the title.
 */
export function example(page: Page, title: string): Locator {
  return page.locator("figure.docs-example").filter({
    has: page.locator("figcaption.docs-example-title", { hasText: new RegExp(`^${escape(title)}$`) }),
  });
}

/** The rendered demo area of that example. */
export function demo(page: Page, title: string): Locator {
  return example(page, title).locator(".docs-example-demo");
}
