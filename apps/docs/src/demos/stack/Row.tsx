import { Stack, Tag } from "@raster/react";

export default function Row() {
  return (
    <Stack direction="row" gap={2}>
      <Tag>Grid</Tag>
      <Tag>Type</Tag>
      <Tag>Colour</Tag>
    </Stack>
  );
}
