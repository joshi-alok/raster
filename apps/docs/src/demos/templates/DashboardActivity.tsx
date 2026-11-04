import { Callout, Stack, Tab, TabList, TabPanel, Tabs, Text } from "@raster/react";

const WEEKS = {
  "this-week": ["Proofs approved for the annual report", "Wayfinding signs sent to the fabricator", "New brief: type specimen"],
  "last-week": ["Museum client review", "Grid study for the report cover", "Licence check for web fonts"],
};

export default function DashboardActivity() {
  return (
    <Stack gap={5}>
      <Callout tone="warning" title="One project at risk">
        The type specimen is waiting for font licences.
      </Callout>
      <Tabs defaultSelectedKey="this-week">
        <TabList aria-label="Activity">
          <Tab id="this-week">This week</Tab>
          <Tab id="last-week">Last week</Tab>
        </TabList>
        {Object.entries(WEEKS).map(([id, items]) => (
          <TabPanel key={id} id={id}>
            <Stack as="ul" gap={2}>
              {items.map((item) => (
                <Text as="li" key={item}>
                  {item}
                </Text>
              ))}
            </Stack>
          </TabPanel>
        ))}
      </Tabs>
    </Stack>
  );
}
