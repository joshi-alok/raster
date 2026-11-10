import { Slider } from "@rasterdesign/react";

export default function Gutter() {
  return <Slider label="Gutter (px)" minValue={16} maxValue={32} defaultValue={24} />;
}
