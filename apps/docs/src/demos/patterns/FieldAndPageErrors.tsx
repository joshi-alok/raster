import { Banner, Stack, TextField } from "@rasterdesign/react";

export default function FieldAndPageErrors() {
  return (
    <Stack gap={5}>
      <Banner tone="danger" title="Publishing failed">
        <p>Two pages could not be published. Check the build log and try again.</p>
      </Banner>
      <TextField
        label="Studio email"
        description="Used for invoices only."
        errorMessage="Enter a complete email address, such as name@studio.ch."
        defaultValue="studio@"
        isInvalid
      />
    </Stack>
  );
}
