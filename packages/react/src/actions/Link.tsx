import { ArrowUpRight } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type LinkProps = Omit<AriaLinkProps, "className" | "children"> &
  RefAttributes<HTMLAnchorElement> & {
    className?: string;
    children?: ReactNode;
    /** Open in a new tab, show an arrow, and announce it to screen readers. */
    external?: boolean;
  };

/** React Aria link: `onPress` (not onClick), `isDisabled`; gets aria-current inside Breadcrumbs. */
export function Link({ external, className, children, target, rel, ...rest }: LinkProps) {
  return (
    <AriaLink
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
    </AriaLink>
  );
}
