import { expect, test } from "@playwright/test";

test("the templates index links to the three templates", async ({ page }) => {
  await page.goto("/templates/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveText(["Editorial article", "Dashboard", "Landing page"]);
});

test("article: a hanging grid with numbered sections and a captioned figure", async ({ page }) => {
  await page.goto("/templates/article/");
  await expect(page.locator("h1")).toHaveText("Form follows grid");
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-layout", "hanging");
  await expect(page.locator("main h2")).toHaveCount(3);
  await expect(page.locator("main figure figcaption")).toContainText("Figure 1");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Templates" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});
