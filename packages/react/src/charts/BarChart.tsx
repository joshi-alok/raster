import { ChartFrame, type ChartProps, seriesAttributes, useChartFormat } from "./ChartFrame";
import { barLayout, nearestRect } from "./geometry";

export type BarChartProps = ChartProps & {
  /** Vertical bars rise from the x axis; horizontal bars run from the y axis. Default vertical. */
  orientation?: "vertical" | "horizontal";
  /** Stacks series in one bar per category instead of setting them side by side. */
  stacked?: boolean;
};

/** Bars from zero, grouped or stacked, vertical or horizontal. */
export function BarChart({
  data,
  x,
  series,
  orientation = "vertical",
  stacked = false,
  highlight,
  format,
  interactive = true,
  ...rest
}: BarChartProps) {
  const fmt = useChartFormat(format);
  const layout = barLayout({ data, x, series, orientation, stacked });
  const vertical = orientation === "vertical";
  const values = layout.axis.ticks.map((t) => ({ at: t.at, label: fmt(t.value) }));
  const categories = layout.categories.map((c) => ({ at: c.at, label: c.label, minor: c.minor }));
  return (
    <ChartFrame
      {...rest}
      kind="bar"
      orientation={orientation}
      data={data}
      x={x}
      series={series}
      highlight={highlight}
      format={fmt}
      interactive={interactive}
      yLabels={vertical ? values : categories}
      xLabels={vertical ? categories : values}
      gridlines={layout.axis.ticks.map((t) => ({ at: t.at, zero: t.value === 0 }))}
      marks={layout.bars}
      points={false}
      pick={(px, py) => nearestRect(layout.bars, px, py)}
      svg={layout.bars.map((b) => (
        <rect
          key={`${b.series}-${b.category}`}
          className="sw-chart-bar"
          {...seriesAttributes(series, b.series, highlight)}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
        />
      ))}
    />
  );
}
