import { describe, expect, it } from "vitest";
import { demoCopy } from "./demo-copy";

const texts = (source: string, kind: string) => demoCopy(source).filter((c) => c.kind === kind).map((c) => c.text);

describe("demoCopy finds the copy in a demo", () => {
  it("reads a Button label even when onPress holds nested braces", () => {
    const source = `<Button onPress={() => queue.add({ title: "A" }, { timeout: 5 })}>OK</Button>`;
    expect(texts(source, "button")).toEqual(["OK"]);
  });

  it("reads quoted, expression and template-literal attributes", () => {
    const source = 'label="Name" title={n === 1 ? "Fix 1 field" : `Fix ${n} fields`}';
    expect(texts(source, "label")).toEqual(["Name"]);
    expect(texts(source, "title")).toEqual(["Fix 1 field", "Fix 1 fields"]);
  });

  it("reads copy held in object literals", () => {
    const source = `const F = [{ label: "Projects running", change: "+3 on last quarter" }]; queue.add({ title: 'Project archived', description: "Find it under Archive." })`;
    expect(texts(source, "label")).toEqual(["Projects running"]);
    expect(texts(source, "change")).toEqual(["+3 on last quarter"]);
    expect(texts(source, "title")).toEqual(["Project archived"]);
    expect(texts(source, "description")).toEqual(["Find it under Archive."]);
  });

  it("reads text between tags", () => {
    expect(texts("<p>We reply within two working days.</p>", "text")).toEqual(["We reply within two working days."]);
  });
});
