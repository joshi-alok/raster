import { expect, test } from "@playwright/test";
import { PROJECTS } from "../src/data/projects";

test("ships in Alpine, following the system colour scheme", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme");
  await expect(html).not.toHaveAttribute("data-mode");
  const footer = page.locator("footer.st-footer");
  await expect(footer.getByRole("button", { name: "Alpine" })).toHaveAttribute("aria-pressed", "true");
  await expect(footer.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
});

test("the main navigation marks the current page, and Work stays current inside a case study", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Main" });
  await page.goto("/studio/");
  await expect(nav.getByRole("link", { name: "Studio" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Work" })).not.toHaveAttribute("aria-current");
  await page.goto("/work/linie-7/");
  await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "true");
});

test("the skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("home shows a statement, three selected projects and the services", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("We design the things people find their way through.");
  await expect(page.locator(".st-projects > li")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 3, name: /Identity|Wayfinding|Editorial|Digital/ })).toHaveCount(4);
});

test("work lists every project as a card and in the index, each linking to its case study", async ({ page }) => {
  await page.goto("/work/");
  const cards = page.locator(".st-projects .st-project");
  await expect(cards).toHaveCount(PROJECTS.length);
  const index = page.getByRole("table");
  await expect(index.locator("tbody tr")).toHaveCount(PROJECTS.length);
  for (const project of PROJECTS) {
    await expect(page.locator(`.st-projects a[href="/work/${project.slug}/"]`)).toHaveCount(1);
    await expect(index.getByRole("link", { name: project.title })).toHaveAttribute("href", `/work/${project.slug}/`);
  }
});

test("a case study shows its facts, three chapters, two figures and the next project", async ({ page }) => {
  await page.goto("/work/linie-7/");
  await expect(page.locator("h1")).toHaveText("Linie 7");
  await expect(page.locator(".st-facts dt")).toHaveText(["Client", "Scope", "Stations", "Team"]);
  await expect(page.getByRole("heading", { level: 2, name: /^(Challenge|Approach|Outcome)$/ })).toHaveCount(3);
  await expect(page.locator(".st-figure-pair figure svg[role=img]")).toHaveCount(2);
  const next = page.getByRole("navigation", { name: "Next project" }).getByRole("link");
  await expect(next).toHaveAttribute("href", `/work/${PROJECTS[1].slug}/`);
});

test("contact: an empty enquiry shows errors and moves focus; a complete one confirms without leaving", async ({ page }) => {
  await page.goto("/contact/");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  const name = page.getByLabel("Name");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("Enter your name.");
  await expect(page.locator("#email-error")).toBeVisible();

  await name.fill("Ada Muster");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("About the project").fill("A sign system for a new library.");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("This demo sent nothing.");
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(name).toHaveValue("");
  await expect(name).not.toHaveAttribute("aria-describedby");
});

test("the footer switch sets theme and mode and remembers them", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer.st-footer");
  await footer.getByRole("button", { name: "Zürich" }).click();
  await footer.getByRole("button", { name: "Dark" }).click();
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(html).toHaveAttribute("data-mode", "dark");
  await page.goto("/studio/");
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(footer.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
});

test("the art takes its colours from the theme", async ({ page }) => {
  await page.goto("/");
  const accent = page.locator(".st-art .st-accent").first();
  const alpine = await accent.evaluate((el) => getComputedStyle(el).fill);
  await page.locator("footer.st-footer").getByRole("button", { name: "Zürich" }).click();
  await expect.poll(() => accent.evaluate((el) => getComputedStyle(el).fill)).not.toBe(alpine);
});
