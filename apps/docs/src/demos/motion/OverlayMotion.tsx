import { Button, Dialog, DialogTrigger, Stack, Text, Tooltip, TooltipTrigger } from "@raster/react";

export default function OverlayMotion() {
  return (
    <Stack direction="row" gap={3}>
      <DialogTrigger>
        <Button>Open dialog</Button>
        <Dialog title="Overlay motion">
          {({ close }) => (
            <Stack gap={5}>
              <Text>The dialog fades in and rises 8px; the scrim fades. Close it and open it again to replay.</Text>
              <Button variant="primary" onPress={close}>
                Close
              </Button>
            </Stack>
          )}
        </Dialog>
      </DialogTrigger>
      <TooltipTrigger>
        <Button>Hover or focus me</Button>
        <Tooltip>Tooltips fade in from their placement.</Tooltip>
      </TooltipTrigger>
    </Stack>
  );
}
