import { scaleBand, scaleLinear, scalePoint } from "d3-scale";

/** One row of chart data: the category under the chart's `x` key, and a number per series key. */
export type ChartDatum = Readonly<Record<string, string | number>>;

/** A series: the data key it reads and the label people see. */
export interface ChartSeries {
  key: string;
  label: string;
}

/** Colours are assigned in a fixed order and never cycled, so a chart holds at most six series. */
export const MAX_SERIES = 6;

/** A rectangle in plot percentages, measured from the top-left of the plot. */
export interface HitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rounds a percentage to four decimals, so server and client markup match exactly. */
export const pct = (n: number): number => Math.round(n * 1e4) / 1e4;

export function checkSeries(series: readonly ChartSeries[]): void {
  if (series.length === 0) throw new RangeError("A chart needs at least one series.");
  if (series.length > MAX_SERIES) {
    throw new RangeError(`Charts show at most ${MAX_SERIES} series; fold the rest into "Other".`);
  }
}

export function valueOf(datum: ChartDatum, key: string): number {
  const value = datum[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`"${key}" must be a finite number in every datum.`);
  }
  return value;
}

export interface Tick {
  value: number;
  /** Plot percentage: from the top when the axis runs upward, from the inline start otherwise. */
  at: number;
}

export interface ValueAxis {
  ticks: Tick[];
  /** Where zero sits, or null when the domain doesn't include it. */
  zero: number | null;
  position: (value: number) => number;
}

/**
 * A value axis over the plot. Upward axes (vertical bars, lines) measure from the top, as SVG does;
 * horizontal bars measure from the inline start. About five ticks, on nice numbers unless the
 * domain was given exactly.
 */
export function valueAxis(
  domain: readonly [number, number],
  { upward, nice = true }: { upward: boolean; nice?: boolean },
): ValueAxis {
  let [lo, hi] = domain;
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const scale = scaleLinear().domain([lo, hi]).range(upward ? [100, 0] : [0, 100]);
  if (nice) scale.nice(5);
  const position = (value: number) => pct(scale(value));
  const [d0, d1] = scale.domain();
  return {
    ticks: scale.ticks(5).map((value) => ({ value, at: position(value) })),
    zero: d0 <= 0 && 0 <= d1 ? position(0) : null,
    position,
  };
}

export interface Category {
  index: number;
  label: string;
  /** Plot percentage of the category's centre along its axis. */
  at: number;
  /** Every other label, past six categories: CSS hides these when the chart is narrow. */
  minor: boolean;
}

const isMinor = (index: number, count: number) => count > 6 && index % 2 === 1;

/** Stacks each category's values: positives upward from zero, negatives downward. */
export function stackSpans(rows: readonly (readonly number[])[]): [number, number][][] {
  return rows.map((row) => {
    let up = 0;
    let down = 0;
    return row.map((value): [number, number] => {
      if (value >= 0) {
        up += value;
        return [up - value, up];
      }
      down += value;
      return [down - value, down];
    });
  });
}

export interface Bar extends HitRect {
  series: number;
  category: number;
  value: number;
}

export interface BarLayout {
  categories: Category[];
  axis: ValueAxis;
  bars: Bar[];
}

export function barLayout({
  data,
  x,
  series,
  orientation = "vertical",
  stacked = false,
}: {
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  orientation?: "vertical" | "horizontal";
  stacked?: boolean;
}): BarLayout {
  checkSeries(series);
  const vertical = orientation === "vertical";
  const values = data.map((datum) => series.map((s) => valueOf(datum, s.key)));
  const spans = stacked ? stackSpans(values) : values.map((row) => row.map((v): [number, number] => [0, v]));
  const ends = spans.flat(2);
  const lo = Math.min(0, ...ends);
  const hi = Math.max(0, ...ends);
  const axis = valueAxis([lo, hi === lo ? lo + 1 : hi], { upward: vertical });
  const band = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([0, 100])
    .paddingInner(0.2)
    .paddingOuter(0.1);
  const inner = scaleBand<number>()
    .domain(series.map((_, i) => i))
    .range([0, band.bandwidth()]);
  const categories = data.map((datum, i) => ({
    index: i,
    label: String(datum[x]),
    at: pct((band(i) ?? 0) + band.bandwidth() / 2),
    minor: vertical && isMinor(i, data.length),
  }));
  const bars: Bar[] = [];
  spans.forEach((row, category) =>
    row.forEach(([from, to], s) => {
      const start = (band(category) ?? 0) + (stacked ? 0 : (inner(s) ?? 0));
      const size = stacked ? band.bandwidth() : inner.bandwidth();
      const a = axis.position(from);
      const b = axis.position(to);
      const near = Math.min(a, b);
      const length = Math.abs(b - a);
      const value = values[category][s];
      bars.push(
        vertical
          ? { series: s, category, value, x: pct(start), y: pct(near), width: pct(size), height: pct(length) }
          : { series: s, category, value, x: pct(near), y: pct(start), width: pct(length), height: pct(size) },
      );
    }),
  );
  return { categories, axis, bars };
}

export interface LinePoint {
  series: number;
  category: number;
  value: number;
  x: number;
  y: number;
}

export interface Line {
  series: number;
  /** SVG path data in plot percentages. */
  path: string;
  /** The area under the line down to zero (or the plot's foot), when asked for. */
  area: string | null;
  points: LinePoint[];
  /** Where the line ends, for its end label. */
  end: number;
}

export interface LineLayout {
  categories: Category[];
  axis: ValueAxis;
  lines: Line[];
}

