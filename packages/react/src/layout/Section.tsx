import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type SectionProps<E extends ElementType = "section"> = PolymorphicProps<E>;

/** Vertical rhythm block; also a size container. */
export function Section<E extends ElementType = "section">({ as, className, ...rest }: SectionProps<E>) {
  const Component: ElementType = as ?? "section";
  return <Component className={cx("sw-section", className)} {...rest} />;
}
