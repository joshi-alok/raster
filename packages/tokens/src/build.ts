import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkTheme, formatViolations } from "./contrast";
import { tokensCss } from "./emit-css";
import { designToolFiles } from "./emit-design-tools";
import { tokensJson } from "./emit-json";
import { themes } from "./themes";

const violations = themes.flatMap(checkTheme);
if (violations.length > 0) {
  console.error(`Contrast check failed:\n${formatViolations(violations)}`);
  process.exit(1);
}

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
mkdirSync(dist, { recursive: true });
writeFileSync(resolve(dist, "tokens.css"), tokensCss());
writeFileSync(resolve(dist, "tokens.json"), `${JSON.stringify(tokensJson(), null, 2)}\n`);
mkdirSync(resolve(dist, "design-tools"), { recursive: true });
for (const [file, content] of Object.entries(designToolFiles())) {
  writeFileSync(resolve(dist, "design-tools", file), `${JSON.stringify(content, null, 2)}\n`);
}
console.log(`Wrote dist/tokens.css, dist/tokens.json and dist/design-tools/ (${themes.length} themes, 0 contrast violations)`);
