import { Table } from "@raster/react";

export default function Projects() {
  return (
    <Table caption="Studio projects" striped>
      <thead>
        <tr>
          <th scope="col">Project</th>
          <th scope="col">Lead</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Museum wayfinding</td>
          <td>A. Keller</td>
          <td>12 Nov</td>
        </tr>
        <tr>
          <td>Annual report</td>
          <td>M. Rossi</td>
          <td>28 Nov</td>
        </tr>
        <tr>
          <td>Type specimen</td>
          <td>L. Weber</td>
          <td>5 Dec</td>
        </tr>
      </tbody>
    </Table>
  );
}
