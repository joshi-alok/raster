import { parseDate } from "@internationalized/date";
import { DateRangePicker } from "@rasterdesign/react";

export default function Period() {
  return (
    <DateRangePicker
      label="Project period"
      description="Five working days."
      defaultValue={{ start: parseDate("2026-03-09"), end: parseDate("2026-03-13") }}
    />
  );
}
