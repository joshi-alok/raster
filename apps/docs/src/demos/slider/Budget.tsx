import { Slider } from "@raster/react";

export default function Budget() {
  return (
    <Slider
      label="Budget (CHF thousands)"
      minValue={20}
      maxValue={150}
      step={5}
      defaultValue={[40, 90]}
      thumbLabels={["Minimum", "Maximum"]}
    />
  );
}
