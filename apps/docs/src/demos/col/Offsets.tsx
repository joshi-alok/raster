import { Col, Grid } from "@raster/react";

export default function Offsets() {
  return (
    <Grid debug rowGap={3}>
      <Col span={{ 4: 3, 8: 4, 12: 6 }} start={{ 4: 2, 8: 5, 12: 7 }}>
        <div className="docs-cell">start 4:2 8:5 12:7</div>
      </Col>
      <Col span={{ 4: 2, 8: 4, 12: 4 }} start={{ 4: 1, 8: 3, 12: 5 }}>
        <div className="docs-cell">start 4:1 8:3 12:5</div>
      </Col>
    </Grid>
  );
}
