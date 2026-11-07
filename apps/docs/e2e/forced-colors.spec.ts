import { expect, test } from "@playwright/test";
import { demo } from "./examples";
import { waitForIslands } from "./islands";

/**
 * Forced colours (Windows High Contrast) replaces author backgrounds with system colours, so any
 * control drawn only with backgrounds disappears. These screenshots keep every bar, thumb, fill and
 * block visible. Baselines are generated once and checked by eye; see the plan's Task 8.
 */
const CASES = [
  { path: "/components/progress-bar/", title: "Upload", name: "progress-bar" },
  { path: "/components/meter/", title: "Levels", name: "meter" },
  { path: "/components/skeleton/", title: "Loading card", name: "skeleton" },
  { path: "/components/slider/", title: "Gutter without React", name: "slider-native" },
  { path: "/components/slider/", title: "Gutter", name: "slider-react" },
  { path: "/components/tag-group/", title: "Disciplines without React", name: "tag-group-native" },
  { path: "/components/avatar/", title: "Sizes", name: "avatar" },
  { path: "/components/badge/", title: "Counts", name: "badge" },
  { path: "/components/calendar/", title: "Delivery day", name: "calendar" },
  { path: "/components/calendar/", title: "Booking", name: "range-calendar" },
  { path: "/components/date-picker/", title: "Delivery date", name: "date-picker" },
  { path: "/components/file-upload/", title: "Proofs", name: "file-upload" },
  { path: "/components/data-grid/", title: "Projects", name: "data-grid" },
  { path: "/components/data-grid/", title: "Projects without React", name: "data-grid-native" },
];

for (const c of CASES) {
  test(`forced colours: ${c.name} stays visible`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await page.goto(c.path);
    await waitForIslands(page);
    await page.evaluate(() => document.fonts.ready);
    await expect(demo(page, c.title)).toHaveScreenshot(`forced-${c.name}.png`);
  });
}
