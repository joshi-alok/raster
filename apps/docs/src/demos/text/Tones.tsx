import { Stack, Text } from "@raster/react";

export default function Tones() {
  return (
    <Stack gap={3}>
      <Text measure>Primary body text holds a 66-character measure for comfortable reading.</Text>
      <Text tone="secondary">Secondary text for supporting detail.</Text>
      <Text size="caption" tone="muted">
        Muted caption for metadata
      </Text>
      <Text mono size="caption">
        --space-4: 1rem
      </Text>
    </Stack>
  );
}
