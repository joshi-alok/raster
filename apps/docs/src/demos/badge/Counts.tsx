import { Badge, Stack } from "@rasterdesign/react";

export default function Counts() {
  return (
    <Stack direction="row" gap={5}>
      <span>
        Inbox <Badge label="3 unread messages">3</Badge>
      </span>
      <Badge tone="accent">New</Badge>
      <span>
        Builds <Badge tone="danger" label="2 failed builds">2</Badge>
      </span>
    </Stack>
  );
}
