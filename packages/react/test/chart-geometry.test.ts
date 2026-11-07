import { describe, expect, it } from "vitest";
import {
  barLayout,
  lineLayout,
  nearestPoint,
  nearestRect,
  numberFormatter,
  sparklineLayout,
  sparklineSummary,
  spreadLabels,
  stackSpans,
  stepMark,
  valueAxis,
} from "../src/charts/geometry";

const DATA = [
  { year: "2023", built: 4, planned: 2 },
  { year: "2024", built: 6, planned: 3 },
];
const SERIES = [
  { key: "built", label: "Built" },
  { key: "planned", label: "Planned" },
];
const MONTHS = [
  { m: "Jan", a: 10, b: 30 },
  { m: "Feb", a: 20, b: 25 },
  { m: "Mar", a: 15, b: 40 },
];
const AB = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
];

describe("valueAxis", () => {
  it("puts nice ticks on an upward axis, measured from the top", () => {
    const axis = valueAxis([-3, 12], { upward: true });
    expect(axis.ticks.map((t) => t.value)).toEqual([-5, 0, 5, 10, 15]);
    expect(axis.ticks.map((t) => t.at)).toEqual([100, 75, 50, 25, 0]);
    expect(axis.zero).toBe(75);
  });

  it("measures a horizontal axis from the inline start", () => {
    expect(valueAxis([-3, 12], { upward: false }).ticks.map((t) => t.at)).toEqual([0, 25, 50, 75, 100]);
  });

  it("keeps an exact domain exact, and widens an empty one", () => {
    expect(valueAxis([0, 25], { upward: true, nice: false }).ticks.map((t) => t.value)).toEqual([0, 5, 10, 15, 20, 25]);
    expect(valueAxis([3, 3], { upward: true }).ticks[0].value).toBe(2);
  });

  it("has no zero when the domain leaves it out", () => {
    expect(valueAxis([10, 40], { upward: true }).zero).toBeNull();
  });
});

describe("barLayout", () => {
  it("groups series side by side inside each category's band, from zero", () => {
    const layout = barLayout({ data: DATA, x: "year", series: SERIES });
    expect(layout.categories).toEqual([
      { index: 0, label: "2023", at: 25, minor: false },
      { index: 1, label: "2024", at: 75, minor: false },
    ]);
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(layout.bars).toEqual([
      { series: 0, category: 0, value: 4, x: 5, y: 33.3333, width: 20, height: 66.6667 },
      { series: 1, category: 0, value: 2, x: 25, y: 66.6667, width: 20, height: 33.3333 },
      { series: 0, category: 1, value: 6, x: 55, y: 0, width: 20, height: 100 },
      { series: 1, category: 1, value: 3, x: 75, y: 50, width: 20, height: 50 },
    ]);
  });

  it("stacks horizontal bars along the value axis, categories from the top", () => {
    const layout = barLayout({ data: DATA, x: "year", series: SERIES, stacked: true, orientation: "horizontal" });
    expect(layout.axis.ticks.map((t) => [t.value, t.at])).toEqual([[0, 0], [2, 20], [4, 40], [6, 60], [8, 80], [10, 100]]);
    expect(layout.bars).toEqual([
      { series: 0, category: 0, value: 4, x: 0, y: 5, width: 40, height: 40 },
      { series: 1, category: 0, value: 2, x: 40, y: 5, width: 20, height: 40 },
      { series: 0, category: 1, value: 6, x: 0, y: 55, width: 60, height: 40 },
      { series: 1, category: 1, value: 3, x: 60, y: 55, width: 30, height: 40 },
    ]);
  });

  it("hangs negative bars below the zero line", () => {
    const layout = barLayout({ data: [{ k: "a", v: -5 }, { k: "b", v: 10 }], x: "k", series: [{ key: "v", label: "V" }] });
    expect(layout.axis.zero).toBe(50);
    expect(layout.bars[0]).toMatchObject({ y: 50, height: 25 });
    expect(layout.bars[1]).toMatchObject({ y: 0, height: 50 });
  });

  it("marks every other category label minor past six vertical categories", () => {
    const data = Array.from({ length: 8 }, (_, i) => ({ k: String(i), v: i }));
    const layout = barLayout({ data, x: "k", series: [{ key: "v", label: "V" }] });
    expect(layout.categories.map((c) => c.minor)).toEqual([false, true, false, true, false, true, false, true]);
    const horizontal = barLayout({ data, x: "k", series: [{ key: "v", label: "V" }], orientation: "horizontal" });
    expect(horizontal.categories.some((c) => c.minor)).toBe(false);
  });

  it("refuses a seventh series and a missing number", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ key: `s${i}`, label: `S${i}` }));
    expect(() => barLayout({ data: DATA, x: "year", series: seven })).toThrow(/at most 6 series/);
    expect(() => barLayout({ data: [{ year: "2023" }], x: "year", series: SERIES })).toThrow(/"built" must be a finite number/);
  });
});

