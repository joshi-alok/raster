import { LineChart } from "@raster/react";

const data = [
  { week: "W1", kwh: 412 },
  { week: "W2", kwh: 398 },
  { week: "W3", kwh: 455 },
  { week: "W4", kwh: 430 },
  { week: "W5", kwh: 380 },
  { week: "W6", kwh: 362 },
];

export default function EnergyUse() {
  return (
    <LineChart
      caption="Studio energy use, kWh per week"
      data={data}
      x="week"
      xLabel="Week"
      series={[{ key: "kwh", label: "Energy" }]}
      domain={[0, 500]}
      area
    />
  );
}
