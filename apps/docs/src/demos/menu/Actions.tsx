import { Button, Menu, MenuItem, MenuSeparator, MenuTrigger, Stack, Text } from "@rasterdesign/react";
import { useState } from "react";

export default function Actions() {
  const [last, setLast] = useState("none");
  return (
    <Stack gap={3}>
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu onAction={(key) => setLast(String(key))}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem id="delete" variant="danger">
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <Text size="caption" tone="secondary" role="status">
        Last action: {last}
      </Text>
    </Stack>
  );
}
