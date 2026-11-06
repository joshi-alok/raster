import { Media } from "@raster/react";

export default function Columns() {
  return (
    <Media ratio="4:3" caption="Twelve columns at 4:3. The frame keeps its shape before the image loads.">
      <svg viewBox="0 0 400 300" role="img" aria-label="Twelve pale columns across the frame">
        <g fill="currentColor" opacity="0.15">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={8 + i * 32.5} y="0" width="24" height="300" />
          ))}
        </g>
      </svg>
    </Media>
  );
}
