import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type RevealProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    /** Reveal direct children one after another, in source order (row by row in a grid). */
    stagger?: boolean;
  }
>;

/**
 * Fades and lifts content in as it scrolls into view. Requires @rasterdesign/css/motion.css;
 * does nothing without it, in browsers without scroll-driven animations, or under reduced motion.
 * Never wrap a ThemeRegion's overlays in it: they portal to <body> and are unaffected anyway.
 */
export function Reveal<E extends ElementType = "div">({ as, className, stagger, ...rest }: RevealProps<E>) {
  const Component: ElementType = as ?? "div";
  return <Component className={cx("sw-reveal", className)} data-stagger={stagger ? "" : undefined} {...rest} />;
}
