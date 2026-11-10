import { Tab, TabList, TabPanel, Tabs, Text } from "@rasterdesign/react";

export default function Vertical() {
  return (
    <Tabs orientation="vertical" defaultSelectedKey="profile">
      <TabList aria-label="Settings">
        <Tab id="profile">Profile</Tab>
        <Tab id="notifications">Notifications</Tab>
        <Tab id="billing">Billing</Tab>
      </TabList>
      <TabPanel id="profile">
        <Text>Name, studio and contact details.</Text>
      </TabPanel>
      <TabPanel id="notifications">
        <Text>Choose which updates reach you.</Text>
      </TabPanel>
      <TabPanel id="billing">
        <Text>Invoices and payment method.</Text>
      </TabPanel>
    </Tabs>
  );
}
