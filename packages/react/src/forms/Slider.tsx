import type { ReactNode } from "react";
import {
  Slider as AriaSlider,
  SliderOutput,
  type SliderProps as AriaSliderProps,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldLabel } from "./FieldParts";

export type SliderProps<T extends number | number[]> = Omit<AriaSliderProps<T>, "className" | "children"> & {
  label: ReactNode;
  /** Names for each thumb of a range slider, such as ["Minimum", "Maximum"]. */
  thumbLabels?: string[];
  className?: string;
};

/**
 * A value, or a range with two thumbs, chosen along a track; the current value is shown in mono.
 * Native twin: <input type="range" class="sw-slider-input"> with an <output>.
 */
export function Slider<T extends number | number[]>({ label, thumbLabels, className, ...rest }: SliderProps<T>) {
  return (
    <AriaSlider className={cx("sw-field sw-slider", className)} {...rest}>
      <div className="sw-slider-head">
        <FieldLabel>{label}</FieldLabel>
        <SliderOutput className="sw-slider-output" />
      </div>
      <SliderTrack className="sw-slider-track">
        {({ state }) =>
          state.values.map((_, i) => (
            <SliderThumb key={i} index={i} aria-label={thumbLabels?.[i]} className="sw-slider-thumb" />
          ))
        }
      </SliderTrack>
    </AriaSlider>
  );
}
