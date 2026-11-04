import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type ContainerProps<E extends ElementType = "div"> = PolymorphicProps<E>;

/** Centred, max-width wrapper with fluid page margins; a size container for grids inside it. */
export function Container<E extends ElementType = "div">({ as, className, ...rest }: ContainerProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-container", className)} {...rest} />;
}
