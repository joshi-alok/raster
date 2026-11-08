import { expect, test } from "@playwright/test";

test("Get started shows how to install, theme, and use both routes", async ({ page }) => {
  await page.goto("/get-started/");
  await expect(page.getByRole("heading", { level: 1, name: "Get started" })).toBeVisible();
  for (const name of ["Install", "Fonts", "Theme and mode", "HTML and CSS", "React", "Design tools"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Install with npm" })).toContainText("npm install @raster/css");
});

test("each design-tool file downloads as DTCG JSON", async ({ page, request }) => {
  await page.goto("/get-started/");
  const links = page.getByRole("list", { name: "Design-tool files" }).getByRole("link");
  await expect(links).toHaveCount(6);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
    const response = await request.get(href);
    expect(response.ok(), href).toBe(true);
    const json = await response.json();
    expect(JSON.stringify(json)).toContain('"$type"');
  }
});

test("an unknown address shows the 404 page with a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
});
