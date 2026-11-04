import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type LabelProps<E extends ElementType = "span"> = PolymorphicProps<E>;

/** Uppercase Geist Mono label for annotations such as "01 / Grid". Not a form label. */
export function Label<E extends ElementType = "span">({ as, className, ...rest }: LabelProps<E>) {
  const Component: ElementType = as ?? "span";
  return <Component className={cx("sw-type-label", className)} {...rest} />;
}
