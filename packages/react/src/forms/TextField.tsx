import type { ReactNode, RefAttributes } from "react";
import {
  Input,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

type BaseProps = Omit<AriaTextFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    /** Shown when the field is invalid (isInvalid or failed validation). */
    errorMessage?: ReactNode;
    placeholder?: string;
    className?: string;
  };

export type TextFieldProps = BaseProps;

export function TextField({ label, description, errorMessage, placeholder, className, ...rest }: TextFieldProps) {
  return (
    <AriaTextField className={cx("sw-field", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Input className="sw-input" placeholder={placeholder} />
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}

export type TextAreaProps = BaseProps & { rows?: number };

export function TextArea({ label, description, errorMessage, placeholder, rows, className, ...rest }: TextAreaProps) {
  return (
    <AriaTextField className={cx("sw-field", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <AriaTextArea className="sw-input sw-textarea" placeholder={placeholder} rows={rows} />
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
