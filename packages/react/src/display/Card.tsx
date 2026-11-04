import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type CardProps<E extends ElementType = "div"> = PolymorphicProps<E>;

/** A flat raised surface separated by a hairline, never a shadow. */
export function Card<E extends ElementType = "div">({ as, className, ...rest }: CardProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-card", className)} {...rest} />;
}
