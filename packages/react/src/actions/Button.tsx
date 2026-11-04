import type { RefAttributes } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = Omit<AriaButtonProps, "className"> &
  RefAttributes<HTMLButtonElement> & {
    /** Use "primary" at most once per view. Defaults to "secondary". */
    variant?: ButtonVariant;
    className?: string;
  };

/**
 * React Aria button: use `onPress` (not onClick) and `isDisabled`. Defaults to type="button".
 * Works as the trigger child of React Aria dialogs, menus and tooltips.
 */
export function Button({ variant = "secondary", className, ...rest }: ButtonProps) {
  return <AriaButton className={cx("sw-button", className)} data-variant={variant} {...rest} />;
}
