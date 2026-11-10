import { Col, Grid } from "@rasterdesign/react";

export default function Spans() {
  return (
    <Grid debug rowGap={3}>
      <Col span={{ 8: 5, 12: 8 }}>
        <div className="docs-cell">span 8:5 12:8</div>
      </Col>
      <Col span={{ 8: 3, 12: 4 }}>
        <div className="docs-cell">span 8:3 12:4</div>
      </Col>
      <Col span={{ 4: 2, 8: 2, 12: 3 }}>
        <div className="docs-cell">span 4:2 8:2 12:3</div>
      </Col>
      <Col span={{ 4: 2, 8: 6, 12: 9 }}>
        <div className="docs-cell">span 4:2 8:6 12:9</div>
      </Col>
    </Grid>
  );
}
