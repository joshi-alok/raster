import { Button, DataGrid, DataGridBody, DataGridColumn, DataGridHeader, EmptyState } from "@raster/react";

export default function NoResults() {
  return (
    <DataGrid caption="Projects in 1998">
      <DataGridHeader>
        <DataGridColumn id="name" isRowHeader>
          Project
        </DataGridColumn>
        <DataGridColumn id="client">Client</DataGridColumn>
        <DataGridColumn id="year" numeric>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody
        emptyState={
          <EmptyState label="Projects" title="No projects match" headingLevel={3} action={<Button>Clear filters</Button>}>
            Nothing was finished in 1998. Try another year.
          </EmptyState>
        }
      >
        {[]}
      </DataGridBody>
    </DataGrid>
  );
}
