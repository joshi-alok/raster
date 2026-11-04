import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";
import type { SpaceStep } from "../utils/types";

export type StackProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Spacing step between children; defaults to 4 (16px). */
    gap?: SpaceStep;
    direction?: "column" | "row";
  }
>;

export function Stack<E extends ElementType = "div">({ as, className, gap, direction, ...rest }: StackProps<E>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cx("sw-stack", className)}
      data-gap={gap}
      data-direction={direction === "row" ? "row" : undefined}
      {...rest}
    />
  );
}
