import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";

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

test("dashboard: figures, a project table with status words, and tabbed activity", async ({ page }) => {
  await page.goto("/templates/dashboard/");
  await waitForIslands(page);
  await expect(page.locator("h1")).toHaveText("Studio dashboard");
  await expect(page.locator(".docs-stats li")).toHaveCount(4);
  const table = page.getByRole("table", { name: "Projects" });
  await expect(table.locator("tbody tr")).toHaveCount(4);
  await expect(table.locator(".sw-tag")).toHaveText(["On track", "In review", "At risk", "Blocked"]);
  const tabs = page.getByRole("tablist", { name: "Activity" });
  await tabs.getByRole("tab", { name: "Last week" }).click();
  await expect(page.getByRole("tabpanel", { name: "Last week" })).toBeVisible();
});
