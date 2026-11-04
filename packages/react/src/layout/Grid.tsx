import type { CSSProperties, ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { CSSVars, SpaceStep } from "../utils/types";

export type GridLayout = "hanging" | "split-5-7" | "split-1-2";

export type GridProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Swiss layout preset; children alternate narrow / wide and stack at 4 columns. */
    layout?: GridLayout;
    /** Draw a hairline at every column start. */
    rules?: boolean;
    /** Tint the columns (development aid). */
    debug?: boolean;
    rowGap?: SpaceStep;
    style?: CSSProperties;
  }
>;

/** 4 / 8 / 12-column fluid grid. Must sit inside a size container, never on one. */
export function Grid<E extends ElementType = "div">({
  as,
  className,
  layout,
  rules,
  debug,
  rowGap,
  style,
  ...rest
}: GridProps<E>) {
  const Component: ElementType = as ?? "div";
  const vars: CSSVars | undefined = rowGap ? { "--grid-row-gap": `var(--space-${rowGap})` } : undefined;
  const merged = vars || style ? ({ ...vars, ...style } as CSSProperties) : undefined;
  return (
    <Component
      className={cx("sw-grid", className)}
      data-layout={layout}
      data-grid-rules={rules ? "" : undefined}
      data-grid-debug={debug ? "" : undefined}
      style={merged}
      {...rest}
    />
  );
}
