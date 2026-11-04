import {
  createContext,
  type ElementType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
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

/** useLayoutEffect in the browser, useEffect on the server (avoids the SSR warning). */
const useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Attaches the portal host to <body> and keeps its theme/mode attributes in sync.
 * Rendered before the region's children: React runs an earlier sibling's layout effects first,
 * so the host is in the document before any initially open overlay focuses or measures itself.
 */
function PortalHost({ host, theme, mode }: { host: HTMLElement | null } & ThemeRegionValue) {
  useIsomorphicLayoutEffect(() => {
    if (!host) return;
    document.body.append(host);
    return () => host.remove();
  }, [host]);
  useIsomorphicLayoutEffect(() => {
    if (!host) return;
    if (theme) host.dataset.theme = theme;
    else delete host.dataset.theme;
    if (mode) host.dataset.mode = mode;
    else delete host.dataset.mode;
  }, [host, theme, mode]);
  return null;
}

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
  const parent = useContext(ThemeRegionContext);
  const effective = useMemo<ThemeRegionValue>(
    () => ({ theme: theme ?? parent.theme, mode: mode ?? parent.mode }),
    [theme, mode, parent.theme, parent.mode],
  );
  // Created during the first client render so overlays that start open have a container at once.
  const [host] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.className = "sw-portal-host";
    return el;
  });
  const getContainer = useCallback(() => host, [host]);
  return (
    <Component className={cx("sw-theme-region", className)} data-theme={theme} data-mode={mode} {...rest}>
      <PortalHost host={host} theme={effective.theme} mode={effective.mode} />
      <ThemeRegionContext.Provider value={effective}>
        <UNSAFE_PortalProvider getContainer={getContainer}>{children}</UNSAFE_PortalProvider>
      </ThemeRegionContext.Provider>
    </Component>
  );
}
