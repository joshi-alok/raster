import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkButtonLabel, checkCopy, type CopyIssue, checkSentenceCase } from "../src/lib/content-style";
import { entries } from "./frontmatter";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const components = entries("components");
const patterns = entries("patterns");
/** Component titles keep their capitals: "Use a DataGrid". */
const NAMES = new Set(components.map((c) => String(c.data.title)));

type Found = { where: string; issue: CopyIssue };
const report = (found: Found[]) => found.map((f) => `${f.where} [${f.issue.rule}] ${f.issue.detail}`);

function prose(where: string, text: string, sentence: boolean): Found[] {
  const issues = [...checkCopy(text), ...(sentence ? checkSentenceCase(text, NAMES) : [])];
  return issues.map((issue) => ({ where, issue }));
}

function demoFiles(dir = join(SRC, "demos")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? demoFiles(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
  );
}

/** Example and NativeExample titles in an MDX body. */
const exampleTitles = (body: string) => [...body.matchAll(/<(?:Native)?Example[^>]*\btitle="([^"]+)"/g)].map((m) => m[1]);

describe("the docs' copy follows the content style", () => {
  it("in component and pattern frontmatter", () => {
    const found: Found[] = [];
    for (const c of components) {
      found.push(...prose(`${c.id} summary`, String(c.data.summary), true));
      for (const u of (c.data.use as string[]) ?? []) found.push(...prose(`${c.id} use`, u, true));
      for (const a of (c.data.avoid as { text: string }[]) ?? []) found.push(...prose(`${c.id} avoid`, a.text, true));
      for (const note of (c.data.a11y as string[]) ?? []) found.push(...prose(`${c.id} a11y`, note, false));
    }
    for (const p of patterns) {
      found.push(...prose(`${p.id} title`, String(p.data.title), true));
      found.push(...prose(`${p.id} summary`, String(p.data.summary), true));
      for (const r of p.data.rules as string[]) found.push(...prose(`${p.id} rule`, r, true));
    }
    expect(report(found)).toEqual([]);
  });

  it("in example titles", () => {
    const found = [...components, ...patterns].flatMap((e) =>
      exampleTitles(e.body).flatMap((title) => prose(`${e.id} example`, title, true)),
    );
    expect(report(found)).toEqual([]);
  });

  it("in the demos' labels, text and buttons", () => {
    const found: Found[] = [];
    for (const file of demoFiles()) {
      const where = relative(SRC, file);
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/\b(label|title|description|errorMessage|aria-label|caption|placeholder)="([^"]+)"/g)) {
        found.push(...prose(`${where} ${m[1]}`, m[2], m[1] !== "placeholder"));
      }
      for (const m of source.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)) {
        found.push(...prose(`${where} text`, m[1].trim(), false));
      }
      // Attributes may hold arrow functions ("onPress={() => …}"), whose ">" is not the end of the tag.
      for (const m of source.matchAll(/<Button\b(?:\{[^{}]*\}|[^>{])*>\s*([^<{]+?)\s*<\/Button>/g)) {
        found.push(...[...checkButtonLabel(m[1]), ...checkSentenceCase(m[1], NAMES)].map((issue) => ({ where: `${where} button`, issue })));
      }
    }
    expect(report(found)).toEqual([]);
  });
});
