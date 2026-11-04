import { Card, Eyebrow, Heading, Link, Stack, Text } from "@raster/react";

export default function Basic() {
  return (
    <Card>
      <Stack gap={3}>
        <Eyebrow>Case study</Eyebrow>
        <Heading level={3} size="h4">
          Museum wayfinding
        </Heading>
        <Text tone="secondary">A sign system set on a twelve-column grid.</Text>
        <Link href="/templates/article/">Read the article</Link>
      </Stack>
    </Card>
  );
}
