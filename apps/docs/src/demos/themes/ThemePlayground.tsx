import { Button, Callout, Eyebrow, Heading, Select, SelectItem, Stack, Tag, Text, ThemeRegion } from "@rasterdesign/react";

const REGIONS = [
  { theme: "alpine", mode: "light", name: "Alpine light" },
  { theme: "alpine", mode: "dark", name: "Alpine dark" },
  { theme: "zurich", mode: "light", name: "Zürich light" },
  { theme: "zurich", mode: "dark", name: "Zürich dark" },
] as const;

export default function ThemePlayground() {
  return (
    <div className="docs-theme-grid">
      {REGIONS.map((region) => (
        <ThemeRegion
          key={region.name}
          as="section"
          theme={region.theme}
          mode={region.mode}
          aria-label={region.name}
          className="docs-theme-tile"
        >
          <Stack gap={4}>
            <Eyebrow>{region.name}</Eyebrow>
            <Heading level={3} size="h3">
              Form follows grid
            </Heading>
            <Text tone="secondary">Flush left, ragged right, and every pairing above 4.5:1.</Text>
            <Stack direction="row" gap={3}>
              <Button variant="primary">Primary</Button>
              <Button>Secondary</Button>
            </Stack>
            <Select label="Typeface" defaultValue="geist">
              <SelectItem id="geist">Geist</SelectItem>
              <SelectItem id="geist-mono">Geist Mono</SelectItem>
            </Select>
            <Stack direction="row" gap={2}>
              <Tag tone="accent">Accent</Tag>
              <Tag tone="success">Success</Tag>
              <Tag tone="danger">Danger</Tag>
            </Stack>
            <Callout tone="info" title="Overlays follow the region">
              Open the select: its list renders in this theme and mode.
            </Callout>
          </Stack>
        </ThemeRegion>
      ))}
    </div>
  );
}
