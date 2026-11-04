import type { ReactNode, RefAttributes } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  MenuTrigger,
  Popover,
  type Placement,
  Separator,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { MenuTrigger };

export type MenuProps<T extends object> = Omit<AriaMenuProps<T>, "className"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    /** Where the menu opens relative to its trigger. Defaults to "bottom start". */
    placement?: Placement;
  };

/** A menu of actions. Place inside MenuTrigger after the trigger Button. */
export function Menu<T extends object>({ className, placement = "bottom start", ...rest }: MenuProps<T>) {
  return (
    <Popover className="sw-popover" placement={placement}>
      <AriaMenu className={cx("sw-menu", className)} {...rest} />
    </Popover>
  );
}

export type MenuItemProps = Omit<AriaMenuItemProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
    /** "danger" for destructive actions. */
    variant?: "default" | "danger";
  };

export function MenuItem({ className, children, variant = "default", ...rest }: MenuItemProps) {
  return (
    <AriaMenuItem
      className={cx("sw-menu-item", className)}
      data-variant={variant === "danger" ? "danger" : undefined}
      textValue={typeof children === "string" ? children : undefined}
      {...rest}
    >
      {children}
    </AriaMenuItem>
  );
}

export function MenuSeparator() {
  return <Separator className="sw-menu-separator" />;
}
