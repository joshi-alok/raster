import { ChevronDown } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Input,
  ListBox,
  Popover,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";
import { SelectItem, type SelectItemProps } from "./Select";

export type ComboBoxProps<T extends object> = Omit<AriaComboBoxProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    placeholder?: string;
    className?: string;
    /** ComboBoxItem elements, or a render function for `defaultItems` / `items`. */
    children: ReactNode | ((item: T) => ReactNode);
  };

/**
 * Type to filter a list of suggestions. The list opens in a popover, filtered as you type; arrow
 * keys move through it and Enter chooses. Pass `allowsCustomValue` to accept text not in the list.
 * Native twin: <input list> with a <datalist>, whose list is the browser's own.
 */
export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  children,
  ...rest
}: ComboBoxProps<T>) {
  return (
    <AriaComboBox className={cx("sw-field sw-combobox", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <div className="sw-combobox-control">
        <Input className="sw-input sw-combobox-input" placeholder={placeholder} />
        <AriaButton className="sw-combobox-button">
          <ChevronDown aria-hidden="true" />
        </AriaButton>
      </div>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover">
        <ListBox className="sw-listbox">{children}</ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export type ComboBoxItemProps = SelectItemProps;

/** One suggestion in a ComboBox. The same as SelectItem: weight 500 and a check when chosen. */
export const ComboBoxItem = SelectItem;
