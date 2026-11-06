import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type MeterState = "optimum" | "suboptimum" | "poor";
export type MeterRegion = "low" | "medium" | "high";

/** Which region of the range a value is in: below low, between low and high, or above high. */
export function meterRegion(value: number, low: number, high: number): MeterRegion {
  if (value < low) return "low";
  if (value > high) return "high";
  return "medium";
}

/** The HTML meter algorithm: how good a value is, given where the optimum lies. */
export function meterState(
  value: number,
  { min, max, low = min, high = max, optimum = (min + max) / 2 }: { min: number; max: number; low?: number; high?: number; optimum?: number },
): MeterState {
  const region = meterRegion(value, low, high);
  const preferred = meterRegion(optimum, low, high);
  if (region === preferred) return "optimum";
  if (preferred === "medium" || region === "medium") return "suboptimum";
  return "poor";
}

export type MeterProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: ReactNode;
  value: number;
  /** Defaults to 0. */
  minValue?: number;
  /** Defaults to 100. */
  maxValue?: number;
  /** Below this the value is "low". */
  low?: number;
  /** Above this the value is "high". */
  high?: number;
  /** The best value; decides whether low or high is good. Defaults to the middle. */
  optimum?: number;
  /** Text for the value, such as "86 GB"; defaults to a percentage. */
  valueLabel?: string;
  /** Words shown outside the middle region. Defaults to "Low" and "High". */
  regionLabels?: { low?: string; high?: string };
};

/**
 * A measurement within a known range, such as storage used. Renders a native <meter>; outside the
 * middle region a word ("High", "Low") is shown beside the value, so the state is never colour alone.
 */
export function Meter({
  label,
  value,
  minValue = 0,
  maxValue = 100,
  low,
  high,
  optimum,
  valueLabel,
  regionLabels,
  className,
  ...rest
}: MeterProps) {
  const id = useId();
  const lo = low ?? minValue;
  const hi = high ?? maxValue;
  const region = meterRegion(value, lo, hi);
  const word = region === "low" ? (regionLabels?.low ?? "Low") : region === "high" ? (regionLabels?.high ?? "High") : undefined;
  const state = meterState(value, { min: minValue, max: maxValue, low: lo, high: hi, optimum });
  const text = valueLabel ?? `${Math.round(((value - minValue) / Math.max(maxValue - minValue, 1)) * 100)}%`;
  return (
    <div className={cx("sw-field sw-progress sw-meter", className)} {...rest}>
      <div className="sw-progress-head">
        <label className="sw-field-label" htmlFor={id}>
          {label}
        </label>
        <span className="sw-progress-value" aria-hidden="true">
          {text}
          {word && <span className="sw-meter-word"> · {word}</span>}
        </span>
      </div>
      <meter
        className="sw-meter-bar"
        id={id}
        value={value}
        min={minValue}
        max={maxValue}
        low={low}
        high={high}
        optimum={optimum}
        data-state={state}
        aria-valuetext={word ? `${text}, ${word}` : text}
      >
        {text}
      </meter>
    </div>
  );
}
