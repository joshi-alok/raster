import { Stack, Switch } from "@raster/react";

export default function Basic() {
  return (
    <Stack gap={3}>
      <Switch defaultSelected>Show grid overlay</Switch>
      <Switch>Reduce motion</Switch>
    </Stack>
  );
}
