import { Rule, Stack, Text } from "@raster/react";

export default function Variants() {
  return (
    <Stack gap={4}>
      <Text size="caption" tone="secondary">
        Default
      </Text>
      <Rule />
      <Text size="caption" tone="secondary">
        Strong
      </Text>
      <Rule variant="strong" />
      <Text size="caption" tone="secondary">
        Signal
      </Text>
      <Rule variant="signal" />
    </Stack>
  );
}
