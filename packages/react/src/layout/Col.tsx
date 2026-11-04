import type { CSSProperties, ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { CSSVars } from "../utils/types";

export type ColumnCount = 4 | 8 | 12;

/** A value per grid column count, e.g. { 8: 4, 12: 6 }. Unset counts span the full width. */
export type PerColumnCount = Partial<Record<ColumnCount, number>>;

export type ColProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    span?: PerColumnCount;
    start?: PerColumnCount;
    style?: CSSProperties & CSSVars;
  }
>;

function toVars(prefix: "span" | "start", values: PerColumnCount | undefined): CSSVars {
  const vars: CSSVars = {};
  for (const [count, value] of Object.entries(values ?? {})) {
    if (value !== undefined) vars[`--${prefix}-${count}`] = String(value);
  }
  return vars;
}

export function Col<E extends ElementType = "div">({ as, className, span, start, style, ...rest }: ColProps<E>) {
  const Component: ElementType = as ?? "div";
  const vars = { ...toVars("span", span), ...toVars("start", start) };
  const merged = Object.keys(vars).length > 0 || style ? ({ ...vars, ...style } as CSSProperties) : undefined;
  return <Component className={cx("sw-col", className)} style={merged} {...rest} />;
}
