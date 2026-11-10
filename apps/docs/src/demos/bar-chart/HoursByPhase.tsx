import { BarChart } from "@rasterdesign/react";

const data = [
  { project: "Linie 7", research: 120, design: 340, production: 210 },
  { project: "Seebad", research: 80, design: 190, production: 260 },
  { project: "Parkleitsystem", research: 150, design: 280, production: 120 },
  { project: "Archiv", research: 60, design: 140, production: 90 },
];

export default function HoursByPhase() {
  return (
    <BarChart
      caption="Hours by phase"
      data={data}
      x="project"
      xLabel="Project"
      series={[
        { key: "research", label: "Research" },
        { key: "design", label: "Design" },
        { key: "production", label: "Production" },
      ]}
      stacked
    />
  );
}
