import { isWeekend, parseDate } from "@internationalized/date";
import { Calendar } from "@raster/react";

export default function DeliveryDay() {
  return (
    <Calendar
      aria-label="Delivery day"
      defaultValue={parseDate("2026-03-12")}
      isDateUnavailable={(date) => isWeekend(date, "de-CH")}
    />
  );
}
