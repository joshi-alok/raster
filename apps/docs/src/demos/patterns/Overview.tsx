import { Sparkline, Stack, Stat, Table } from "@raster/react";

const FIGURES = [
  { value: "14", label: "Projects running", change: "+3 on last quarter", trend: "up" as const, data: [9, 10, 10, 11, 12, 14] },
  { value: "86%", label: "Delivered on time", change: "−4 points on last quarter", trend: "down" as const, data: [92, 91, 90, 90, 88, 86] },
];

const ROWS = [
  { project: "Museum wayfinding", hours: "412", budget: "68%" },
  { project: "Annual report", hours: "126", budget: "91%" },
  { project: "Type specimen", hours: "58", budget: "24%" },
];

export default function Overview() {
  return (
    <Stack gap={6}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {FIGURES.map((f) => (
          <Stack key={f.label} gap={3}>
            <Stat value={f.value} label={f.label} change={f.change} trend={f.trend} />
            <Sparkline data={f.data} label={`${f.label}, last 6 quarters`} />
          </Stack>
        ))}
      </div>
      <Table caption="Projects this quarter">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col" data-numeric="">
              Hours
            </th>
            <th scope="col" data-numeric="">
              Budget used
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.project}>
              <td>{r.project}</td>
              <td data-numeric="">{r.hours}</td>
              <td data-numeric="">{r.budget}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
