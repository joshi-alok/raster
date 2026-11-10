import { Eyebrow, Grid, Text } from "@rasterdesign/react";

export default function Hanging() {
  return (
    <Grid layout="hanging" rules>
      <Eyebrow as="p">01 / Grid</Eyebrow>
      <Text measure>Labels hang in the narrow column and content runs in the wide one.</Text>
      <Eyebrow as="p">02 / Type</Eyebrow>
      <Text measure>Below 600px of container width, each label stacks above its content.</Text>
    </Grid>
  );
}
