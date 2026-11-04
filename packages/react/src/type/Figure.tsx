import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type FigureProps = Omit<ComponentPropsWithRef<"figure">, "children"> & {
  caption: ReactNode;
  children: ReactNode;
};

export function Figure({ caption, children, className, ...rest }: FigureProps) {
  return (
    <figure className={cx("sw-figure", className)} {...rest}>
      {children}
      <figcaption className="sw-type-caption sw-text-secondary">{caption}</figcaption>
    </figure>
  );
}
