import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Screenshots the React rendering and its native twin against one shared baseline, so the test
 * fails when the two routes differ by more than the visual tolerance. Focus and hover are cleared
 * first: a native dialog focuses its first control on open, while React Aria focuses the dialog.
 */
export async function expectSameRendering(page: Page, name: string, react: Locator, native: Locator): Promise<void> {
  await expectParityBaseline(page, name, react);
  await expectParityBaseline(page, name, native);
}

/** One side of a pair, for overlays that cannot be open at the same time as their twin. */
export async function expectParityBaseline(page: Page, name: string, target: Locator): Promise<void> {
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  // The docs type scale is fluid, so the two examples sit at different fractional page offsets
  // (and a JS-positioned popover lands on a different fraction than an anchor-positioned one).
  // Chromium rasterises text and rounds the clip by that fraction, which would differ even for
  // identical boxes. Move the target's layout box onto a whole pixel (a transform would not do:
  // text snaps by layout position) so both routes render from the same origin.
  // Let entry motion finish first: an overlay still fading in is composited, which changes how
  // its text is rasterised, and React Aria animates in while the native popover transitions.
  const previous = await target.evaluate(async (el: HTMLElement) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
    const before = el.getAttribute("style");
    const { left, top } = el.getBoundingClientRect();
    const dx = Math.round(left) - left;
    const dy = Math.round(top) - top;
    const style = getComputedStyle(el);
    if (style.position === "absolute" || style.position === "fixed") {
      el.style.marginInlineStart = `calc(${style.marginInlineStart} + ${dx}px)`;
      el.style.marginBlockStart = `calc(${style.marginBlockStart} + ${dy}px)`;
    } else {
      if (style.position === "static") el.style.position = "relative";
      el.style.left = `calc(${style.left === "auto" ? "0px" : style.left} + ${dx}px)`;
      el.style.top = `calc(${style.top === "auto" ? "0px" : style.top} + ${dy}px)`;
    }
    return before;
  });
  await expect(target).toHaveScreenshot(`parity-${name}.png`);
  await target.evaluate((el: HTMLElement, before: string | null) => {
    if (before === null) el.removeAttribute("style");
    else el.setAttribute("style", before);
  }, previous);
}
