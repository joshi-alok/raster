import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";
import { builtPages } from "./pages";

const patternPages = builtPages().filter((path) => /^\/patterns\/[^/]+\/$/.test(path));

test("the index links to the five patterns, in order", async ({ page }) => {
  await page.goto("/patterns/");
  await expect(page.locator("main .docs-component-list a")).toHaveText([
    "Forms",
    "Navigation",
    "Data",
    "Empty states",
    "Errors and feedback",
  ]);
  expect(patternPages).toHaveLength(5);
});

for (const path of patternPages) {
  test(`${path} has breadcrumbs, rules, examples with code, and links to its components`, async ({ page }) => {
    await page.goto(path);
    const title = (await page.locator("h1").textContent())?.trim() ?? "";
    const crumbs = page.getByRole("navigation", { name: "Breadcrumbs", exact: true });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(title);
    await expect(page.getByRole("heading", { level: 2, name: "Rules" })).toBeVisible();
    expect(await page.locator("ol.docs-rules > li").count()).toBeGreaterThan(2);
    const examples = page.locator("figure.docs-example");
    expect(await examples.count()).toBeGreaterThan(0);
    for (const example of await examples.all()) {
      await expect(example.getByRole("region", { name: /^React code: / })).toBeVisible();
    }
    const links = page.locator("main .docs-component-list a");
    expect(await links.count()).toBeGreaterThan(2);
    for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      expect(builtPages()).toContain(href);
    }
  });
}

test("the enquiry form sums up its errors, links to each field, and then sends", async ({ page }) => {
  await page.goto("/patterns/forms/");
  await waitForIslands(page);
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send enquiry" }) });
  await form.getByRole("button", { name: "Send enquiry" }).click();

  const summary = form.locator(".docs-form-status");
  await expect(summary).toBeFocused();
  await expect(summary).toContainText("Fix 2 fields to send the enquiry");
  await expect(form.getByRole("textbox", { name: "Name" })).toHaveAttribute("aria-invalid", "true");

  await summary.getByRole("link", { name: "Enter an email address such as name@studio.ch." }).click();
  await expect(form.getByRole("textbox", { name: "Email" })).toBeFocused();

  await form.getByRole("textbox", { name: "Name" }).fill("Anna Keller");
  await form.getByRole("textbox", { name: "Email" }).fill("anna@studio.ch");
  await form.getByRole("button", { name: "Send enquiry" }).click();
  await expect(summary).toContainText("Enquiry sent");
  await expect(summary).toBeFocused();
});

test("no matches offers to clear the search, which brings the list back", async ({ page }) => {
  await page.goto("/patterns/empty-states/");
  await waitForIslands(page);
  const example = page.locator("figure.docs-example").filter({ hasText: "No matches" });
  await expect(example.getByRole("heading", { name: 'No projects match "Zeppelin"' })).toBeVisible();
  // The search field has its own "Clear search" button; use the empty state's action.
  await example.locator(".sw-empty").getByRole("button", { name: "Clear search" }).click();
  await expect(example.getByRole("searchbox", { name: "Search projects" })).toHaveValue("");
  await expect(example.getByRole("listitem")).toHaveCount(5);
});
