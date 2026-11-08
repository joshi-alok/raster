import { expect, test } from "@playwright/test";

test("the skip link is the first tab stop and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("the header marks the current page", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Principles" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Components" })).not.toHaveAttribute("aria-current");
});

test("inside a section, the header marks the section link as current but not as the page", async ({ page }) => {
  await page.goto("/foundations/type/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Foundations" })).toHaveAttribute("aria-current", "true");
  const local = page.getByRole("navigation", { name: "Foundations" });
  await expect(local.getByRole("link", { name: "Type" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
});

test("pressed display toggles differ by more than colour", async ({ page }) => {
  await page.goto("/");
  const mode = page.getByRole("group", { name: "Mode" });
  const style = (name: string) =>
    mode.getByRole("button", { name }).evaluate((el) => {
      const s = getComputedStyle(el);
      return { shadow: s.boxShadow, underline: s.textDecorationLine };
    });
  const pressed = await style("System");
  const unpressed = await style("Dark");
  expect(pressed.underline).toContain("underline");
  expect(unpressed.underline).not.toContain("underline");
  expect(pressed.shadow).not.toBe(unpressed.shadow);
});

test("theme, mode and motion buttons apply and persist", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const theme = page.getByRole("group", { name: "Theme" });
  const mode = page.getByRole("group", { name: "Mode" });

  await theme.getByRole("button", { name: "Zürich" }).click();
  await mode.getByRole("button", { name: "Dark" }).click();
  await page.getByRole("group", { name: "Motion" }).getByRole("button", { name: "Reduced" }).click();
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(html).toHaveAttribute("data-mode", "dark");
  await expect(html).toHaveAttribute("data-motion", "reduce");
  await expect(theme.getByRole("button", { name: "Zürich" })).toHaveAttribute("aria-pressed", "true");
  await expect(theme.getByRole("button", { name: "Alpine" })).toHaveAttribute("aria-pressed", "false");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "zurich");
  await expect(html).toHaveAttribute("data-mode", "dark");

  await page.getByRole("group", { name: "Mode" }).getByRole("button", { name: "System" }).click();
  await expect(html).not.toHaveAttribute("data-mode");
});

test("the Grid toggle overlays the page grid and persists", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Grid", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-grid-debug", "");

  await page.reload();
  await expect(page.locator("[data-page-grid]")).toHaveAttribute("data-grid-debug", "");
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await expect(page.locator("[data-page-grid]")).not.toHaveAttribute("data-grid-debug");
});

test("on a phone the header shows a Menu button instead of the links, and the menu lists them all", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/components/");
  const header = page.locator("body > .sw-header");
  await expect(header.getByRole("navigation", { name: "Main" })).toBeHidden();
  await header.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  const links = menu.getByRole("navigation", { name: "Main" }).getByRole("link");
  await expect(links).toHaveText(["Principles", "Get started", "Foundations", "Components", "Patterns", "Templates", "Themes"]);
  await expect(menu.getByRole("link", { name: "Components" })).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("on a wide screen the header shows the links and no Menu button", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const header = page.locator("body > .sw-header");
  await expect(header.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Menu" })).toBeHidden();
});

test("no built page runs a word into the code or link that follows it", async () => {
  // Astro's HTML compression drops a line break between text and an element that starts the next
  // source line, so "needs no JavaScript.\n<code>" builds as "JavaScript.<code>". Read every page.
  const { readFileSync } = await import("node:fs");
  const { builtPages } = await import("./pages");
  const joined: string[] = [];
  for (const path of builtPages()) {
    const html = readFileSync(new URL(`../dist${path}index.html`, import.meta.url), "utf8");
    for (const m of html.matchAll(/[\p{L}.,;:]<(?:code|a|strong|em)[ >][^<]{0,24}/gu)) joined.push(`${path}: ${m[0]}`);
  }
  expect(joined).toEqual([]);
});
