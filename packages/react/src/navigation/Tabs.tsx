import type { ReactNode, RefAttributes } from "react";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type TabsProps = Omit<AriaTabsProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function Tabs({ className, ...rest }: TabsProps) {
  return <AriaTabs className={cx("sw-tabs", className)} {...rest} />;
}

export type TabListProps = Omit<AriaTabListProps<object>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

/** Requires an accessible name: aria-label or aria-labelledby. */
export function TabList({ className, ...rest }: TabListProps) {
  return <AriaTabList className={cx("sw-tab-list", className)} {...rest} />;
}

export type TabProps = Omit<AriaTabProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function Tab({ className, ...rest }: TabProps) {
  return <AriaTab className={cx("sw-tab", className)} {...rest} />;
}

export type TabPanelProps = Omit<AriaTabPanelProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & { className?: string; children: ReactNode };

export function TabPanel({ className, ...rest }: TabPanelProps) {
  return <AriaTabPanel className={cx("sw-tab-panel", className)} {...rest} />;
}
