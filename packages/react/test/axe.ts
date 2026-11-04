import axe from "axe-core";
import { expect } from "vitest";

/**
 * Structural accessibility check (roles, names, ARIA validity) in jsdom.
 * Colour contrast is enforced by the token build and re-checked in real browsers in Plan 4;
 * the landmark "region" rule only makes sense for whole pages.
 */
export async function expectAccessible(container: Element): Promise<void> {
  const result = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  expect(result.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}
