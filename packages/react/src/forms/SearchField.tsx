import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Input,
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

export type SearchFieldProps = Omit<AriaSearchFieldProps, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    label: ReactNode;
    description?: ReactNode;
    errorMessage?: ReactNode;
    placeholder?: string;
    /** Accessible name of the clear button. Defaults to "Clear search". */
    clearLabel?: string;
    className?: string;
  };

/**
 * A search input. Escape or the clear button empties it; Enter submits.
 * Native twin: <input type="search"> plus a <button class="sw-search-clear">.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  clearLabel = "Clear search",
  className,
  ...rest
}: SearchFieldProps) {
  return (
    <AriaSearchField className={cx("sw-field sw-search", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <div className="sw-search-control">
        <Input className="sw-input sw-search-input" placeholder={placeholder} />
        <AriaButton className="sw-search-clear" aria-label={clearLabel}>
          <span className="sw-search-clear-icon" aria-hidden="true" />
        </AriaButton>
      </div>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
    </AriaSearchField>
  );
}
