import { Button, createToastQueue, ToastRegion } from "@rasterdesign/react";

// One queue for this demo; an app creates one near its root.
const queue = createToastQueue();

export default function Confirmation() {
  return (
    <>
      <Button
        onPress={() =>
          queue.add({ title: "Project archived", description: 'Find it under "Archive".', tone: "success" }, { timeout: 5000 })
        }
      >
        Archive project
      </Button>
      <ToastRegion queue={queue} />
    </>
  );
}
