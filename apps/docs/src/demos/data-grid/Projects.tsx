import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridColumn,
  DataGridHeader,
  type DataGridProps,
  DataGridRow,
} from "@raster/react";
import { useMemo, useState } from "react";
import { formatFrancs, PROJECTS, type Project } from "./project-data";

type SortDescriptor = NonNullable<DataGridProps["sortDescriptor"]>;
type SortKey = "name" | "year" | "budget";

export default function Projects() {
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const rows = useMemo(() => {
    const key = sort.column as SortKey;
    const sorted = [...PROJECTS].sort((a: Project, b: Project) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
    return sort.direction === "descending" ? sorted.reverse() : sorted;
  }, [sort]);
  return (
    <DataGrid
      caption="Studio projects"
      selectionMode="multiple"
      defaultSelectedKeys={["linie-7"]}
      sortDescriptor={sort}
      onSortChange={setSort}
      maxHeight="22rem"
    >
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader allowsSorting allowsResizing sticky defaultWidth={200} minWidth={140}>
          Project
        </DataGridColumn>
        <DataGridColumn id="client" allowsResizing defaultWidth={220} minWidth={140}>
          Client
        </DataGridColumn>
        <DataGridColumn id="discipline" defaultWidth={140}>
          Discipline
        </DataGridColumn>
        <DataGridColumn id="year" allowsSorting numeric defaultWidth={100}>
          Year
        </DataGridColumn>
        <DataGridColumn id="budget" allowsSorting numeric defaultWidth={140}>
          Budget (CHF)
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody>
        {rows.map((project) => (
          <DataGridRow key={project.id} id={project.id}>
            <DataGridCell sticky>{project.name}</DataGridCell>
            <DataGridCell>{project.client}</DataGridCell>
            <DataGridCell>{project.discipline}</DataGridCell>
            <DataGridCell numeric>{project.year}</DataGridCell>
            <DataGridCell numeric>{formatFrancs(project.budget)}</DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
}
