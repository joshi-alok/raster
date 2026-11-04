import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "display" | "h1" | "h2" | "h3" | "h4";

export type HeadingProps = ComponentPropsWithRef<"h1"> & {
  /** Semantic level: sets the element (h1–h6) and the document outline. */
  level: HeadingLevel;
  /** Visual size; defaults to the level's own size (5 and 6 use h4). */
  size?: HeadingSize;
};

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h4", 6: "h4" };

export function Heading({ level, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cx(`sw-type-${size ?? DEFAULT_SIZE[level]}`, className)} {...rest} />;
}
