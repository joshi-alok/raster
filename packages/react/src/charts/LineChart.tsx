import type { CSSProperties } from "react";
import { ChartFrame, type ChartProps, type Mark, seriesAttributes, useChartFormat } from "./ChartFrame";
import { lineLayout, nearestPoint, spreadLabels } from "./geometry";

/** End labels sit at least this far apart, in plot percent (about a label's height at 16rem). */
const END_LABEL_GAP = 8;

export type LineChartProps = ChartProps & {
  /** Fills under each line in its colour at 12%. */
  area?: boolean;
  /** An exact value range, such as [0, 100]. By default the data's range on nice numbers. */
  domain?: readonly [number, number];
};

/** Lines over categories, such as months, with markers, end labels for two to four series, and an optional area. */
export function LineChart({
  data,
  x,
  series,
  area = false,
  domain,
  highlight,
  format,
  interactive = true,
  ...rest
}: LineChartProps) {
  const fmt = useChartFormat(format);
  const layout = lineLayout({ data, x, series, domain, area });
  const marks: Mark[] = layout.lines.flatMap((l) => l.points.map((p) => ({ ...p, width: 0, height: 0 })));
  const labelled = series.length >= 2 && series.length <= 4;
  const ends = labelled
    ? spreadLabels(
        layout.lines.map((l) => l.end),
        END_LABEL_GAP,
      ).map((at, s) => ({ at, series: s }))
    : [];
  // The highlighted series is drawn last, so muted lines pass beneath it.
  const isHighlight = (s: number) => Number(series[s].key === highlight);
  const drawn = [...layout.lines].sort((a, b) => isHighlight(a.series) - isHighlight(b.series));
  return (
    <ChartFrame
      {...rest}
      kind="line"
      orientation="vertical"
      data={data}
      x={x}
      series={series}
      highlight={highlight}
      format={fmt}
      interactive={interactive}
      yLabels={layout.axis.ticks.map((t) => ({ at: t.at, label: fmt(t.value) }))}
      xLabels={layout.categories.map((c) => ({ at: c.at, label: c.label, minor: c.minor }))}
      gridlines={layout.axis.ticks.map((t) => ({ at: t.at, zero: t.value === 0 }))}
      endLabels={ends}
      marks={marks}
      points
      pick={(px, py) => nearestPoint(marks, px, py)}
      svg={drawn.map((l) => (
        <g key={l.series} {...seriesAttributes(series, l.series, highlight)}>
          {l.area && <path className="sw-chart-area" d={l.area} />}
          <path className="sw-chart-line" d={l.path} />
        </g>
      ))}
      overlay={(active) => (
        <>
          {active && <div className="sw-chart-crosshair" style={{ "--x": `${active.x}%` } as CSSProperties} />}
          {drawn.flatMap((l) =>
            l.points.map((p) => (
              <span
                key={`${p.series}-${p.category}`}
                className="sw-chart-point"
                {...seriesAttributes(series, p.series, highlight)}
                data-active={active?.series === p.series && active.category === p.category ? "" : undefined}
                style={{ "--x": `${p.x}%`, "--y": `${p.y}%` } as CSSProperties}
              />
            )),
          )}
        </>
      )}
    />
  );
}
