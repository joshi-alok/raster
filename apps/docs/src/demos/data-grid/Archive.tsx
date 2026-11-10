import { DataGrid, DataGridBody, DataGridCell, DataGridColumn, DataGridHeader, DataGridRow } from "@rasterdesign/react";

const CLIENTS = ["Kunsthalle Basel", "Stadt Bern", "KKL Luzern", "ETH Bibliothek", "Lido Lugano", "Atelier Biel"];

/** 5,000 archive entries, generated so the screenshots never change. */
const ENTRIES = Array.from({ length: 5000 }, (_, i) => ({
  id: `entry-${i + 1}`,
  number: i + 1,
  title: `Archive entry ${String(i + 1).padStart(4, "0")}`,
  client: CLIENTS[i % CLIENTS.length],
  year: 1960 + (i % 66),
}));

export default function Archive() {
  return (
    <DataGrid caption="Archive, 5,000 entries" maxHeight="24rem" virtualized={{ rowHeight: 48 }}>
      <DataGridHeader>
        <DataGridColumn id="number" numeric defaultWidth={90}>
          No.
        </DataGridColumn>
        <DataGridColumn id="title" isRowHeader defaultWidth={240}>
          Title
        </DataGridColumn>
        <DataGridColumn id="client" defaultWidth={200}>
          Client
        </DataGridColumn>
        <DataGridColumn id="year" numeric defaultWidth={90}>
          Year
        </DataGridColumn>
      </DataGridHeader>
      <DataGridBody items={ENTRIES}>
        {(entry) => (
          <DataGridRow id={entry.id}>
            <DataGridCell numeric>{entry.number}</DataGridCell>
            <DataGridCell>{entry.title}</DataGridCell>
            <DataGridCell>{entry.client}</DataGridCell>
            <DataGridCell numeric>{entry.year}</DataGridCell>
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}
