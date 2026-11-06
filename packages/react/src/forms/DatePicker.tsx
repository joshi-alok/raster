import { Calendar as CalendarIcon } from "lucide-react";
import type { ReactNode, RefAttributes } from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  DateInput,
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  DateRangePicker as AriaDateRangePicker,
  type DateRangePickerProps as AriaDateRangePickerProps,
  DateSegment,
  type DateValue,
  Dialog,
  Group,
  Popover,
  RangeCalendar as AriaRangeCalendar,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { CalendarBody } from "./Calendar";
import { FieldDescription, FieldError, FieldLabel } from "./FieldParts";

type FieldText = {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
};

/** Day, month and year segments, in the order and with the separators of the reader's locale. */
function Segments({ slot }: { slot?: "start" | "end" }) {
  return (
    <DateInput slot={slot} className="sw-date-input">
      {(segment) => <DateSegment segment={segment} className="sw-date-segment" />}
    </DateInput>
  );
}

/** React Aria names this button "Calendar". */
function CalendarButton() {
  return (
    <AriaButton className="sw-date-button">
      <CalendarIcon aria-hidden="true" />
    </AriaButton>
  );
}

export type DatePickerProps<T extends DateValue> = Omit<AriaDatePickerProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> &
  FieldText;

/**
 * A date field: type into the day, month and year segments (arrow keys step them), or open the
 * calendar from the button. Values are CalendarDate objects from @internationalized/date.
 * Native twin: <input type="date">, whose calendar is the browser's own.
 */
export function DatePicker<T extends DateValue>({ label, description, errorMessage, className, ...rest }: DatePickerProps<T>) {
  return (
    <AriaDatePicker className={cx("sw-field sw-date-picker", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-input sw-date-field">
        <Segments />
        <CalendarButton />
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover sw-calendar-popover" placement="bottom start">
        <Dialog className="sw-calendar-dialog">
          <AriaCalendar className="sw-calendar">
            <CalendarBody />
          </AriaCalendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

export type DateRangePickerProps<T extends DateValue> = Omit<AriaDateRangePickerProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> &
  FieldText;

/**
 * A start and an end date in one field, with a range calendar.
 * Native twin: two <input type="date"> fields, From and To, in a fieldset with a legend.
 */
export function DateRangePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  className,
  ...rest
}: DateRangePickerProps<T>) {
  return (
    <AriaDateRangePicker className={cx("sw-field sw-date-picker sw-date-range-picker", className)} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <Group className="sw-input sw-date-field">
        <Segments slot="start" />
        <span className="sw-date-range-dash" aria-hidden="true">
          –
        </span>
        <Segments slot="end" />
        <CalendarButton />
      </Group>
      {description != null && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="sw-popover sw-calendar-popover" placement="bottom start">
        <Dialog className="sw-calendar-dialog">
          <AriaRangeCalendar className="sw-calendar sw-range-calendar">
            <CalendarBody />
          </AriaRangeCalendar>
        </Dialog>
      </Popover>
    </AriaDateRangePicker>
  );
}
