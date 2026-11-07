import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale } from "react-aria-components";
import { cx } from "../utils/cx";
import { type ChartDatum, type ChartSeries, type HitRect, numberFormatter, pct, stepMark, valueOf } from "./geometry";

export type Orientation = "vertical" | "horizontal";

/** One drawn value: its hit area in plot percentages, and which series and category it is. */
export interface Mark extends HitRect {
  series: number;
  category: number;
  value: number;
}

export interface AxisLabel {
  at: number;
  label: string;
  minor?: boolean;
}

/** Props every chart shares. */
export type ChartProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  /** Names the chart: shown above it, and names its marks' group. */
  caption: ReactNode;
  data: readonly ChartDatum[];
  /** The key in each datum that holds its category, such as "year". */
  x: string;
  /** Heads the category column of the data table, such as "Year". */
  xLabel: string;
  /** Up to six, in the order their colours are assigned. */
  series: readonly ChartSeries[];
  /** A series key: that series keeps its colour and the rest turn muted. */
  highlight?: string;
  /** Formats values in ticks, names, the tooltip and the table. Defaults to the locale's numbers. */
  format?: (value: number) => string;
  /** Draws the focus layer: one tab stop, arrow keys, named marks and a tooltip. Default true. */
  interactive?: boolean;
};

export const at = (value: number): CSSProperties => ({ "--at": `${value}%` }) as CSSProperties;

export const place = (r: HitRect): CSSProperties =>
  ({ "--x": `${r.x}%`, "--y": `${r.y}%`, "--w": `${r.width}%`, "--h": `${r.height}%` }) as CSSProperties;

/** data-series (1-based) and data-muted for a series' elements. */
export function seriesAttributes(series: readonly ChartSeries[], index: number, highlight?: string) {
  const muted = highlight !== undefined && series[index].key !== highlight;
  return { "data-series": index + 1, "data-muted": muted ? "" : undefined };
}

export function useChartFormat(format?: (value: number) => string): (value: number) => string {
  const { locale } = useLocale();
  return useMemo(() => format ?? numberFormatter(locale), [format, locale]);
}

type FrameProps = Omit<ChartProps, "format" | "interactive"> & {
  kind: "bar" | "line";
  orientation: Orientation;
  format: (value: number) => string;
  interactive: boolean;
  /** Labels down the start edge, placed from the top. */
  yLabels: AxisLabel[];
  /** Labels along the foot, placed from the inline start. */
  xLabels: AxisLabel[];
  gridlines: { at: number; zero: boolean }[];
  endLabels?: { at: number; series: number }[];
  marks: Mark[];
  /** True for line points: hit areas are 24px squares centred on them. */
  points: boolean;
  /** The SVG marks. */
  svg: ReactNode;
  /** HTML over the SVG, given the active mark (always null when not interactive). */
  overlay?: (active: Mark | null) => ReactNode;
  /** The mark nearest a pointer at plot percentages, or -1. */
  pick: (x: number, y: number) => number;
};