describe("stackSpans", () => {
  it("stacks positives up and negatives down, separately", () => {
    expect(stackSpans([[3, -2, 4, -1]])).toEqual([[[0, 3], [0, -2], [3, 7], [-2, -3]]]);
  });
});

describe("lineLayout", () => {
  it("spaces categories edge to edge and draws each series as a path", () => {
    const layout = lineLayout({ data: MONTHS, x: "m", series: AB, area: true });
    expect(layout.categories.map((c) => c.at)).toEqual([0, 50, 100]);
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([10, 15, 20, 25, 30, 35, 40]);
    expect(layout.axis.zero).toBeNull();
    expect(layout.lines[0].path).toBe("M0,100L50,66.6667L100,83.3333");
    // Without zero in the domain, the area closes at the plot's foot.
    expect(layout.lines[0].area).toBe("M0,100L0,100L50,66.6667L100,83.3333L100,100Z");
    expect(layout.lines[0].end).toBe(83.3333);
  });

  it("takes an exact domain and leaves the area off unless asked", () => {
    const layout = lineLayout({ data: MONTHS, x: "m", series: AB, domain: [0, 50] });
    expect(layout.axis.ticks.map((t) => t.value)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(layout.lines[0].area).toBeNull();
  });
});

describe("spreadLabels", () => {
  it("pushes close labels apart by the gap, keeping their order", () => {
    expect(spreadLabels([50, 52, 51], 8)).toEqual([50, 66, 58]);
  });

  it("keeps labels inside the plot", () => {
    expect(spreadLabels([98, 99], 8)).toEqual([92, 100]);
    expect(spreadLabels([], 8)).toEqual([]);
  });
});

describe("hit testing", () => {
  it("picks the bar under the pointer, or the nearest one", () => {
    const { bars } = barLayout({ data: DATA, x: "year", series: SERIES });
    expect(nearestRect(bars, 30, 90)).toBe(1);
    expect(nearestRect(bars, 70, 10)).toBe(2);
    expect(nearestRect([], 0, 0)).toBe(-1);
  });

  it("picks the nearest category, then the nearest series in it", () => {
    const points = lineLayout({ data: MONTHS, x: "m", series: AB }).lines.flatMap((l) => l.points);
    // Feb is nearest to x 48; B (y 50) is nearer to y 20 than A (y 66.7).
    expect(nearestPoint(points, 48, 20)).toBe(4);
  });
});

describe("stepMark", () => {
  const { bars } = barLayout({ data: DATA, x: "year", series: SERIES });

  it("moves along categories with Left and Right and across series with Up and Down", () => {
    expect(["ArrowRight", "ArrowDown", "End", "Home", "ArrowLeft"].map((k) => stepMark(bars, 0, k, "vertical"))).toEqual([
      2, 1, 2, 0, 0,
    ]);
  });

  it("swaps the pairs for horizontal bars", () => {
    expect(["ArrowDown", "ArrowRight", "ArrowUp"].map((k) => stepMark(bars, 0, k, "horizontal"))).toEqual([2, 1, 0]);
  });

  it("ignores keys it doesn't use", () => {
    expect(stepMark(bars, 0, "Tab", "vertical")).toBeNull();
  });
});

describe("sparklines", () => {
  it("fill their box from the lowest value to the highest", () => {
    expect(sparklineLayout([4.1, 3.8, 5, 6.3])).toEqual({
      path: "M0,88L33.3333,100L66.6667,52L100,0",
      area: "M0,100L0,88L33.3333,100L66.6667,52L100,0L100,100Z",
      last: { x: 100, y: 0 },
    });
    expect(sparklineLayout([2, 2]).path).toBe("M0,50L100,50");
    expect(sparklineLayout([]).last).toBeNull();
  });

  it("summarise the trend in a sentence", () => {
    const format = numberFormatter("en-US");
    expect(sparklineSummary("Revenue, 12 months", [4.1, 3.8, 5, 6.3], format)).toBe(
      "Revenue, 12 months: from 4.1 to 6.3, low 3.8, high 6.3",
    );
    expect(sparklineSummary("Revenue", [], format)).toBe("Revenue: no data");
  });
});

describe("numberFormatter", () => {
  it("formats in the given locale with at most two decimals", () => {
    expect(numberFormatter("en-US")(12345.678)).toBe("12,345.68");
    expect(numberFormatter("de-DE")(12345.678)).toBe("12.345,68");
  });
});
