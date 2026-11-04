import type { ElementType } from "react";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type TextProps<E extends ElementType = "p"> = PolymorphicProps<
  E,
  {
    size?: "body" | "caption";
    tone?: "primary" | "secondary" | "muted";
    /** Cap the line length at 66 characters. */
    measure?: boolean;
    /** Set in Geist Mono, e.g. for figures. */
    mono?: boolean;
  }
>;

export function Text<E extends ElementType = "p">({
  as,
  className,
  size = "body",
  tone = "primary",
  measure,
  mono,
  ...rest
}: TextProps<E>) {
  const Component: ElementType = as ?? "p";
  return (
    <Component
      className={cx(
        `sw-type-${size}`,
        tone !== "primary" && `sw-text-${tone}`,
        measure && "sw-measure",
        mono && "sw-mono",
        className,
      )}
      {...rest}
    />
  );
}
