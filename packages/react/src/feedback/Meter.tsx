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

type MeterRange = { min: number; max: number; low?: number; high?: number; optimum?: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** The HTML meter's boundaries: everything clamped into min..max, and high never below low. */
function normalise(value: number, { min, max, low, high, optimum }: MeterRange) {
  const top = Math.max(max, min);
  const lo = clamp(low ?? min, min, top);
  const hi = Math.max(clamp(high ?? top, min, top), lo);
  return {
    min,
    max: top,
    value: clamp(value, min, top),
    low: lo,
    high: hi,
    optimum: clamp(optimum ?? (min + top) / 2, min, top),
  };
}

/** The HTML meter algorithm: how good a value is, given where the optimum lies. */
export function meterState(value: number, range: MeterRange): MeterState {
  const m = normalise(value, range);
  const region = meterRegion(m.value, m.low, m.high);
  const preferred = meterRegion(m.optimum, m.low, m.high);
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
  /** Words for the regions. Defaults to "Low", "Medium" and "High"; "Medium" shows only when the middle is not the best region. */
  regionLabels?: { low?: string; medium?: string; high?: string };
};

/**
 * A measurement within a known range, such as storage used. Renders a native <meter>. Whenever the
 * value is not in the best region, or is outside the middle, a word ("High", "Medium", "Low") is shown
 * beside the value, so the state is never colour alone.
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
  const m = normalise(value, { min: minValue, max: maxValue, low, high, optimum });
  const region = meterRegion(m.value, m.low, m.high);
  const state = meterState(value, { min: minValue, max: maxValue, low, high, optimum });
  const words = { low: regionLabels?.low ?? "Low", medium: regionLabels?.medium ?? "Medium", high: regionLabels?.high ?? "High" };
  const word = region !== "medium" || state !== "optimum" ? words[region] : undefined;
  const range = m.max - m.min;
  const text = valueLabel ?? `${Math.round(range > 0 ? ((m.value - m.min) / range) * 100 : 0)}%`;
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
