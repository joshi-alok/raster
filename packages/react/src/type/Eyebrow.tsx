import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type EyebrowProps<E extends ElementType = "span"> = PolymorphicProps<E>;

/** Uppercase Geist Mono annotation (eyebrow) for annotations such as "01 / Grid". Not a form label. */
export function Eyebrow<E extends ElementType = "span">({ as, className, ...rest }: EyebrowProps<E>) {
  const Component: ElementType = as ?? "span";
  return <Component className={cx("sw-type-label", className)} {...rest} />;
}
