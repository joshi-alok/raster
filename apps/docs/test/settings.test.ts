// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  applySettings,
  bindSettings,
  DEFAULT_SETTINGS,
  INIT_SCRIPT,
  parseSettings,
  type Settings,
  STORAGE_KEY,
} from "../src/lib/settings";

function memoryStorage(initial?: Settings) {
  const data = new Map<string, string>();
  if (initial) data.set(STORAGE_KEY, JSON.stringify(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-mode");
  document.documentElement.removeAttribute("data-motion");
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("parseSettings", () => {
  it("returns the defaults for missing or corrupt storage", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{not json")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("42")).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid fields and replaces invalid ones with defaults", () => {
    expect(parseSettings(JSON.stringify({ theme: "zurich", mode: "sepia", grid: "on" }))).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "zurich",
      grid: "on",
    });
  });
});

describe("applySettings", () => {
  it("sets non-default theme, mode and motion on the root and toggles the page grid overlay", () => {
    document.body.innerHTML = `<div data-page-grid></div><div class="other"></div>`;
    const root = document.documentElement;
    applySettings(root, { theme: "zurich", mode: "dark", motion: "reduce", grid: "on" });
    expect(root.dataset.theme).toBe("zurich");
    expect(root.dataset.mode).toBe("dark");
    expect(root.dataset.motion).toBe("reduce");
    expect(document.querySelector("[data-page-grid]")!.hasAttribute("data-grid-debug")).toBe(true);
    expect(document.querySelector(".other")!.hasAttribute("data-grid-debug")).toBe(false);
  });

  it("removes the attributes for the defaults (Alpine, system mode, full motion, no overlay)", () => {
    document.body.innerHTML = `<div data-page-grid data-grid-debug></div>`;
    const root = document.documentElement;
    root.dataset.theme = "zurich";
    root.dataset.mode = "dark";
    root.dataset.motion = "reduce";
    applySettings(root, DEFAULT_SETTINGS);
    expect(root.hasAttribute("data-theme")).toBe(false);
    expect(root.hasAttribute("data-mode")).toBe(false);
    expect(root.hasAttribute("data-motion")).toBe(false);
    expect(document.querySelector("[data-page-grid]")!.hasAttribute("data-grid-debug")).toBe(false);
  });
});

describe("INIT_SCRIPT", () => {
  it.each<Settings>([
    { theme: "zurich", mode: "dark", motion: "reduce", grid: "on" },
    { theme: "alpine", mode: "light", motion: "full", grid: "off" },
    DEFAULT_SETTINGS,
  ])("applies theme, mode and motion exactly as applySettings does (%o)", (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    new Function(INIT_SCRIPT)();
    const fromScript = ["data-theme", "data-mode", "data-motion"].map((a) =>
      document.documentElement.getAttribute(a),
    );
    const expected = document.createElement("html");
    applySettings(expected, settings);
    expect(fromScript).toEqual(["data-theme", "data-mode", "data-motion"].map((a) => expected.getAttribute(a)));
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(() => new Function(INIT_SCRIPT)()).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("bindSettings", () => {
  const markup = `
    <button data-setting="theme" data-value="alpine"></button>
    <button data-setting="theme" data-value="zurich"></button>
    <button data-setting="grid" data-value="on" data-toggle></button>
    <div data-page-grid></div>`;

  it("applies stored settings and marks the matching buttons pressed", () => {
    document.body.innerHTML = markup;
    bindSettings(document, memoryStorage({ ...DEFAULT_SETTINGS, theme: "zurich" }));
    expect(document.documentElement.dataset.theme).toBe("zurich");
    const [alpine, zurich] = document.querySelectorAll<HTMLButtonElement>('[data-setting="theme"]');
    expect(alpine.getAttribute("aria-pressed")).toBe("false");
    expect(zurich.getAttribute("aria-pressed")).toBe("true");
  });

  it("updates, applies and stores a setting on click", () => {
    document.body.innerHTML = markup;
    const storage = memoryStorage();
    bindSettings(document, storage);
    document.querySelector<HTMLButtonElement>('[data-value="zurich"]')!.click();
    expect(document.documentElement.dataset.theme).toBe("zurich");
    expect(parseSettings(storage.getItem(STORAGE_KEY)).theme).toBe("zurich");
  });

  it("flips a data-toggle button back to the default when pressed again", () => {
    document.body.innerHTML = markup;
    bindSettings(document, memoryStorage());
    const grid = document.querySelector<HTMLButtonElement>('[data-setting="grid"]')!;
    const pageGrid = document.querySelector("[data-page-grid]")!;
    grid.click();
    expect(grid.getAttribute("aria-pressed")).toBe("true");
    expect(pageGrid.hasAttribute("data-grid-debug")).toBe(true);
    grid.click();
    expect(grid.getAttribute("aria-pressed")).toBe("false");
    expect(pageGrid.hasAttribute("data-grid-debug")).toBe(false);
  });
});
