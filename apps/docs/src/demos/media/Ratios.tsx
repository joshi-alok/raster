import { Media, Stack } from "@rasterdesign/react";

const RATIOS = ["1:1", "3:2", "21:9"] as const;

export default function Ratios() {
  return (
    <Stack gap={5}>
      {RATIOS.map((ratio) => (
        <Media key={ratio} ratio={ratio} caption={ratio} style={{ maxInlineSize: "20rem" }}>
          <svg viewBox="0 0 10 10" preserveAspectRatio="none" role="img" aria-label={`An empty frame at ${ratio}`}>
            <rect width="10" height="10" fill="currentColor" opacity="0.1" />
          </svg>
        </Media>
      ))}
    </Stack>
  );
}
