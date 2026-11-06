import { Stat } from "@raster/react";

export default function Figures() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 12rem), 1fr))", gap: "var(--space-6)" }}>
      <Stat value="2,400" label="Members" change="+12% on last year" trend="up" />
      <Stat value="14" label="Stations" />
      <Stat value="−58%" label="Wrong-platform reports" change="−58% since launch" trend="down" />
    </div>
  );
}
