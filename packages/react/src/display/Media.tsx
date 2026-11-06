import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type MediaRatio = "1:1" | "4:3" | "3:2" | "16:9" | "21:9";

export type MediaProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  /** Defaults to "16:9". */
  ratio?: MediaRatio;
  caption?: ReactNode;
  /** One <img>, <video>, <svg> or <iframe>; it covers the frame. */
  children: ReactNode;
};

/** An image, video or drawing in a frame of fixed ratio, so the page does not shift as it loads. */
export function Media({ ratio = "16:9", caption, children, className, ...rest }: MediaProps) {
  return (
    <figure className={cx("sw-figure sw-media", className)} data-ratio={ratio} {...rest}>
      <div className="sw-media-frame">{children}</div>
      {caption != null && <figcaption className="sw-type-caption sw-text-secondary">{caption}</figcaption>}
    </figure>
  );
}
