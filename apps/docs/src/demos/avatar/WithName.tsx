import { Avatar, Stack } from "@raster/react";

export default function WithName() {
  return (
    <Stack direction="row" gap={3}>
      <Avatar name="Nico Baumann" decorative />
      <span>Nico Baumann, senior designer</span>
    </Stack>
  );
}
