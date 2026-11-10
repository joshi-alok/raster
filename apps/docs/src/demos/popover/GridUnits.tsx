import { Button, DialogTrigger, Link, Popover } from "@rasterdesign/react";

export default function GridUnits() {
  return (
    <DialogTrigger>
      <Button>Grid units</Button>
      <Popover title="Grid units">
        <p>One unit is 4px. Spacing runs in nine steps from 4 to 96px.</p>
        <Link href="/foundations/grid/">Read about the grid</Link>
      </Popover>
    </DialogTrigger>
  );
}