const pathOf = (points: readonly { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join("");

const areaOf = (points: readonly { x: number; y: number }[], base: number) =>
  points.length === 0
    ? ""
    : `M${points[0].x},${base}${points.map((p) => `L${p.x},${p.y}`).join("")}L${points[points.length - 1].x},${base}Z`;

export function lineLayout({
  data,
  x,
  series,
  domain,
  area = false,
}: {
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  domain?: readonly [number, number];
  area?: boolean;
}): LineLayout {
  checkSeries(series);
  const values = data.map((datum) => series.map((s) => valueOf(datum, s.key)));
  const all = values.flat();
  const axis = domain
    ? valueAxis(domain, { upward: true, nice: false })
    : valueAxis(all.length ? [Math.min(...all), Math.max(...all)] : [0, 1], { upward: true });
  const xs = scalePoint<number>()
    .domain(data.map((_, i) => i))
    .range([0, 100]);
  const categories = data.map((datum, i) => ({
    index: i,
    label: String(datum[x]),
    at: pct(xs(i) ?? 50),
    minor: isMinor(i, data.length),
  }));
  const base = axis.zero ?? 100;
  const lines = series.map((_, s) => {
    const points = values.map((row, category) => ({
      series: s,
      category,
      value: row[s],
      x: categories[category].at,
      y: axis.position(row[s]),
    }));
    return {
      series: s,
      path: pathOf(points),
      area: area ? areaOf(points, base) : null,
      points,
      end: points.length ? points[points.length - 1].y : base,
    };
  });
  return { categories, axis, lines };
}

/** Moves end labels apart so no two sit closer than `gap` plot percent, keeping them inside 0–100. */
export function spreadLabels(positions: readonly number[], gap: number): number[] {
  const order = positions.map((at, index) => ({ at, index })).sort((a, b) => a.at - b.at || a.index - b.index);
  for (let k = 1; k < order.length; k++) order[k].at = Math.max(order[k].at, order[k - 1].at + gap);
  const last = order.length - 1;
  if (last >= 0 && order[last].at > 100) {
    order[last].at = 100;
    for (let k = last - 1; k >= 0; k--) order[k].at = Math.min(order[k].at, order[k + 1].at - gap);
  }
  const out: number[] = [];
  for (const o of order) out[o.index] = pct(o.at);
  return out;
}

/** The index of the rectangle nearest the point (distance 0 inside it), or -1 when there are none. */
export function nearestRect(rects: readonly HitRect[], px: number, py: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  rects.forEach((r, i) => {
    const dx = Math.max(r.x - px, 0, px - (r.x + r.width));
    const dy = Math.max(r.y - py, 0, py - (r.y + r.height));
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

/** The point in the category nearest the pointer, then the series nearest it in that category. */
export function nearestPoint(points: readonly { x: number; y: number }[], px: number, py: number): number {
  let best = -1;
  points.forEach((p, i) => {
    if (best < 0) {
      best = i;
      return;
    }
    const b = points[best];
    const dx = Math.abs(p.x - px) - Math.abs(b.x - px);
    if (dx < 0 || (dx === 0 && Math.abs(p.y - py) < Math.abs(b.y - py))) best = i;
  });
  return best;
}

/**
 * Where the keyboard goes from a mark. Along the category axis: Left/Right on upward charts,
 * Up/Down on horizontal bars. Across series: the other pair. Home and End jump to the first and
 * last category. Moves stop at the edges. Null for keys the chart doesn't use.
 */
export function stepMark(
  marks: readonly { series: number; category: number }[],
  from: number,
  key: string,
  orientation: "vertical" | "horizontal",
): number | null {
  const mark = marks[from];
  if (!mark) return null;
  const lastCategory = Math.max(...marks.map((m) => m.category));
  const lastSeries = Math.max(...marks.map((m) => m.series));
  const find = (category: number, s: number) => {
    const i = marks.findIndex((m) => m.category === category && m.series === s);
    return i < 0 ? from : i;
  };
  if (key === "Home") return find(0, mark.series);
  if (key === "End") return find(lastCategory, mark.series);
  const moves: Record<string, readonly [number, number]> =
    orientation === "vertical"
      ? { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      : { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const move = moves[key];
  if (!move) return null;
  const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));
  return find(clamp(mark.category + move[0], lastCategory), clamp(mark.series + move[1], lastSeries));
}

export interface SparklineLayout {
  path: string;
  area: string;
  last: { x: number; y: number } | null;
}

/** A sparkline fills its box: the lowest value at the foot, the highest at the top. */
export function sparklineLayout(values: readonly number[]): SparklineLayout {
  if (!values.every(Number.isFinite)) throw new TypeError("A sparkline's values must be finite numbers.");
  if (values.length === 0) return { path: "", area: "", last: null };
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const xs = scalePoint<number>()
    .domain(values.map((_, i) => i))
    .range([0, 100]);
  const ys = scaleLinear().domain([lo, hi]).range([100, 0]);
  const points = values.map((v, i) => ({ x: pct(xs(i) ?? 50), y: pct(ys(v)) }));
  return { path: pathOf(points), area: areaOf(points, 100), last: points[points.length - 1] };
}

/** The sentence a screen reader hears for a sparkline. */
export function sparklineSummary(label: string, values: readonly number[], format: (value: number) => string): string {
  if (values.length === 0) return `${label}: no data`;
  const first = format(values[0]);
  const last = format(values[values.length - 1]);
  return `${label}: from ${first} to ${last}, low ${format(Math.min(...values))}, high ${format(Math.max(...values))}`;
}

/** Plain numbers in the reader's locale, at most two decimals. */
export function numberFormatter(locale: string): (value: number) => string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (value) => nf.format(value);
}
