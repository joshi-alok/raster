import { ProgressBar, Stack } from "@rasterdesign/react";

export default function Upload() {
  return (
    <Stack gap={5}>
      <ProgressBar label="Uploading proofs" value={40} />
      <ProgressBar label="Pages exported" value={12} maxValue={20} valueLabel="12 of 20 pages" />
    </Stack>
  );
}
