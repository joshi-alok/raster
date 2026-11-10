import { Button, DialogTrigger, Drawer } from "@rasterdesign/react";

export default function Filters() {
  return (
    <DialogTrigger>
      <Button>Show filters</Button>
      <Drawer title="Filters" placement="bottom">
        {({ close }) => (
          <>
            <p>A sheet rises from the bottom edge, which suits phones and short sets of controls.</p>
            <Button variant="primary" onPress={close}>
              Apply
            </Button>
          </>
        )}
      </Drawer>
    </DialogTrigger>
  );
}
