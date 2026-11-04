import { Tab, TabList, TabPanel, Tabs, Text } from "@raster/react";

export default function Horizontal() {
  return (
    <Tabs defaultSelectedKey="grid">
      <TabList aria-label="Foundations">
        <Tab id="grid">Grid</Tab>
        <Tab id="type">Type</Tab>
        <Tab id="colour">Colour</Tab>
        <Tab id="motion" isDisabled>
          Motion
        </Tab>
      </TabList>
      <TabPanel id="grid">
        <Text>Four, eight or twelve columns, chosen by the container.</Text>
      </TabPanel>
      <TabPanel id="type">
        <Text>Geist in a short, light scale.</Text>
      </TabPanel>
      <TabPanel id="colour">
        <Text>Two themes, each in light and dark.</Text>
      </TabPanel>
      <TabPanel id="motion">
        <Text>Calm by default.</Text>
      </TabPanel>
    </Tabs>
  );
}
