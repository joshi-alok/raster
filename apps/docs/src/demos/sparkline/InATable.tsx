import { Sparkline, Table } from "@rasterdesign/react";

const rows = [
  { project: "Linie 7", hours: [32, 40, 38, 45, 50, 47] },
  { project: "Seebad", hours: [20, 18, 25, 22, 30, 34] },
  { project: "Parkleitsystem", hours: [44, 41, 36, 30, 28, 22] },
];

export default function InATable() {
  return (
    <Table caption="Hours per week, last six weeks">
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Trend</th>
          <th scope="col" data-numeric="">
            This week
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.project}>
            <th scope="row">{row.project}</th>
            <td>
              <Sparkline data={row.hours} label={`${row.project}, hours per week`} />
            </td>
            <td data-numeric="">{row.hours.at(-1)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
