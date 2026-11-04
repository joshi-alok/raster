import { expect, test } from "@playwright/test";
import { builtPages } from "./pages";

const componentPages = builtPages().filter((path) => /^\/components\/[^/]+\/$/.test(path));

test("the index links to every component page", async ({ page }) => {
  await page.goto("/components/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveCount(componentPages.length);
});

for (const path of componentPages) {
  test(`${path} has examples with code, props, accessibility notes and breadcrumbs`, async ({ page }) => {
    await page.goto(path);
    const title = (await page.locator("h1").textContent())?.trim() ?? "";
    const crumbs = page.getByRole("navigation", { name: "Breadcrumbs" });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(title);

    const examples = page.locator("figure.docs-example");
    expect(await examples.count()).toBeGreaterThan(0);
    for (const example of await examples.all()) {
      await expect(example.getByRole("region", { name: /^React code: / })).toBeVisible();
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
