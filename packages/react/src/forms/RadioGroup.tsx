import type { ReactNode, RefAttributes } from "react";
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type RadioGroupProps = Omit<AriaRadioGroupProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
    children: ReactNode;
  };

export function RadioGroup({ label, description, errorMessage, className, children, ...rest }: RadioGroupProps) {
  return (
    <AriaRadioGroup className={cx("sw-field sw-radio-group", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <div className="sw-radio-list">{children}</div>
      <FieldError>{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}

export type RadioProps = Omit<AriaRadioProps, "className" | "children"> &
  RefAttributes<HTMLLabelElement> & {
    className?: string;
    children?: ReactNode;
  };

export function Radio({ className, children, ...rest }: RadioProps) {
  return (
    <AriaRadio className={cx("sw-radio", className)} {...rest}>
      <span className="sw-radio-dot" aria-hidden="true" />
      {children}
    </AriaRadio>
  );
}
