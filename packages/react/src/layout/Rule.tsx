import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type RuleProps = Omit<ComponentPropsWithRef<"hr">, "children"> & {
  variant?: "default" | "strong" | "signal";
};

export function Rule({ className, variant = "default", ...rest }: RuleProps) {
  return (
    <hr className={cx("sw-rule", className)} data-variant={variant === "default" ? undefined : variant} {...rest} />
  );
}
