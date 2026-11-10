import { Select, SelectItem } from "@rasterdesign/react";

export default function Basic() {
  return (
    <Select label="Theme" description="Applies to new pages." defaultValue="alpine">
      <SelectItem id="alpine">Alpine</SelectItem>
      <SelectItem id="zurich">Zürich</SelectItem>
    </Select>
  );
}
