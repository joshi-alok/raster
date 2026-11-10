import { NumberField } from "@rasterdesign/react";

export default function Copies() {
  return <NumberField label="Copies" defaultValue={2} minValue={1} maxValue={20} />;
}
