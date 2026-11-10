import { TextField } from "@rasterdesign/react";

export default function Wiring() {
  return (
    <TextField
      label="Studio email"
      description="Used for invoices only."
      errorMessage="Enter a complete email address."
      defaultValue="studio@"
      isInvalid
    />
  );
}
