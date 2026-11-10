import { Banner } from "@rasterdesign/react";

export default function Dismissable() {
  return (
    <Banner tone="success" title="Projects updated" onDismiss={() => undefined}>
      <p>Six projects now have new case studies.</p>
    </Banner>
  );
}
