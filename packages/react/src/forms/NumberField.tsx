import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Group,
  Input,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type NumberFieldProps = Omit<AriaNumberFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
  };

/**
 * A number with − and + buttons; arrow keys step the value. Use formatOptions for units and currency.
 * Native twin: <input type="number" class="sw-input sw-number-input"> with the browser's steppers.
 */
export function NumberField({ label, description, errorMessage, className, ...rest }: NumberFieldProps) {
  return (
    <AriaNumberField className={cx("sw-field sw-number", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-number-control">
        <AriaButton slot="decrement" className="sw-number-step">
          <span className="sw-number-sign" data-sign="minus" aria-hidden="true" />
        </AriaButton>
        <Input className="sw-input sw-number-input" />
        <AriaButton slot="increment" className="sw-number-step">
          <span className="sw-number-sign" data-sign="plus" aria-hidden="true" />
        </AriaButton>
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}
