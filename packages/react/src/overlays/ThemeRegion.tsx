import { type ElementType, type ReactNode, useCallback, useRef } from "react";
import { UNSAFE_PortalProvider } from "react-aria";
import { cx } from "../utils/cx";
import type { PolymorphicProps } from "../utils/polymorphic";

export type ThemeRegionProps<E extends ElementType = "div"> = PolymorphicProps<
  E,
  {
    theme?: "alpine" | "zurich";
    mode?: "light" | "dark";
    children?: ReactNode;
  }
>;

/**
 * A section with its own theme and/or mode. Overlays (Select, Menu, Dialog, Tooltip) opened
 * inside it are portalled into the region, so they render in the region's theme too.
 */
export function ThemeRegion<E extends ElementType = "div">({
  as,
  className,
  theme,
  mode,
  children,
  ...rest
}: ThemeRegionProps<E>) {
  const Component: ElementType = as ?? "div";
  const hostRef = useRef<HTMLDivElement>(null);
  const getContainer = useCallback(() => hostRef.current, []);
  return (
    <Component className={cx("sw-theme-region", className)} data-theme={theme} data-mode={mode} {...rest}>
      <UNSAFE_PortalProvider getContainer={getContainer}>{children}</UNSAFE_PortalProvider>
      <div ref={hostRef} className="sw-portal-host" />
    </Component>
  );
}
