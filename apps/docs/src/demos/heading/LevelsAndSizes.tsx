import { Heading, Stack } from "@raster/react";

export default function LevelsAndSizes() {
  return (
    <Stack gap={4}>
      <Heading level={2}>Level 2 at its default size</Heading>
      <Heading level={2} size="h4">
        Level 2 set at h4 size
      </Heading>
      <Heading level={3} size="h2">
        Level 3 set at h2 size
      </Heading>
    </Stack>
  );
}
