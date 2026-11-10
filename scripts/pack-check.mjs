// Packs @rasterdesign/tokens, @rasterdesign/css and @rasterdesign/react as npm would publish them, installs the
// tarballs into a fresh project, and uses them there as a consumer would. Then publint checks
// every package's exports.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

// CI's e2e jobs run in Playwright's image; its tag must match the pinned @playwright/test.
const playwright = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8")).devDependencies["@playwright/test"];
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
if (!ci.includes(`playwright:v${playwright}-noble`)) throw new Error(`ci.yml's Playwright image must be v${playwright}-noble`);

const PACKAGES = ["tokens", "css", "react"];
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

const work = mkdtempSync(join(tmpdir(), "raster-pack-"));
const tarballs = {};
for (const name of PACKAGES) {
  const dir = join(root, "packages", name);
  run("pnpm", ["exec", "publint", "--strict", dir], root);
  const before = new Set(readdirSync(work));
  run("pnpm", ["pack", "--pack-destination", work], dir);
  tarballs[`@rasterdesign/${name}`] = `file:${join(work, readdirSync(work).find((f) => !before.has(f)))}`;
}

const app = join(work, "app");
mkdirSync(app);
const write = (file, text) => writeFileSync(join(app, file), text);
write(
  "package.json",
  JSON.stringify(
    {
      name: "raster-consumer",
      private: true,
      type: "module",
      dependencies: { ...tarballs, react: "19.1.10", "react-dom": "19.1.10" },
      devDependencies: { typescript: "5.9.3", "@types/react": "19.3.0", "@types/react-dom": "19.3.0" },
      // The packed css and react depend on @rasterdesign/* by version; before the first publish that
      // version is not on the registry, so point every copy at the local tarballs.
      overrides: Object.fromEntries(Object.keys(tarballs).map((n) => [n, `$${n}`])),
    },
    null,
    2,
  ),
);
write(
  "smoke.mjs",
  `import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Button } from "@rasterdesign/react";
import { themes, tokensJson } from "@rasterdesign/tokens";

const require = createRequire(import.meta.url);
const fail = (message) => { console.error(message); process.exit(1); };

if (themes.length !== 2) fail("@rasterdesign/tokens: expected two themes");
if (!tokensJson().themes.alpine) fail("@rasterdesign/tokens: tokensJson has no alpine theme");
const html = renderToString(createElement(Button, null, "Save"));
if (!html.includes("sw-button")) fail("@rasterdesign/react: Button did not render, got " + html);
if (!readFileSync(require.resolve("@rasterdesign/react"), "utf8").startsWith('"use client"')) fail('@rasterdesign/react: no "use client"');
for (const file of [
  "@rasterdesign/css/raster.css",
  "@rasterdesign/css/raster.min.css",
  "@rasterdesign/css/motion.css",
  "@rasterdesign/tokens/tokens.css",
  "@rasterdesign/tokens/tokens.json",
  "@rasterdesign/tokens/design-tools/raster-alpine-light.tokens.json",
]) require.resolve(file);
console.log("pack check: the packages import, render and resolve");
`,
);
write(
  "consumer.tsx",
  `import { Button, type ButtonProps } from "@rasterdesign/react";
import { type Theme, themes } from "@rasterdesign/tokens";

const props: ButtonProps = { variant: "primary" };
export const save = <Button {...props}>Save</Button>;
export const names: Theme["name"][] = themes.map((t) => t.name);
`,
);
const tsconfig = (moduleResolution, module) =>
  JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, jsx: "react-jsx", module, moduleResolution, target: "ES2022", lib: ["ES2022", "DOM"], skipLibCheck: false },
    files: ["consumer.tsx"],
  });
write("tsconfig.bundler.json", tsconfig("Bundler", "ESNext"));
write("tsconfig.nodenext.json", tsconfig("NodeNext", "NodeNext"));

run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], app);
run("node", ["smoke.mjs"], app);
run("npx", ["tsc", "-p", "tsconfig.bundler.json"], app);
run("npx", ["tsc", "-p", "tsconfig.nodenext.json"], app);
rmSync(work, { recursive: true, force: true });
