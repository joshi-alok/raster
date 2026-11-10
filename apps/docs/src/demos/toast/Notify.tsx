import { Button, createToastQueue, Stack, ToastRegion } from "@rasterdesign/react";

// One queue for this demo; an app creates one near its root.
const queue = createToastQueue();

export default function Notify() {
  return (
    <>
      <Stack direction="row" gap={3}>
        <Button
          onPress={() =>
            queue.add({ title: "Saved", description: "Your changes are live.", tone: "success" }, { timeout: 5000 })
          }
        >
          Save changes
        </Button>
        <Button onPress={() => queue.add({ title: "Connection lost", tone: "danger" })}>Simulate an error</Button>
      </Stack>
      <ToastRegion queue={queue} />
    </>
  );
}
