import { Checkbox, Stack } from "@rasterdesign/react";

export default function States() {
  return (
    <Stack gap={3}>
      <Checkbox defaultSelected>Email me a receipt</Checkbox>
      <Checkbox>Add to the shared calendar</Checkbox>
      <Checkbox isIndeterminate>Select all projects</Checkbox>
      <Checkbox isDisabled>Archive automatically</Checkbox>
    </Stack>
  );
}
