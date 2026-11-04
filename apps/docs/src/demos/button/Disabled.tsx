import { Button, Stack } from "@raster/react";

export default function Disabled() {
  return (
    <Stack direction="row" gap={3}>
      <Button variant="primary" isDisabled>
        Save
      </Button>
      <Button isDisabled>Cancel</Button>
    </Stack>
  );
}
