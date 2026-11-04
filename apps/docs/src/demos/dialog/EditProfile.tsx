import { Button, Dialog, DialogTrigger, Stack, TextField } from "@raster/react";

export default function EditProfile() {
  return (
    <DialogTrigger>
      <Button>Edit profile</Button>
      <Dialog title="Edit profile">
        {({ close }) => (
          <Stack gap={5}>
            <TextField label="Display name" defaultValue="Raster studio" />
            <Stack direction="row" gap={3}>
              <Button variant="primary" onPress={close}>
                Save
              </Button>
              <Button onPress={close}>Cancel</Button>
            </Stack>
          </Stack>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
