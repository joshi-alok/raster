import { Avatar, Stack } from "@rasterdesign/react";

export default function Sizes() {
  return (
    <Stack direction="row" gap={4}>
      <Avatar name="Lea Brunner" size="sm" />
      <Avatar name="Jonas Imhof" />
      <Avatar name="Mara Keller" size="lg" />
    </Stack>
  );
}
