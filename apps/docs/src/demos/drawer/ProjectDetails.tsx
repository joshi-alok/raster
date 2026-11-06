import { Button, DialogTrigger, Drawer } from "@raster/react";

export default function ProjectDetails() {
  return (
    <DialogTrigger>
      <Button>Project details</Button>
      <Drawer title="Linie 7">
        <p>A sign family for fourteen stations, legible from a moving train and a wheelchair alike.</p>
        <p>Wayfinding and identity for a regional rail line, delivered in eleven months.</p>
      </Drawer>
    </DialogTrigger>
  );
}