/** The figure every chart shares: caption, legend, axes, gridlines, marks, focus layer and data table. */
export function ChartFrame({
  kind,
  orientation,
  caption,
  data,
  x,
  xLabel,
  series,
  highlight,
  format,
  interactive,
  yLabels,
  xLabels,
  gridlines,
  endLabels,
  marks,
  points,
  svg,
  overlay,
  pick,
  className,
  ...rest
}: FrameProps) {
  const captionId = useId();
  const [focusIndex, setFocusIndex] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const targets = useRef<(HTMLSpanElement | null)[]>([]);
  const current = Math.min(focusIndex, Math.max(0, marks.length - 1));
  const activeMark = interactive && active !== null ? (marks[active] ?? null) : null;
  const name = (m: Mark) => `${series[m.series].label}, ${String(data[m.category][x])}: ${format(m.value)}`;

  function onKeyDown(event: KeyboardEvent) {
    const next = stepMark(marks, current, event.key, orientation);
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    setActive(next);
    targets.current[next]?.focus();
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const i = pick(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
    setActive(i < 0 ? null : i);
  }

  function onPointerLeave() {
    const focused = targets.current.some((t) => t !== null && t === document.activeElement);
    setActive(focused ? current : null);
  }

  function onBlur(event: FocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget;
    if (!(next instanceof Element && targets.current.includes(next as HTMLSpanElement))) setActive(null);
  }

  return (
    <figure className={cx("sw-chart", className)} data-chart={kind} data-orientation={orientation} {...rest}>
      <figcaption className="sw-chart-caption" id={interactive ? captionId : undefined}>
        {caption}
      </figcaption>
      {series.length > 1 && (
        <ul className="sw-chart-legend">
          {series.map((s, i) => (
            <li key={s.key} className="sw-chart-legend-item" {...seriesAttributes(series, i, highlight)}>
              <span className="sw-chart-swatch" aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className="sw-chart-frame">
        <div className="sw-chart-axis" data-axis="y" aria-hidden="true">
          {yLabels.map((l) => (
            <span key={`${l.at}-${l.label}`} className="sw-chart-tick" data-minor={l.minor ? "" : undefined} style={at(l.at)}>
              {l.label}
            </span>
          ))}
        </div>
        <div
          className="sw-chart-plot"
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerLeave={interactive ? onPointerLeave : undefined}
        >
          {gridlines.map((g) => (
            <div key={g.at} className="sw-chart-gridline" data-zero={g.zero ? "" : undefined} style={at(g.at)} />
          ))}
          <svg className="sw-chart-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {svg}
          </svg>
          {overlay?.(activeMark)}
          {interactive && (
            <div className="sw-chart-targets" role="group" aria-labelledby={captionId} onKeyDown={onKeyDown}>
              {marks.map((m, i) => (
                <span
                  key={`${m.series}-${m.category}`}
                  ref={(el) => {
                    targets.current[i] = el;
                  }}
                  className="sw-chart-target"
                  role="img"
                  aria-label={name(m)}
                  tabIndex={i === current ? 0 : -1}
                  data-point={points ? "" : undefined}
                  data-active={i === active ? "" : undefined}
                  style={place(m)}
                  onFocus={() => {
                    setFocusIndex(i);
                    setActive(i);
                  }}
                  onBlur={onBlur}
                />
              ))}
            </div>
          )}
          {activeMark && (
            <ChartTooltip
              mark={activeMark}
              orientation={orientation}
              data={data}
              x={x}
              series={series}
              highlight={highlight}
              format={format}
            />
          )}
        </div>
        {endLabels && endLabels.length > 0 && (
          <div className="sw-chart-ends" aria-hidden="true">
            {endLabels.map((e) => (
              <span key={e.series} className="sw-chart-end" {...seriesAttributes(series, e.series, highlight)} style={at(e.at)}>
                {series[e.series].label}
              </span>
            ))}
          </div>
        )}
        <div className="sw-chart-axis" data-axis="x" aria-hidden="true">
          {xLabels.map((l) => (
            <span key={`${l.at}-${l.label}`} className="sw-chart-tick" data-minor={l.minor ? "" : undefined} style={at(l.at)}>
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <ChartTable data={data} x={x} xLabel={xLabel} series={series} format={format} />
    </figure>
  );
}

function ChartTooltip({
  mark,
  orientation,
  data,
  x,
  series,
  highlight,
  format,
}: {
  mark: Mark;
  orientation: Orientation;
  data: readonly ChartDatum[];
  x: string;
  series: readonly ChartSeries[];
  highlight?: string;
  format: (value: number) => string;
}) {
  // Above the bar's top or the point; for horizontal bars, above the bar's end.
  const tipX = orientation === "horizontal" ? mark.x + mark.width : mark.x + mark.width / 2;
  const align = tipX < 25 ? "start" : tipX > 75 ? "end" : "center";
  const datum = data[mark.category];
  return (
    <div
      className="sw-chart-tooltip"
      aria-hidden="true"
      data-align={align}
      style={{ "--x": `${pct(tipX)}%`, "--y": `${mark.y}%` } as CSSProperties}
    >
      <p className="sw-chart-tooltip-title">{String(datum[x])}</p>
      {series.map((s, i) => (
        <div
          key={s.key}
          className="sw-chart-tooltip-row"
          {...seriesAttributes(series, i, highlight)}
          data-current={i === mark.series ? "" : undefined}
        >
          <span className="sw-chart-swatch" />
          <span>{s.label}</span>
          <span className="sw-chart-tooltip-value">{format(valueOf(datum, s.key))}</span>
        </div>
      ))}
    </div>
  );
}

function ChartTable({
  data,
  x,
  xLabel,
  series,
  format,
}: {
  data: readonly ChartDatum[];
  x: string;
  xLabel: string;
  series: readonly ChartSeries[];
  format: (value: number) => string;
}) {
  return (
    <details className="sw-chart-data">
      <summary>Show data</summary>
      <div className="sw-table-wrap">
        <table className="sw-table">
          <thead>
            <tr>
              <th scope="col">{xLabel}</th>
              {series.map((s) => (
                <th key={s.key} scope="col" data-numeric="">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((datum, i) => (
              <tr key={`${i}-${String(datum[x])}`}>
                <th scope="row">{String(datum[x])}</th>
                {series.map((s) => (
                  <td key={s.key} data-numeric="">
                    {format(valueOf(datum, s.key))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
