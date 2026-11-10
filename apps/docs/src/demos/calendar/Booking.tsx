import { parseDate } from "@internationalized/date";
import { RangeCalendar } from "@rasterdesign/react";

export default function Booking() {
  return <RangeCalendar aria-label="Booking" defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }} />;
}
