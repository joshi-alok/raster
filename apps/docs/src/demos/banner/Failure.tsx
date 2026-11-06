import { Banner } from "@raster/react";

export default function Failure() {
  return (
    <Banner tone="danger" title="Publishing failed">
      <p>Two pages could not be published. Check the build log and try again.</p>
    </Banner>
  );
}
