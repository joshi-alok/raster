import type { ReactNode, RefAttributes } from "react";
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  TooltipTrigger,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { TooltipTrigger };

export type TooltipProps = Omit<AriaTooltipProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
  };

/**
 * A short description of its trigger, shown on hover and keyboard focus.
 * Never put essential information or interactive content in a tooltip.
 */
export function Tooltip({ className, children, placement = "top", offset = 8, ...rest }: TooltipProps) {
  return (
    <AriaTooltip className={cx("sw-tooltip", className)} placement={placement} offset={offset} {...rest}>
      {children}
    </AriaTooltip>
  );
}
