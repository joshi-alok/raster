import { defineConfig, devices } from "@playwright/test";

const PORT = 4388;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Baselines are Linux only (…-linux.png), made in Playwright's Docker image: `pnpm baselines`.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  expect: {
    // Under a loaded machine an element can take longer than the default 5s to settle before
    // its screenshot; the pixel tolerance below stays strict.
    timeout: 15_000,
    toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.001 },
  },
  webServer: {
    // Astro 7 tracks preview servers in a lock file; --ignore-lock keeps this one in the foreground.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", testIgnore: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
});
