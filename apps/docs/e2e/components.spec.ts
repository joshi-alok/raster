import { expect, test } from "@playwright/test";
import { builtPages } from "./pages";

const componentPages = builtPages().filter((path) => /^\/components\/[^/]+\/$/.test(path));

test("the index links to every component page", async ({ page }) => {
  await page.goto("/components/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveCount(componentPages.length);
});

for (const path of componentPages) {
  test(`${path} has examples with code (React, or HTML for native examples), props, accessibility notes and breadcrumbs`, async ({ page }) => {
    await page.goto(path);
    const title = (await page.locator("h1").textContent())?.trim() ?? "";
    const crumbs = page.getByRole("navigation", { name: "Breadcrumbs", exact: true });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(title);
    await expect(page.getByRole("heading", { level: 2, name: "Usage" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Use it to" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Avoid it for" }).getByRole("listitem").first()).toBeVisible();

    const examples = page.locator("figure.docs-example");
    expect(await examples.count()).toBeGreaterThan(0);
    for (const example of await examples.all()) {
      await expect(example.getByRole("region", { name: /^(React|HTML) code: / }).first()).toBeVisible();
    }

    await expect(page.getByRole("heading", { level: 2, name: "Props" })).toBeVisible();
    await expect(page.getByRole("table", { name: `${title} props` }).locator("tbody tr").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Accessibility" })).toBeVisible();
  });
}

test("static examples show the HTML they render", async ({ page }) => {
  await page.goto("/components/button/");
  const html = page.getByRole("region", { name: "HTML code: Variants" });
  await expect(html).toContainText('<button data-variant="primary" class="sw-button" type="button">Save</button>');
  await expect(html).not.toContainText("react-aria");
});

test("an avoid item links to the component to use instead", async ({ page }) => {
  await page.goto("/components/button/");
  await page.getByRole("link", { name: "Use Link instead." }).click();
  await expect(page).toHaveURL(/\/components\/link\/$/);
});
