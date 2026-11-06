import { parseDate } from "@internationalized/date";
import { DatePicker } from "@raster/react";

export default function Delivery() {
  return (
    <DatePicker
      label="Delivery date"
      description="From 2 March 2026."
      defaultValue={parseDate("2026-03-12")}
      minValue={parseDate("2026-03-02")}
    />
  );
}
