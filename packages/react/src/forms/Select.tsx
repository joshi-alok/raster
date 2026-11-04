import { Check, ChevronDown } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  SelectValue,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type SelectProps<T extends object> = Omit<AriaSelectProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    className?: string;
    /** Optional data for dynamic options; pass a render function as children. */
    items?: Iterable<T>;
    children: ReactNode | ((item: T) => ReactNode);
  };

/**
 * Single-select dropdown. The list opens in a popover portalled to document.body,
 * so it uses the root theme (a theme-aware portal arrives with Plan 3 overlays).
 */
export function Select<T extends object>({
  label,
  description,
  errorMessage,
  className,
  items,
  children,
  ...rest
}: SelectProps<T>) {
  return (
    <AriaSelect className={cx("sw-field sw-select", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <AriaButton className="sw-input sw-select-trigger">
        <SelectValue className="sw-select-value" />
        <ChevronDown aria-hidden="true" />
      </AriaButton>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover">
        <ListBox className="sw-listbox" items={items}>
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export type SelectItemProps = Omit<ListBoxItemProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
    children: ReactNode;
  };

export function SelectItem({ className, children, ...rest }: SelectItemProps) {
  return (
    <ListBoxItem
      className={cx("sw-listbox-item", className)}
      textValue={typeof children === "string" ? children : undefined}
      {...rest}
    >
      {({ isSelected }) => (
        <>
          {children}
          {isSelected && <Check aria-hidden="true" />}
        </>
      )}
    </ListBoxItem>
  );
}
