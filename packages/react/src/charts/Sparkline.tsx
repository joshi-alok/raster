import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cx } from "../utils/cx";
import { useChartFormat } from "./ChartFrame";
import { sparklineLayout, sparklineSummary } from "./geometry";

export type SparklineProps = Omit<ComponentPropsWithRef<"span">, "children" | "aria-label"> & {
  /** Finite numbers; anything else throws a TypeError. */
  data: readonly number[];
  /** What the values are, such as "Revenue, 12 months". The image is named with this and a summary. */
  label: string;
  /** Fills under the line at 12%. */
  area?: boolean;
  /** Formats the values in the summary. Defaults to the locale's numbers. */
  format?: (value: number) => string;
};

/** A small trend that sits in a line of text, a Stat or a table cell. One image, named with a summary. */
export function Sparkline({ data, label, area = false, format, className, ...rest }: SparklineProps) {
  const fmt = useChartFormat(format);
  const layout = sparklineLayout(data);
  return (
    <span className={cx("sw-sparkline", className)} role="img" aria-label={sparklineSummary(label, data, fmt)} {...rest}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {area && <path className="sw-sparkline-area" d={layout.area} />}
        <path className="sw-sparkline-line" d={layout.path} />
      </svg>
      {layout.last && (
        <span
          className="sw-sparkline-point"
          style={{ "--x": `${layout.last.x}%`, "--y": `${layout.last.y}%` } as CSSProperties}
        />
      )}
    </span>
  );
}
