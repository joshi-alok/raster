import { Radio, RadioGroup } from "@rasterdesign/react";

export default function Basic() {
  return (
    <RadioGroup label="Paper size" description="Sets the print grid." defaultValue="a4">
      <Radio value="a4">A4</Radio>
      <Radio value="a3">A3</Radio>
      <Radio value="letter">US Letter</Radio>
    </RadioGroup>
  );
}
