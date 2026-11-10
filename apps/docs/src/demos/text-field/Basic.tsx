import { Stack, TextField } from "@rasterdesign/react";

export default function Basic() {
  return (
    <Stack gap={5}>
      <TextField label="Name" placeholder="Josef Müller-Brockmann" />
      <TextField label="Email" type="email" isRequired description="Required. We send the proof here." />
      <TextField label="Studio" defaultValue="Raster" isDisabled />
    </Stack>
  );
}
