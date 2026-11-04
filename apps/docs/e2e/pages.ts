import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));

/** Every built page as a URL path ("/", "/components/button/"), read from dist/. */
export function builtPages(): string[] {
  if (!existsSync(DIST)) throw new Error("apps/docs/dist is missing: run `pnpm build` before the e2e tests.");
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== "_astro") walk(join(dir, entry.name));
      } else if (entry.name === "index.html") {
        const path = relative(DIST, dir).split(sep).join("/");
        pages.push(path ? `/${path}/` : "/");
      }
    }
  };
  walk(DIST);
  return pages.sort();
}
