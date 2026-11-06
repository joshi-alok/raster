import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type SkeletonProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  /** "text" (default) for a line of body text, "heading", or "block" for media at 16:9. */
  shape?: "text" | "heading" | "block";
  /** Any CSS length, such as "60%". Defaults to the full width. */
  width?: string;
};

/** A placeholder while content loads. Put aria-busy="true" on the region that is loading. */
export function Skeleton({ shape = "text", width, className, style, ...rest }: SkeletonProps) {
  return (
    <span
      className={cx("sw-skeleton", className)}
      data-shape={shape}
      aria-hidden="true"
      style={width ? { ...style, inlineSize: width } : style}
      {...rest}
    />
  );
}
