import { Meter, Stack } from "@raster/react";

export default function Levels() {
  return (
    <Stack gap={5}>
      <Meter label="Storage used" value={86} low={30} high={80} optimum={0} valueLabel="86 of 100 GB" />
      <Meter label="Accessibility score" value={96} low={50} high={90} optimum={100} />
      <Meter label="Build time" value={55} low={30} high={80} optimum={0} valueLabel="55 s" />
    </Stack>
  );
}
