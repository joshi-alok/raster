import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button as AriaButton, Disclosure as AriaDisclosure, DisclosurePanel } from "react-aria-components";
import { cx } from "../utils/cx";

export type SideNavProps = ComponentPropsWithRef<"nav"> & {
  /** SideNavLink and SideNavGroup elements. */
  children: ReactNode;
};

/** Section navigation. Name the landmark with aria-label; it defaults to "Section". */
export function SideNav({ children, className, "aria-label": ariaLabel = "Section", ...rest }: SideNavProps) {
  return (
    <nav className={cx("sw-sidenav", className)} aria-label={ariaLabel} {...rest}>
      <ul className="sw-sidenav-list">{children}</ul>
    </nav>
  );
}

export type SideNavLinkProps = Omit<ComponentPropsWithRef<"a">, "aria-current"> & {
  href: string;
  /** Marks this link as the current page. */
  current?: boolean;
};

export function SideNavLink({ current = false, className, children, ...rest }: SideNavLinkProps) {
  return (
    <li>
      <a className={cx("sw-sidenav-link", className)} aria-current={current ? "page" : undefined} {...rest}>
        {children}
      </a>
    </li>
  );
}

export type SideNavGroupProps = {
  /** The group's label; also its toggle button's name. */
  title: ReactNode;
  children: ReactNode;
  /** Defaults to true. */
  defaultExpanded?: boolean;
  className?: string;
};

/** A collapsible group of links. Native twin: <details class="sw-sidenav-group" open>. */
export function SideNavGroup({ title, children, defaultExpanded = true, className }: SideNavGroupProps) {
  return (
    <li>
      <AriaDisclosure className={cx("sw-sidenav-group", className)} defaultExpanded={defaultExpanded}>
        <AriaButton slot="trigger" className="sw-sidenav-group-title">
          <span>{title}</span>
          <span className="sw-disclosure-icon" aria-hidden="true" />
        </AriaButton>
        <DisclosurePanel className="sw-sidenav-panel">
          <ul className="sw-sidenav-list">{children}</ul>
        </DisclosurePanel>
      </AriaDisclosure>
    </li>
  );
}
