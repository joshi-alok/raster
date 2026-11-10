import { LineChart, type LineChartProps } from "@rasterdesign/react";

export const visitors = {
  caption: "Exhibition visitors, thousands",
  data: [
    { month: "Jan", zurich: 12, basel: 8, bern: 5 },
    { month: "Feb", zurich: 14, basel: 9, bern: 6 },
    { month: "Mar", zurich: 18, basel: 11, bern: 6 },
    { month: "Apr", zurich: 21, basel: 15, bern: 8 },
    { month: "May", zurich: 25, basel: 17, bern: 11 },
    { month: "Jun", zurich: 28, basel: 16, bern: 13 },
    { month: "Jul", zurich: 31, basel: 19, bern: 12 },
    { month: "Aug", zurich: 30, basel: 21, bern: 14 },
    { month: "Sep", zurich: 24, basel: 18, bern: 12 },
    { month: "Oct", zurich: 20, basel: 14, bern: 9 },
    { month: "Nov", zurich: 16, basel: 10, bern: 7 },
    { month: "Dec", zurich: 13, basel: 9, bern: 6 },
  ],
  x: "month",
  xLabel: "Month",
  series: [
    { key: "zurich", label: "Zürich" },
    { key: "basel", label: "Basel" },
    { key: "bern", label: "Bern" },
  ],
} satisfies LineChartProps;

export default function Visitors() {
  return <LineChart {...visitors} />;
}
