import type { ReactNode, RefAttributes } from "react";
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type SwitchProps = Omit<AriaSwitchProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

/** An on/off setting that takes effect immediately; use Checkbox for form submissions. */
export function Switch({ className, children, ...rest }: SwitchProps) {
  return (
    <AriaSwitch className={cx("sw-switch", className)} {...rest}>
      <span className="sw-switch-track" aria-hidden="true">
        <span className="sw-switch-thumb" />
      </span>
      {children}
    </AriaSwitch>
  );
}
