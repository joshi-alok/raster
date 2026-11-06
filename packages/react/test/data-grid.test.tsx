import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, useState } from "react";
import type { Selection, SortDescriptor } from "react-aria-components";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, DataGridBody, DataGridCell, DataGridColumn, DataGridHeader, DataGridRow } from "../src/display/DataGrid";
import { EmptyState } from "../src/feedback/EmptyState";
import { expectAccessible } from "./axe";

type Project = { id: string; name: string; year: number };

const PROJECTS: Project[] = [
  { id: "linie", name: "Linie 7", year: 2022 },
  { id: "atlas", name: "Atlas", year: 2025 },
  { id: "velo", name: "Velo", year: 2024 },
];

function Projects({
  rows = PROJECTS,
  selectionMode = "none",
  onSelectionChange,
}: {
  rows?: Project[];
  selectionMode?: "none" | "multiple";
  onSelectionChange?: (keys: Selection) => void;
}) {
  const [sort, setSort] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const key = sort.column as "name" | "year";
        const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return sort.direction === "descending" ? -order : order;
      }),
    [rows, sort],
  );
  return (
    <DataGrid
      caption="Projects"
      selectionMode={selectionMode}
      onSelectionChange={onSelectionChange}
      sortDescriptor={sort}
      onSortChange={setSort}
    >
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader allowsSorting sticky allowsResizing>
          Project
        </DataGridColumn>
        <DataGridColumn id="year" allowsSorting numeric>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody emptyState={<EmptyState title="No projects match" />}>
        {sorted.map((project) => (
          <DataGridRow key={project.id} id={project.id}>
            <DataGridCell sticky>{project.name}</DataGridCell>
            <DataGridCell numeric>{project.year}</DataGridCell>
          </DataGridRow>
        ))}
      </DataGridBody>
    </DataGrid>
  );
}

/**
 * React Aria's ColumnResizer renders a visually hidden range input labelled "Resizer" inside the header,
 * and its aria-label joins the header's name from content. So the resizable Project column is named
 * "Project Resizer" (Year, which has no resizer, is just "Year").
 */
const PROJECT_HEADER = "Project Resizer";

const rowHeaders = () => screen.getAllByRole("rowheader").map((cell) => cell.textContent);

describe("DataGrid", () => {
  it("is a grid named by its visible caption, carrying the Table classes", () => {
    render(<Projects />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(grid).toHaveClass("sw-table", "sw-data-grid");
    expect(grid).not.toHaveClass("sw-data-grid-selectable");
    expect(screen.getByText("Projects", { selector: ".sw-data-grid-caption" })).toBeInTheDocument();
    expect(grid.closest(".sw-data-grid-scroll")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: PROJECT_HEADER })).toHaveClass("sw-data-grid-column", "sw-data-grid-sticky");
    expect(screen.getByRole("columnheader", { name: "Year" })).toHaveClass("sw-data-grid-numeric");
    expect(screen.getByRole("rowheader", { name: "Atlas" })).toHaveClass("sw-data-grid-cell", "sw-data-grid-sticky");
  });

  it("sorts from the header and shows the direction with aria-sort and a chevron", async () => {
    const user = userEvent.setup();
    render(<Projects />);
    const project = screen.getByRole("columnheader", { name: PROJECT_HEADER });
    const year = screen.getByRole("columnheader", { name: "Year" });
    expect(project).toHaveAttribute("aria-sort", "ascending");
    expect(project.querySelector(".sw-data-grid-sort-icon")).toHaveAttribute("data-direction", "ascending");
    expect(year.querySelector(".sw-data-grid-sort-icon")).not.toHaveAttribute("data-direction");
    expect(rowHeaders()).toEqual(["Atlas", "Linie 7", "Velo"]);
    await user.click(year);
    expect(year).toHaveAttribute("aria-sort", "ascending");
    expect(rowHeaders()).toEqual(["Linie 7", "Velo", "Atlas"]);
    await user.click(year);
    expect(year).toHaveAttribute("aria-sort", "descending");
    expect(year.querySelector(".sw-data-grid-sort-icon")).toHaveAttribute("data-direction", "descending");
    expect(rowHeaders()).toEqual(["Atlas", "Velo", "Linie 7"]);
  });

  it("adds a checkbox column and Select all for multiple selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Projects selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(grid).toHaveClass("sw-data-grid-selectable");
    const selectAll = screen.getByRole("checkbox", { name: /select all/i });
    expect(selectAll.closest("th")).toHaveClass("sw-data-grid-select");
    const velo = screen.getByRole("rowheader", { name: "Velo" }).closest("tr") as HTMLElement;
    await user.click(within(velo).getByRole("checkbox"));
    expect([...(onSelectionChange.mock.calls.at(-1)?.[0] as Set<string>)]).toEqual(["velo"]);
    expect(velo).toHaveAttribute("aria-selected", "true");
    await user.click(selectAll);
    expect(onSelectionChange).toHaveBeenLastCalledWith("all");
  });

  it("shows the empty state inside the grid when there are no rows", () => {
    render(<Projects rows={[]} />);
    const grid = screen.getByRole("grid", { name: "Projects" });
    expect(within(grid).getByText("No projects match")).toBeInTheDocument();
  });

  it("puts a resize handle in resizable columns only", () => {
    render(<Projects />);
    expect(screen.getByRole("columnheader", { name: PROJECT_HEADER }).querySelector(".sw-data-grid-resizer")).not.toBeNull();
    expect(screen.getByRole("columnheader", { name: "Year" }).querySelector(".sw-data-grid-resizer")).toBeNull();
  });

  it("has no structural accessibility violations", async () => {
    const { container } = render(<Projects selectionMode="multiple" />);
    await expectAccessible(container);
  });
});
