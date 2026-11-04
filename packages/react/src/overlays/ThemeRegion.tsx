import { createContext, type ElementType, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type ThemeRegionValue = { theme?: "alpine" | "zurich"; mode?: "light" | "dark" };

const ThemeRegionContext = createContext<ThemeRegionValue>({});

/**
 * A section with its own theme and/or mode. Overlays (Select, Menu, Dialog, Tooltip) opened
 * inside it are portalled to a host at the end of <body> that carries the region's effective
 * theme/mode (own props, else the enclosing region's), so they render in the region's theme and
 * escape transformed, clipped or stacking-context ancestors.
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
  const parent = useContext(ThemeRegionContext);
  const effective = useMemo<ThemeRegionValue>(
    () => ({ theme: theme ?? parent.theme, mode: mode ?? parent.mode }),
    [theme, mode, parent.theme, parent.mode],
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Component className={cx("sw-theme-region", className)} data-theme={theme} data-mode={mode} {...rest}>
      <ThemeRegionContext.Provider value={effective}>
        <UNSAFE_PortalProvider getContainer={getContainer}>{children}</UNSAFE_PortalProvider>
      </ThemeRegionContext.Provider>
      {mounted &&
        createPortal(
          <div ref={hostRef} className="sw-portal-host" data-theme={effective.theme} data-mode={effective.mode} />,
          document.body,
        )}
    </Component>
  );
}
