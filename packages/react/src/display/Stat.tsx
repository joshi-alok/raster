import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

const TREND_ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight } as const;

export type StatProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  value: ReactNode;
  label: ReactNode;
  /** The change as words with its sign, such as "+12% on last year". */
  change?: ReactNode;
  /** Draws the arrow. The sign and phrase in change carry the meaning; colour stays neutral. */
  trend?: "up" | "down" | "flat";
};

/** One key figure with its label, and optionally how it changed. */
export function Stat({ value, label, change, trend = "flat", className, ...rest }: StatProps) {
  const Arrow = TREND_ICONS[trend];
  return (
    <div className={cx("sw-stat", className)} {...rest}>
      <span className="sw-stat-value">{value}</span>
      <span className="sw-stat-label">{label}</span>
      {change != null && (
        <span className="sw-stat-change" data-trend={trend}>
          <Arrow aria-hidden="true" strokeWidth={1.5} />
          {change}
        </span>
      )}
    </div>
  );
}
