import { expect, test } from "@playwright/test";
import { waitForIslands } from "./islands";

test("the templates index links to the four templates", async ({ page }) => {
  await page.goto("/templates/");
  const links = page.locator("main .docs-component-list a");
  await expect(links).toHaveText(["Editorial article", "Dashboard", "Landing page", "Manifesto"]);
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

test("landing: a display headline, two calls to action and six staggered features", async ({ page }) => {
  await page.goto("/templates/landing/");
  await expect(page.locator("h1")).toHaveClass(/sw-type-display/);
  await expect(page.getByRole("link", { name: "Browse components" })).toHaveAttribute("href", "/components/");
  await expect(page.getByRole("link", { name: "Read the principles" })).toHaveAttribute("href", "/");
  await expect(page.locator(".sw-reveal[data-stagger] > li")).toHaveCount(6);
});

test("manifesto: ten numbered sections, six theme-drawn figures and three tables", async ({ page }) => {
  await page.goto("/templates/manifesto/");
  await expect(page.locator("h1")).toHaveText("Why we are redrawing the grid");
  await expect(page.locator("main section h2")).toHaveCount(10);
  await expect(page.locator(".mf-section-label")).toHaveText(
    ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"].map((n) => new RegExp(`^${n}`)),
  );
  const figures = page.locator("main figure");
  await expect(figures).toHaveCount(6);
  await expect(figures.locator("svg[role=img][aria-label]")).toHaveCount(6);
  await expect(figures.locator("figcaption")).toHaveText(Array.from({ length: 6 }, (_, i) => new RegExp(`^Figure ${i + 1} `)));
  await expect(page.getByRole("table")).toHaveCount(3);
  await expect(page.locator(".mf-refusals li")).toHaveCount(7);
});

test("manifesto: graphics take their colours from the theme", async ({ page }) => {
  await page.goto("/templates/manifesto/");
  const accent = page.locator(".mf-graphic .mf-accent").first();
  const fill = () => accent.evaluate((el) => getComputedStyle(el).fill);
  const alpine = await fill();
  await page.getByRole("group", { name: "Theme" }).first().getByRole("button", { name: "Zürich" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "zurich");
  expect(await fill()).not.toBe(alpine);
});

test("manifesto: the on-page switch sets theme and mode and stays in step with the footer", async ({ page }) => {
  await page.goto("/templates/manifesto/");
  const onPage = page.locator(".mf-switch");
  await onPage.getByRole("button", { name: "Zürich" }).click();
  await onPage.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "zurich");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(onPage.getByRole("button", { name: "Zürich" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".docs-footer").getByRole("button", { name: "Zürich" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".docs-footer").getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
});

test("manifesto: tables stack into labelled rows on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/templates/manifesto/");
  const cell = page.getByRole("table", { name: "Decisions" }).getByRole("cell").first();
  await expect(cell).toHaveCSS("display", "block");
  await expect(cell).toHaveAttribute("data-label", "Decision");
  for (const wrap of await page.locator(".sw-table-wrap").all()) {
    expect(await wrap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
  }
});
