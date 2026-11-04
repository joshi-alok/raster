import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** Use "primary" at most once per view. Defaults to "secondary". */
  variant?: ButtonVariant;
};

export function Button({ variant = "secondary", type = "button", className, ...rest }: ButtonProps) {
  return <button type={type} className={cx("sw-button", className)} data-variant={variant} {...rest} />;
}
