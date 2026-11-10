import { BarChart } from "@rasterdesign/react";

const data = [
  { discipline: "Wayfinding", budget: 420 },
  { discipline: "Identity", budget: 310 },
  { discipline: "Exhibition", budget: 260 },
  { discipline: "Digital", budget: 180 },
  { discipline: "Print", budget: 95 },
];

export default function BudgetByDiscipline() {
  return (
    <BarChart
      caption="Budget by discipline, CHF thousands"
      data={data}
      x="discipline"
      xLabel="Discipline"
      series={[{ key: "budget", label: "Budget" }]}
      orientation="horizontal"
      format={(value) => `${value}k`}
    />
  );
}
