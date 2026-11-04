import type { Page } from "@playwright/test";
import { DEFAULT_SETTINGS, type Settings, STORAGE_KEY } from "../src/lib/settings";

export const COMBOS = [
  { theme: "alpine", mode: "light" },
  { theme: "alpine", mode: "dark" },
  { theme: "zurich", mode: "light" },
  { theme: "zurich", mode: "dark" },
] as const satisfies ReadonlyArray<Settings>;

/** Stores display settings before every navigation of this page (they survive reloads). */
export async function useSettings(page: Page, settings: Partial<Settings>): Promise<void> {
  const value = JSON.stringify({ ...DEFAULT_SETTINGS, ...settings });
  await page.addInitScript(([key, stored]) => window.localStorage.setItem(key, stored), [STORAGE_KEY, value] as const);
}
