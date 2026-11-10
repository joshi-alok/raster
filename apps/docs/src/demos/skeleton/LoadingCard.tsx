import { Skeleton, Stack } from "@rasterdesign/react";

export default function LoadingCard() {
  return (
    <div role="group" aria-busy="true" aria-label="Loading project" style={{ maxInlineSize: "22rem" }}>
      <Stack gap={2}>
        <Skeleton shape="block" />
        <Skeleton shape="heading" width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </Stack>
    </div>
  );
}
