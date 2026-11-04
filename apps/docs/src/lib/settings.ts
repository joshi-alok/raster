export type Settings = {
  theme: "alpine" | "zurich";
  mode: "system" | "light" | "dark";
  motion: "full" | "reduce";
  grid: "off" | "on";
};

export const STORAGE_KEY = "raster-docs:settings";

export const DEFAULT_SETTINGS: Settings = { theme: "alpine", mode: "system", motion: "full", grid: "off" };

const ALLOWED: { [K in keyof Settings]: readonly Settings[K][] } = {
  theme: ["alpine", "zurich"],
  mode: ["system", "light", "dark"],
  motion: ["full", "reduce"],
  grid: ["off", "on"],
};

function isSetting(key: string): key is keyof Settings {
  return Object.hasOwn(ALLOWED, key);
}

function isValue<K extends keyof Settings>(key: K, value: unknown): value is Settings[K] {
  return (ALLOWED[key] as readonly unknown[]).includes(value);
}

/** Reads stored settings; any missing or invalid field falls back to its default. */
export function parseSettings(raw: string | null): Settings {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
  } catch {
    // Corrupt storage: use the defaults.
  }
  const pick = <K extends keyof Settings>(key: K): Settings[K] => {
    const stored = data[key];
    return isValue(key, stored) ? stored : DEFAULT_SETTINGS[key];
  };
  return { theme: pick("theme"), mode: pick("mode"), motion: pick("motion"), grid: pick("grid") };
}

function setOrRemove(el: Element, name: string, value: string | null): void {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

/**
 * Writes settings onto the root element and the page grids ([data-page-grid]).
 * Alpine, system mode and full motion are the CSS defaults, so their attributes are removed.
 */
export function applySettings(root: HTMLElement, settings: Settings): void {
  setOrRemove(root, "data-theme", settings.theme === "alpine" ? null : settings.theme);
  setOrRemove(root, "data-mode", settings.mode === "system" ? null : settings.mode);
  setOrRemove(root, "data-motion", settings.motion === "full" ? null : settings.motion);
  root.ownerDocument.querySelectorAll("[data-page-grid]").forEach((grid) => {
    grid.toggleAttribute("data-grid-debug", settings.grid === "on");
  });
}

/**
 * Binds every button[data-setting][data-value]: aria-pressed mirrors the current setting, and a
 * click sets, applies and stores it. A button with data-toggle flips back to the default when
 * pressed again (the header's Grid button).
 */
export function bindSettings(doc: Document, storage: Pick<Storage, "getItem" | "setItem">): void {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): start from the defaults.
  }
  let settings = parseSettings(raw);
  const buttons = Array.from(doc.querySelectorAll<HTMLButtonElement>("button[data-setting][data-value]"));

  const render = () => {
    applySettings(doc.documentElement, settings);
    for (const button of buttons) {
      const key = button.dataset.setting ?? "";
      const pressed = isSetting(key) && settings[key] === button.dataset.value;
      button.setAttribute("aria-pressed", String(pressed));
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const key = button.dataset.setting ?? "";
      const value = button.dataset.value;
      if (!isSetting(key) || !isValue(key, value)) return;
      const next = button.hasAttribute("data-toggle") && settings[key] === value ? DEFAULT_SETTINGS[key] : value;
      settings = { ...settings, [key]: next } as Settings;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Storage unavailable: the setting still applies to this page.
      }
      render();
    });
  }
  render();
}

/**
 * Inline <head> script: applies theme, mode and motion before first paint, mirroring
 * applySettings. The grid overlay waits for bindSettings, since the page grid is not parsed yet.
 */
export const INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}");var r=document.documentElement;if(s.theme==="zurich")r.setAttribute("data-theme","zurich");if(s.mode==="light"||s.mode==="dark")r.setAttribute("data-mode",s.mode);if(s.motion==="reduce")r.setAttribute("data-motion","reduce");}catch(e){}})();`;
