import { Heading, Stack } from "@raster/react";

export default function LevelsAndSizes() {
  return (
    <Stack gap={4}>
      <Heading level={3}>Level 3 at its default size</Heading>
      <Heading level={3} size="h4">
        Level 3 set at h4 size
      </Heading>
      <Heading level={4} size="h2">
        Level 4 set at h2 size
      </Heading>
    </Stack>
  );
}
