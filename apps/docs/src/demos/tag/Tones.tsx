import { Stack, Tag } from "@raster/react";

export default function Tones() {
  return (
    <Stack direction="row" gap={2}>
      <Tag>Draft</Tag>
      <Tag tone="accent">In review</Tag>
      <Tag tone="success">Approved</Tag>
      <Tag tone="warning">Waiting</Tag>
      <Tag tone="danger">Blocked</Tag>
    </Stack>
  );
}
