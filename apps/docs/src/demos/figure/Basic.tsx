import { Figure } from "@raster/react";

export default function Basic() {
  return (
    <Figure caption="Figure 1 — 12 columns, 11 gutters.">
      <svg viewBox="0 0 236 60" width="100%" role="img" aria-label="Twelve vertical bars of equal width">
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={i * 20} y="0" width="16" height="60" fill="currentColor" opacity="0.15" />
        ))}
      </svg>
    </Figure>
  );
}
