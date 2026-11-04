import { describe, expect, it } from "vitest";
import { SCALE_STOPS, SCALES } from "../src/scales";
import { alpine, type Role, zurich } from "../src/themes";

const HUES = {
  alpine: { neutral: "slate", accent: "glacier", success: "moss", warning: "ochre", danger: "alert" },
  zurich: { neutral: "warm-grey", accent: "cobalt", success: "sage", warning: "ochre", danger: "signal-red" },
} as const;

describe.each([alpine, zurich])("$name scales", (theme) => {
  const hues = HUES[theme.name];
  const scales = SCALES[theme.name] as Record<string, Partial<Record<string, string>>>;
  const light = (role: Role) => theme.colors[role][0];
  const dark = (role: Role) => theme.colors[role][1];

  it("maps the neutral roles onto the neutral ramp in light mode", () => {
    const n = scales[hues.neutral];
    expect(light("text-primary")).toBe(n["900"]);
    expect(light("text-secondary")).toBe(n["700"]);
    expect(light("border-strong")).toBe(n["500"]);
    expect(light("border")).toBe(n["100"]);
    expect(light("surface-subtle")).toBe(n["50"]);
  });

  it.each(["accent", "success", "warning", "danger"] as const)(
    "maps %s onto its hue: 700 fill, 100 tint, 900 text on the tint, 900 dark tint",
    (status) => {
      const h = scales[hues[status]];
      expect(light(status)).toBe(h["700"]);
      expect(light(`${status}-subtle`)).toBe(h["100"]);
      expect(light(`on-${status}-subtle`)).toBe(h["900"]);
      expect(dark(`${status}-subtle`)).toBe(h["900"]);
      // In dark mode, text on a tint is the role colour itself (spec §5, "-subtle mapping").
      expect(dark(`on-${status}-subtle`)).toBe(dark(status));
    },
  );

  it("takes the light-mode brand signal from the 500 stop of its hue", () => {
    // Alpine signals in glacier (its accent hue); Zürich in signal red (its danger hue).
    const hue = theme.name === "alpine" ? hues.accent : hues.danger;
    expect(light("brand-signal")).toBe(scales[hue]["500"]);
  });

  it("stores only known stops as six-digit hex", () => {
    for (const stops of Object.values(scales)) {
      for (const [stop, value] of Object.entries(stops)) {
        expect(SCALE_STOPS).toContain(stop);
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});
