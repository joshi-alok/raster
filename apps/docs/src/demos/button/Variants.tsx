import { Button, Stack } from "@rasterdesign/react";

export default function Variants() {
  return (
    <Stack direction="row" gap={3}>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete</Button>
    </Stack>
  );
}
