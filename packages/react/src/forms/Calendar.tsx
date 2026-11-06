import { ChevronLeft, ChevronRight } from "lucide-react";
import type { RefAttributes } from "react";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  type CalendarProps as AriaCalendarProps,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  type DateValue,
  Heading,
  RangeCalendar as AriaRangeCalendar,
  type RangeCalendarProps as AriaRangeCalendarProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

/**
 * The month heading between previous and next buttons, and the day grid. Shared by Calendar,
 * RangeCalendar and the calendars the date pickers open. React Aria names the buttons
 * ("Previous", "Next") and the grid (the calendar's label and the month).
 */
export function CalendarBody() {
  return (
    <>
      {/* A div, not <header>: a header outside a sectioning element is a banner landmark. */}
      <div className="sw-calendar-header">
        <AriaButton slot="previous" className="sw-calendar-nav">
          <ChevronLeft aria-hidden="true" />
        </AriaButton>
        <Heading className="sw-calendar-heading" />
        <AriaButton slot="next" className="sw-calendar-nav">
          <ChevronRight aria-hidden="true" />
        </AriaButton>
      </div>
      <CalendarGrid className="sw-calendar-grid" weekdayStyle="narrow">
        <CalendarGridHeader>
          {(day) => <CalendarHeaderCell className="sw-calendar-weekday">{day}</CalendarHeaderCell>}
        </CalendarGridHeader>
        <CalendarGridBody>{(date) => <CalendarCell date={date} className="sw-calendar-cell" />}</CalendarGridBody>
      </CalendarGrid>
    </>
  );
}

export type CalendarProps<T extends DateValue> = Omit<AriaCalendarProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
  };

/**
 * A month of days to choose one from. Needs aria-label (or aria-labelledby) when it stands alone.
 * Values are CalendarDate objects from @internationalized/date, such as parseDate("2026-03-12").
 * There is no native twin: without React, use <input type="date"> (see DatePicker).
 */
export function Calendar<T extends DateValue>({ className, ...rest }: CalendarProps<T>) {
  return (
    <AriaCalendar className={cx("sw-calendar", className)} {...rest}>
      <CalendarBody />
    </AriaCalendar>
  );
}

export type RangeCalendarProps<T extends DateValue> = Omit<AriaRangeCalendarProps<T>, "className" | "children"> &
  RefAttributes<HTMLDivElement> & {
    className?: string;
  };

/** A month of days to choose a range from: solid start and end, a subtle fill between. */
export function RangeCalendar<T extends DateValue>({ className, ...rest }: RangeCalendarProps<T>) {
  return (
    <AriaRangeCalendar className={cx("sw-calendar sw-range-calendar", className)} {...rest}>
      <CalendarBody />
    </AriaRangeCalendar>
  );
}
