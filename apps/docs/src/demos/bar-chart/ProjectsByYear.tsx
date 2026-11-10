import { BarChart, type BarChartProps } from "@rasterdesign/react";

export const projectsByYear = {
  caption: "Projects by year",
  data: [
    { year: "2019", built: 3, planned: 1 },
    { year: "2020", built: 2, planned: 3 },
    { year: "2021", built: 4, planned: 2 },
    { year: "2022", built: 5, planned: 4 },
    { year: "2023", built: 4, planned: 6 },
    { year: "2024", built: 6, planned: 5 },
    { year: "2025", built: 7, planned: 3 },
  ],
  x: "year",
  xLabel: "Year",
  series: [
    { key: "built", label: "Built" },
    { key: "planned", label: "Planned" },
  ],
} satisfies BarChartProps;

export default function ProjectsByYear() {
  return <BarChart {...projectsByYear} />;
}
