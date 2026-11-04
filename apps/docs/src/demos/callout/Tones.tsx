import { Callout, Stack } from "@raster/react";

export default function Tones() {
  return (
    <Stack gap={4}>
      <Callout title="Proofs arrive on Monday">The printer confirmed the date this morning.</Callout>
      <Callout tone="success" title="Published">The annual report is live.</Callout>
      <Callout tone="warning" title="Fonts not licensed for the web">Check the licence before launch.</Callout>
      <Callout tone="danger" title="Upload failed">The file is larger than 50 MB. Compress it and try again.</Callout>
    </Stack>
  );
}
