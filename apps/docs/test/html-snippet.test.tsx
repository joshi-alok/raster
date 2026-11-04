import { Button, IconButton, Stack } from "@raster/react";
import { X } from "lucide-react";
import { describe, expect, it } from "vitest";
import { htmlSnippet } from "../src/lib/html-snippet";

describe("htmlSnippet", () => {
  it("removes React Aria runtime attributes and formats one element per line", async () => {
    const Demo = () => (
      <Stack direction="row" gap={3}>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
      </Stack>
    );
    const html = await htmlSnippet(Demo);
    expect(html).toBe(
      [
        '<div class="sw-stack" data-gap="3" data-direction="row">',
        '  <button data-variant="primary" class="sw-button" type="button">Save</button>',
        '  <button data-variant="secondary" class="sw-button" type="button">Cancel</button>',
        "</div>",
      ].join("\n"),
    );
  });

  it("collapses Lucide icons to a placeholder", async () => {
    const Demo = () => (
      <IconButton label="Close">
        <X aria-hidden="true" strokeWidth={1.5} />
      </IconButton>
    );
    const html = await htmlSnippet(Demo);
    expect(html).toContain('<svg aria-hidden="true"><!-- Lucide icon --></svg>');
    expect(html).not.toContain("<path");
    expect(html).toContain('aria-label="Close"');
  });

  it("keeps tabindex on elements that are not natively focusable", async () => {
    const Demo = () => (
      <div tabIndex={0} role="region" aria-label="Scrollable">
        x
      </div>
    );
    expect(await htmlSnippet(Demo)).toContain('tabindex="0"');
  });
});
