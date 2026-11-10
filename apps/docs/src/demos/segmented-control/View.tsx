import { Segment, SegmentedControl } from "@rasterdesign/react";

export default function View() {
  return (
    <SegmentedControl label="View" defaultSelectedKey="grid">
      <Segment id="grid">Grid</Segment>
      <Segment id="list">List</Segment>
      <Segment id="map">Map</Segment>
    </SegmentedControl>
  );
}
