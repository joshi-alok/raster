import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type ProgressBarProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  value: number;
  /** Defaults to 0. */
  minValue?: number;
  /** Defaults to 100. */
  maxValue?: number;
  /** Text shown beside the label and announced instead of the percentage, such as "12 of 22 pages". */
  valueLabel?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * How far a task has got, when its length is known. Renders a native <progress>, so the HTML
 * route is the same markup. For waits of unknown length, use Skeleton.
 */
export function ProgressBar({ label, value, minValue = 0, maxValue = 100, valueLabel, className, ...rest }: ProgressBarProps) {
  const id = useId();
  const span = Math.max(maxValue - minValue, 1);
  const position = clamp(value, minValue, maxValue) - minValue;
  const percent = Math.round((position / span) * 100);
  return (
    <div className={cx("sw-field sw-progress", className)} {...rest}>
      <div className="sw-progress-head">
        <label className="sw-field-label" htmlFor={id}>
          {label}
        </label>
        <span className="sw-progress-value" aria-hidden="true">
          {valueLabel ?? `${percent}%`}
        </span>
      </div>
      <progress className="sw-progress-bar" id={id} value={position} max={span} aria-valuetext={valueLabel}>
        {valueLabel ?? `${percent}%`}
      </progress>
    </div>
  );
}
