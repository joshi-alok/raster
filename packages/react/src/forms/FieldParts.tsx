import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps,
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
  Text as AriaText,
  type TextProps as AriaTextProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type FieldLabelProps = AriaLabelProps;

/** The visible label of a form control; React Aria wires it to the control. */
export function FieldLabel({ className, ...rest }: FieldLabelProps) {
  return <AriaLabel className={cx("sw-field-label", className)} {...rest} />;
}

export type FieldDescriptionProps = Omit<AriaTextProps, "slot">;

/** Help text, announced with the control via aria-describedby. */
export function FieldDescription({ className, ...rest }: FieldDescriptionProps) {
  return <AriaText slot="description" className={cx("sw-field-description", className)} {...rest} />;
}

export type FieldErrorProps = Omit<AriaFieldErrorProps, "className"> & { className?: string };

/** Shown only while the field is invalid; announced with the control. */
export function FieldError({ className, ...rest }: FieldErrorProps) {
  return <AriaFieldError className={cx("sw-field-error", className)} {...rest} />;
}
