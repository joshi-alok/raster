import { Heading, Section, Text } from "@raster/react";

export default function Basic() {
  return (
    <Section aria-labelledby="section-demo-title">
      <Heading level={2} size="h3" id="section-demo-title">
        Studio
      </Heading>
      <Text tone="secondary">Sections add the large vertical rhythm between page regions.</Text>
    </Section>
  );
}
