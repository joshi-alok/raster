import { Check, Minus } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "../utils/cx";

export type CheckboxProps = Omit<AriaCheckboxProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

export function Checkbox({ className, children, ...rest }: CheckboxProps) {
  return (
    <AriaCheckbox className={cx("sw-checkbox", className)} {...rest}>
      {({ isSelected, isIndeterminate }) => (
        <>
          <span className="sw-checkbox-box" aria-hidden="true">
            {isIndeterminate ? <Minus /> : isSelected ? <Check /> : null}
          </span>
          {children}
        </>
      )}
    </AriaCheckbox>
  );
}
