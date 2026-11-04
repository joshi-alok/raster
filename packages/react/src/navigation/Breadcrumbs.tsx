import type { ReactNode } from "react";
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  type BreadcrumbsProps as AriaBreadcrumbsProps,
  type Key,
} from "react-aria-components";
import { Link } from "../actions/Link";
import { cx } from "../utils/cx";

export type BreadcrumbsProps = Omit<AriaBreadcrumbsProps<object>, "className" | "children" | "aria-label"> & {
  className?: string;
  children: ReactNode;
  /** Landmark name. Defaults to "Breadcrumbs". */
  "aria-label"?: string;
};

/** A trail of links to the current page, inside a named navigation landmark. */
export function Breadcrumbs({ className, children, "aria-label": label = "Breadcrumbs", ...rest }: BreadcrumbsProps) {
  return (
    <nav aria-label={label}>
      <AriaBreadcrumbs className={cx("sw-breadcrumbs", className)} {...rest}>
        {children}
      </AriaBreadcrumbs>
    </nav>
  );
}

export type BreadcrumbProps = {
  /** Omit for the current page (normally the last item). */
  href?: string;
  children: ReactNode;
  className?: string;
  id?: Key;
};

export function Breadcrumb({ href, children, className, id }: BreadcrumbProps) {
  return (
    <AriaBreadcrumb id={id} className={cx("sw-breadcrumb", className)}>
      {({ isCurrent }) => (
        <>
          <Link href={href}>{children}</Link>
          {!isCurrent && (
            <span className="sw-breadcrumb-separator" aria-hidden="true">
              /
            </span>
          )}
        </>
      )}
    </AriaBreadcrumb>
  );
}
