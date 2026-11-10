import { IconButton, Stack } from "@rasterdesign/react";
import { Plus, Settings, X } from "lucide-react";

export default function Basic() {
  return (
    <Stack direction="row" gap={2}>
      <IconButton label="Add item">
        <Plus aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <IconButton label="Settings" variant="ghost">
        <Settings aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
      <IconButton label="Close" variant="ghost">
        <X aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
    </Stack>
  );
}
