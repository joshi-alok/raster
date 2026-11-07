import { describe, expect, it } from "vitest";
import { CHART_SLOTS, checkChartPalette, deltaE, oklch } from "../src/chart-palette";
import { alpine, ROLES, type Theme, themes } from "../src/themes";

describe("chart roles", () => {
  it("add six series slots and a muted role", () => {
    expect(CHART_SLOTS).toEqual(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"]);
    for (const role of [...CHART_SLOTS, "chart-muted"]) expect(ROLES).toContain(role);
  });

  it("take Alpine's blue for slot 1 and Zürich's cobalt", () => {
    expect(alpine.colors["chart-1"]).toEqual(["#2E6DB4", "#4A8AD4"]);
    expect(themes.find((t) => t.name === "zurich")?.colors["chart-1"]).toEqual(["#2F4BD8", "#7086F0"]);
  });
});

describe("colour maths", () => {
  it("measures OKLCH lightness and chroma", () => {
    const { lightness, chroma } = oklch("#2E6DB4");
    expect(lightness).toBeCloseTo(0.5299, 3);
    expect(chroma).toBeCloseTo(0.1291, 3);
  });

  it("measures distance in OKLab ×100, with and without simulated colour blindness", () => {
    // Plum and teal, Alpine's closest neighbours: 9.0 for colour-blind readers, 22.9 otherwise.
    expect(Math.min(deltaE("#8E4FA6", "#00897B", "protan"), deltaE("#8E4FA6", "#00897B", "deutan"))).toBeCloseTo(8.95, 1);
    expect(deltaE("#8E4FA6", "#00897B")).toBeCloseTo(22.89, 1);
    expect(deltaE("#2E6DB4", "#2E6DB4")).toBe(0);
  });
});

describe("checkChartPalette", () => {
  it.each(themes.map((t) => [t.name, t] as const))("%s passes every limit in both modes", (_name, theme) => {
    expect(checkChartPalette(theme)).toEqual([]);
  });

  it("reports grey slots, repeated slots and close neighbours", () => {
    const light = ["#2E6DB4", "#2E6DB4", "#00897B", "#8E4FA6", "#808080", "#C2457A"];
    const colors = { ...alpine.colors };
    light.forEach((hex, i) => {
      colors[CHART_SLOTS[i]] = [hex, alpine.colors[CHART_SLOTS[i]][1]];
    });
    const issues = checkChartPalette({ ...alpine, colors } as Theme);
    expect(issues.every((i) => i.mode === "light")).toBe(true);
    expect(issues.map((i) => `${i.check}: ${i.detail}`)).toEqual([
      "chroma: chart-5 #808080 C 0.000",
      "colour-blind: chart-1 and chart-2 ΔE 0.0",
      "normal: chart-1 and chart-2 ΔE 0.0",
      "normal: chart-2 and chart-3 ΔE 14.1",
      "colour-blind: chart-5 and chart-6 ΔE 1.7",
    ]);
  });
});
