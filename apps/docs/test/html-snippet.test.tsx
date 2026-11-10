import { Breadcrumb, Breadcrumbs, Button, Checkbox, IconButton, Radio, RadioGroup, Stack, TextField } from "@rasterdesign/react";
import { X } from "lucide-react";
import { describe, expect, it } from "vitest";
import { cleanMarkup, htmlSnippet } from "../src/lib/html-snippet";

/** Every id that aria-labelledby, aria-describedby, aria-controls or for points at exists in the markup. */
function expectReferencesResolve(html: string) {
  const ids = new Set([...html.matchAll(/ id="([^"]*)"/g)].map((m) => m[1]));
  const refs = [...html.matchAll(/ (?:aria-labelledby|aria-describedby|aria-controls|for)="([^"]*)"/g)].flatMap((m) =>
    m[1].split(/\s+/),
  );
  for (const ref of refs) expect(ids, `reference to missing id ${ref}`).toContain(ref);
}

describe("htmlSnippet", () => {
  it("removes React Aria runtime attributes and formats one element per line", async () => {
    const Demo = () => (
      <Stack direction="row" gap={3}>
        <Button variant="primary">Save</Button>
        <Button>Cancel</Button>
      </Stack>
    );
    expect(await htmlSnippet(Demo)).toBe(
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
  });

  it("keeps a field's label and description wired, with readable ids", async () => {
    const html = await htmlSnippet(() => <TextField label="Email" description="For receipts only." />);
    expect(html).toContain('<label class="sw-field-label" id="id-1" for="id-2">');
    expect(html).toContain('id="id-2"');
    expect(html).toMatch(/aria-describedby="id-\d"/);
    expect(html).not.toMatch(/«|react-aria-|slot=|tabindex/);
    expectReferencesResolve(html);
  });

  it("uses the sr-only class for visually hidden inputs and drops dangling references", async () => {
    const html = await htmlSnippet(() => <Checkbox defaultSelected>Email me</Checkbox>);
    expect(html).toContain('<span class="sw-sr-only">');
    expect(html).not.toContain("style=");
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("tabindex");
  });

  it("removes roving tabindex from radios and keeps group labelling", async () => {
    const Demo = () => (
      <RadioGroup label="Plan" defaultValue="a">
        <Radio value="a">A</Radio>
        <Radio value="b">B</Radio>
      </RadioGroup>
    );
    const html = await htmlSnippet(Demo);
    expect(html).not.toContain("tabindex");
    expect(html).toMatch(/role="radiogroup"[\s\S]*aria-labelledby="id-1"/);
    expectReferencesResolve(html);
  });

  it("removes collection placeholders", async () => {
    const Demo = () => (
      <Breadcrumbs aria-label="Example">
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb>Here</Breadcrumb>
      </Breadcrumbs>
    );
    const html = await htmlSnippet(Demo);
    expect(html).not.toContain("<template");
    expect(html).not.toContain("data-collection");
    expect(html).toContain('aria-current="page"');
  });
});

describe("cleanMarkup", () => {
  it("keeps tabindex on elements that are not natively focusable", () => {
    expect(cleanMarkup('<div tabindex="0" role="region" aria-label="Code">x</div>')).toContain('tabindex="0"');
  });

  it("never rewrites guillemets in text or other attributes", () => {
    const html = cleanMarkup('<p title="«Titel»">«Weniger, aber besser»</p><p id="«R1»" aria-describedby="«R1»">x</p>');
    expect(html).toContain('<p title="«Titel»">«Weniger, aber besser»</p>');
    expect(html).toContain('<p id="id-1" aria-describedby="id-1">');
  });

  it("keeps targets of every id-reference attribute", () => {
    const html = cleanMarkup('<input aria-errormessage="react-aria-«R3»" /><span id="react-aria-«R3»">Error</span>');
    expect(html).toBe('<input aria-errormessage="id-1" /><span id="id-1">Error</span>');
  });

  it("keeps author ids and renames only generated ones", () => {
    const html = cleanMarkup(
      '<h3 id="title">T</h3><section aria-labelledby="title"></section><p id="react-aria-«R1»">x</p><table aria-labelledby="«R2»"><caption id="«R2»">c</caption></table>',
    );
    expect(html).toContain('id="title"');
    expect(html).not.toContain("react-aria-«R1»");
    expect(html).toContain('<table aria-labelledby="id-1"><caption id="id-1">');
  });
});
