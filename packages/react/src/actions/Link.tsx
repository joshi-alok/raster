import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type LinkProps = ComponentPropsWithRef<"a"> & {
  /** Open in a new tab, show an arrow, and announce it to screen readers. */
  external?: boolean;
};

export function Link({ external, className, children, target, rel, ...rest }: LinkProps) {
  return (
    <a
      className={cx("sw-link", className)}
      target={external ? "_blank" : target}
      rel={external ? cx("noopener noreferrer", rel) : rel}
      {...rest}
    >
      {children}
      {external && (
        <>
          <ArrowUpRight aria-hidden="true" strokeWidth={1.5} />
          <span className="sw-sr-only"> (opens in a new tab)</span>
        </>
      )}
    </a>
  );
}
