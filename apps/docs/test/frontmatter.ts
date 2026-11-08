import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export const CONTENT = fileURLToPath(new URL("../src/content", import.meta.url));

export interface Entry {
  id: string;
  file: string;
  data: Record<string, unknown>;
  body: string;
}

/** Every MDX entry in src/content/<collection>, with its frontmatter parsed and its body. */
export function entries(collection: "components" | "patterns"): Entry[] {
  const dir = join(CONTENT, collection);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .sort()
    .map((name) => {
      const file = join(dir, name);
      const source = readFileSync(file, "utf8");
      const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source);
      if (!match) throw new Error(`${file} has no frontmatter`);
      return { id: basename(name, ".mdx"), file, data: parse(match[1]) as Record<string, unknown>, body: match[2] };
    });
}
