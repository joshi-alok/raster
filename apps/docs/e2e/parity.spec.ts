import { test } from "@playwright/test";
import { demo } from "./examples";
import { waitForIslands } from "./islands";
import { expectAnchoredBelow, expectParityBaseline, expectSameRendering } from "./parity";
import { useSettings } from "./settings";

const COMBOS = [
  { theme: "alpine", mode: "light" },
  { theme: "zurich", mode: "dark" },
] as const;

for (const combo of COMBOS) {
  const variant = `${combo.theme}-${combo.mode}`;

  test.describe(variant, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await useSettings(page, { ...combo, motion: "reduce" });
    });

    async function open(page: import("@playwright/test").Page, path: string) {
      await page.goto(path);
      await waitForIslands(page);
      await page.evaluate(() => document.fonts.ready);
    }

    test("disclosure renders alike, closed and with a row open", async ({ page }) => {
      await open(page, "/components/disclosure/");
      const react = demo(page, "Questions");
      const native = demo(page, "Questions without React");
      await expectSameRendering(page, `disclosure-closed-${variant}`, react, native);
      await react.getByRole("button", { name: "How long does it take?" }).click();
      await native.locator("summary", { hasText: "How long does it take?" }).click();
      await expectSameRendering(page, `disclosure-open-${variant}`, react, native);
    });

    test("popover renders alike when open", async ({ page }) => {
      await open(page, "/components/popover/");
      const reactTrigger = demo(page, "Grid units").getByRole("button", { name: "Grid units" });
      await reactTrigger.click();
      const react = page.locator(".sw-popover-content:not(#grid-units)");
      await react.waitFor();
      await test.step("React placement", () => expectAnchoredBelow(reactTrigger, react));
      await test.step("React", () => expectParityBaseline(page, `popover-${variant}`, react));
      await page.keyboard.press("Escape");
      const nativeTrigger = demo(page, "Grid units without React").getByRole("button", { name: "Grid units" });
      await nativeTrigger.click();
      const native = page.locator("#grid-units");
      await native.waitFor();
      await test.step("native placement", () => expectAnchoredBelow(nativeTrigger, native));
      // React Aria positions its popover with position: absolute; a native [popover] is fixed (the
      // UA default), which Chromium paints through its anchor-scroll path with different glyph
      // positioning even when every box matches to the pixel. Compare both under one scheme; the
      // anchor still places the native popover.
      await native.evaluate((el: HTMLElement) => {
        el.style.position = "absolute";
      });
      await test.step("native", () => expectParityBaseline(page, `popover-${variant}`, native));
    });

    test("drawer renders alike when open", async ({ page }) => {
      await open(page, "/components/drawer/");
      await demo(page, "Project details").getByRole("button", { name: "Project details" }).click();
      const react = page.locator(".sw-drawer-overlay .sw-drawer");
      await react.waitFor();
      await test.step("React", () => expectParityBaseline(page, `drawer-${variant}`, react));
      await page.keyboard.press("Escape");
      await react.waitFor({ state: "detached" });
      await demo(page, "Project details without React").getByRole("button", { name: "Project details" }).click();
      const native = page.locator("dialog.sw-drawer[open]");
      await test.step("native", () => expectParityBaseline(page, `drawer-${variant}`, native));
    });

    test("compact header renders alike, closed and with the menu open", async ({ page }) => {
      await open(page, "/components/header/");
      await expectSameRendering(page, `header-compact-${variant}`, demo(page, "Compact menu"), demo(page, "Compact menu without React"));
      await demo(page, "Compact menu").getByRole("button", { name: "Menu" }).click();
      const react = page.locator(".sw-header-menu-overlay .sw-header-menu");
      await react.waitFor();
      await test.step("React", () => expectParityBaseline(page, `header-menu-${variant}`, react));
      await page.keyboard.press("Escape");
      await react.waitFor({ state: "detached" });
      await demo(page, "Compact menu without React").getByRole("button", { name: "Menu" }).click();
      const native = page.locator("#compact-menu");
      await test.step("native", () => expectParityBaseline(page, `header-menu-${variant}`, native));
    });

    test("side nav renders alike", async ({ page }) => {
      await open(page, "/components/side-nav/");
      await expectSameRendering(
        page,
        `sidenav-${variant}`,
        demo(page, "Documentation sections"),
        demo(page, "Documentation sections without React"),
      );
    });

    test("tag group renders alike, as loaded and after a change", async ({ page }) => {
      await open(page, "/components/tag-group/");
      const react = demo(page, "Disciplines");
      const native = demo(page, "Disciplines without React");
      await expectSameRendering(page, `tag-group-${variant}`, react, native);
      await react.getByRole("row", { name: "Wayfinding" }).click();
      await native.getByText("Wayfinding").click();
      await expectSameRendering(page, `tag-group-changed-${variant}`, react, native);
    });

    test("segmented control renders alike, as loaded and after a change", async ({ page }) => {
      await open(page, "/components/segmented-control/");
      const react = demo(page, "View");
      const native = demo(page, "View without React");
      await expectSameRendering(page, `segmented-${variant}`, react, native);
      await react.getByRole("radio", { name: "Map" }).click();
      await native.getByText("Map").click();
      await expectSameRendering(page, `segmented-changed-${variant}`, react, native);
    });

    test("search field renders alike, empty and with text", async ({ page }) => {
      await open(page, "/components/search-field/");
      const react = demo(page, "Project search");
      const native = demo(page, "Project search without React");
      await expectSameRendering(page, `search-empty-${variant}`, react, native);
      await react.getByRole("searchbox").fill("Linie");
      await native.getByRole("searchbox").fill("Linie");
      await expectSameRendering(page, `search-filled-${variant}`, react, native);
    });

    test("slider renders alike, as loaded and at its maximum", async ({ page }) => {
      await open(page, "/components/slider/");
      const react = demo(page, "Gutter");
      const native = demo(page, "Gutter without React");
      await expectSameRendering(page, `slider-${variant}`, react, native);
      for (const target of [react, native]) {
        await target.getByRole("slider").focus();
        await page.keyboard.press("End");
      }
      await expectSameRendering(page, `slider-max-${variant}`, react, native);
    });

    test("bar chart renders alike", async ({ page }) => {
      await open(page, "/components/bar-chart/");
      await expectSameRendering(
        page,
        `bar-chart-${variant}`,
        demo(page, "Projects by year"),
        demo(page, "Projects by year without React"),
      );
    });

    test("line chart renders alike", async ({ page }) => {
      await open(page, "/components/line-chart/");
      await expectSameRendering(page, `line-chart-${variant}`, demo(page, "Visitors"), demo(page, "Visitors without React"));
    });

    // NumberField has no parity check: the native route uses the browser's own steppers by design.
  });
}
