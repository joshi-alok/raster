import { Sparkline, Stack, Stat } from "@rasterdesign/react";

export const revenue = { data: [4.1, 3.8, 4.4, 4.9, 5, 5.6, 5.2, 5.9, 6.3], label: "Revenue, last 9 months, CHF millions" };

export default function InAStat() {
  return (
    <Stack gap={3}>
      <Stat value="6.3M" label="Revenue this month" change="+54% since January" trend="up" />
      <Sparkline {...revenue} />
    </Stack>
  );
}
