import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type HeaderProps = Omit<ComponentPropsWithRef<"header">, "children"> & {
  /** Logo or site name, usually a link home. */
  brand: ReactNode;
  /** Navigation links (Link components; mark the current page with aria-current="page"). */
  children?: ReactNode;
  /** Controls at the inline end, such as a theme switch. */
  actions?: ReactNode;
  /** Name of the navigation landmark. Defaults to "Main". */
  navLabel?: string;
  /** Target of the skip link. Defaults to "#main"; give the main element that id and tabIndex={-1}. */
  skipTo?: string;
  /** Stick to the top of the viewport. Defaults to true. */
  sticky?: boolean;
};

/** The site banner: skip link, brand, primary navigation and actions. */
export function Header({
  brand,
  children,
  actions,
  navLabel = "Main",
  skipTo = "#main",
  sticky = true,
  className,
  ...rest
}: HeaderProps) {
  return (
    <header className={cx("sw-header", className)} data-sticky={sticky ? "" : undefined} {...rest}>
      <a className="sw-skip-link" href={skipTo}>
        Skip to content
      </a>
      <div className="sw-header-inner">
        <div className="sw-header-brand">{brand}</div>
        {children != null && (
          <nav className="sw-header-nav" aria-label={navLabel}>
            {children}
          </nav>
        )}
        {actions != null && <div className="sw-header-actions">{actions}</div>}
      </div>
    </header>
  );
}
