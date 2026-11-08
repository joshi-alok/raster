# Raster Plan 9: Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Raster installable from npm, checked by CI on Linux, deployed on Cloudflare, and usable in design tools, as spec §20 describes.

**Architecture:**
- **Builds:** tokens and React are bundled with tsdown into one ESM file each, with bundled declarations. A pack check installs the real tarballs into a throwaway project.
- **Releases:** Changesets versions the three packages as one fixed group. `scripts/publish.mjs` packs each package with pnpm and publishes it with `npm publish --provenance`.
- **Tests:** every e2e run, local or CI, runs in Playwright's Linux Docker image. Linux baselines replace the macOS ones.
- **CI and hosting:** one GitHub Actions workflow checks, tests and deploys two Cloudflare Workers with static assets. A second workflow releases.
- **Design tokens:** the tokens build also emits DTCG files per mode, and the docs serve them for download.

**Tech Stack:** pnpm 10.33 workspaces, Node 22, tsdown, publint, Changesets, npm 11 trusted publishing, Playwright 1.64.1 Docker image (`mcr.microsoft.com/playwright:v1.64.1-noble`), GitHub Actions, Wrangler, Astro 7, Vitest 3.

**Conventions:**
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Branch:** work on `raster/plan-9`.
- **Pushing:** never push or publish, except in Task 9, and there only after the user approves in chat.
- **Dependencies:** pin new dev dependencies to the exact version pnpm resolves, with no caret.
- **Outward-facing steps:** a step marked **CHECKPOINT (user)** is done by the user, or with their explicit approval in chat.

---

## File structure

**Create**
- `packages/tokens/tsdown.config.ts`, `packages/react/tsdown.config.ts`: library bundles.
- `packages/{tokens,css,react}/README.md`: package READMEs.
- `LICENSE`: MIT. `README.md`: the repository README.
- `scripts/pack-check.mjs`: packs the tarballs and smoke-tests them in a fresh project.
- `scripts/publish.mjs` and `scripts/publish.test.mjs`: publish unpublished versions, with tests run by `node --test`.
- `.changeset/config.json`, `.changeset/README.md`.
- `packages/tokens/src/emit-design-tools.ts` and `packages/tokens/test/emit-design-tools.test.ts`: DTCG files for design tools.
- `apps/docs/src/pages/design-tools/[file].ts`: serves those files.
- `apps/docs/src/pages/get-started.astro`, `apps/docs/src/pages/404.astro`.
- `apps/docs/e2e/get-started.spec.ts`.
- `scripts/e2e-docker.sh`: runs e2e in Playwright's Linux image.
- `.github/workflows/ci.yml`, `.github/workflows/release.yml`.
- `apps/docs/wrangler.jsonc`, `apps/studio/wrangler.jsonc`.
- `RELEASING.md`: the release and go-live steps.

**Modify**
- Root `package.json` (scripts, dev dependencies) and `.gitignore`.
- `packages/{tokens,css,react}/package.json`.
- `packages/tokens/src/build.ts`, `src/foundation.ts` (export `SPACE`), `src/index.ts`.
- `apps/docs/src/lib/nav.ts`, `apps/docs/test/nav.test.ts`, `apps/docs/e2e/site.spec.ts`, `apps/docs/src/pages/index.astro`.
- `apps/docs/playwright.config.ts`, `apps/docs/e2e/visual.spec.ts`.
- `apps/docs/e2e/__screenshots__/`: the `*-darwin.png` files are replaced by `*-linux.png`.
- `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`: adds §21.

**Order:** Tasks 1–8 are built on `raster/plan-9`. Task 9 runs after the merge, because going public pushes `main`.

---

### Task 1: Bundle tokens and React with tsdown

The current `tsc` output of `@raster/react` has relative imports with no extension, such as `export { Button } from "./actions/Button"`. Node ESM and Vite SSR cannot resolve them. `@raster/tokens` exports its TypeScript source. Both packages become one bundled ESM file with bundled declarations.

**Files:**
- Create: `packages/tokens/tsdown.config.ts`, `packages/react/tsdown.config.ts`
- Modify: `packages/tokens/package.json`, `packages/react/package.json`

- [ ] **Step 1: Show the failure**

Run from the repo root:
```bash
pnpm --filter @raster/react build
node --input-type=module -e "await import('./packages/react/dist/index.js')"
```
Expected: `ERR_MODULE_NOT_FOUND` for `.../dist/actions/Button`. That is the bug.

- [ ] **Step 2: Add tsdown**

```bash
pnpm add -D -w tsdown
```
Pin the resolved version exactly in the root `package.json`: remove the caret. Check tsdown's documentation for `banner`, `outExtensions` and `dts` in that version, using context7 `/rolldown/tsdown`. If an option name differs, adapt it and say so in your report.

- [ ] **Step 3: React config**

`packages/react/tsdown.config.ts`:
```ts
import { defineConfig } from "tsdown";

/**
 * One ESM file and one declaration file. Dependencies and peer dependencies stay external (tsdown's
 * default). Every component is a client component, so the bundle opens with "use client" for React
 * Server Components frameworks.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  dts: true,
  outDir: "dist",
  clean: true,
  sourcemap: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  banner: { js: '"use client";' },
});
```
In `packages/react/package.json`, set `"build": "tsdown"`. Keep `"exports": { ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" } }`. Delete `tsconfig.build.json`, which nothing uses any more.

- [ ] **Step 4: Tokens config**

`packages/tokens/tsdown.config.ts`:
```ts
import { defineConfig } from "tsdown";

/** The library: themes, scales, checks and emitters, as one ESM file with declarations. */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  dts: true,
  outDir: "dist",
  clean: false, // dist also holds tokens.css, tokens.json and design-tools/, written by src/build.ts
  sourcemap: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
});
```
In `packages/tokens/package.json`:
```json
"exports": {
  ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
  "./tokens.css": "./dist/tokens.css",
  "./tokens.json": "./dist/tokens.json"
},
"scripts": {
  "build": "tsx src/build.ts && tsdown",
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 5: Show the fix, and that `"use client"` comes first**

```bash
pnpm --filter @raster/tokens build && pnpm --filter @raster/react build
node --input-type=module -e "const m = await import('./packages/react/dist/index.js'); console.log(typeof m.Button)"
node --input-type=module -e "const m = await import('./packages/tokens/dist/index.js'); console.log(m.themes.length)"
head -c 14 packages/react/dist/index.js
```
Expected: `function`, then `2`, then `"use client";`.

- [ ] **Step 6: The workspace still builds and passes**

```bash
pnpm build && pnpm typecheck && pnpm test
```
Expected: all pass. The docs and studio now take `@raster/tokens` from `dist/`, and `pnpm build` runs packages in dependency order.

If the docs typecheck can't find `@raster/tokens` types, make sure the tokens build ran first. Do not point `exports` back at `src`.

- [ ] **Step 7: Commit**

```bash
git add -A packages/tokens packages/react package.json pnpm-lock.yaml
git commit -m "build: bundle tokens and react with tsdown, so Node and Vite SSR can import them

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Publishable package metadata and the pack check

**Files:**
- Create: `LICENSE`, `README.md`, `packages/{tokens,css,react}/README.md`, `scripts/pack-check.mjs`
- Modify: `packages/{tokens,css,react}/package.json`, the root `package.json`, `.gitignore`

- [ ] **Step 1: Write the pack check first**

`scripts/pack-check.mjs`:
```js
// Packs @raster/tokens, @raster/css and @raster/react as npm would publish them, installs the
// tarballs into a fresh project, and uses them there as a consumer would. Then publint checks
// every package's exports.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const PACKAGES = ["tokens", "css", "react"];
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

const work = mkdtempSync(join(tmpdir(), "raster-pack-"));
const tarballs = {};
for (const name of PACKAGES) {
  const dir = join(root, "packages", name);
  run("pnpm", ["exec", "publint", "--strict", dir], root);
  const before = new Set(readdirSync(work));
  run("pnpm", ["pack", "--pack-destination", work], dir);
  tarballs[`@raster/${name}`] = `file:${join(work, readdirSync(work).find((f) => !before.has(f)))}`;
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
      devDependencies: { typescript: "5.9.3", "@types/react": "19.3.0", "@types/react-dom": "19.2.3" },
      // The packed css and react depend on @raster/* by version; before the first publish that
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
import { Button } from "@raster/react";
import { themes, tokensJson } from "@raster/tokens";

const require = createRequire(import.meta.url);
const fail = (message) => { console.error(message); process.exit(1); };

if (themes.length !== 2) fail("@raster/tokens: expected two themes");
if (!tokensJson().themes.alpine) fail("@raster/tokens: tokensJson has no alpine theme");
const html = renderToString(createElement(Button, null, "Save"));
if (!html.includes("sw-button")) fail("@raster/react: Button did not render, got " + html);
if (!readFileSync(require.resolve("@raster/react"), "utf8").startsWith('"use client"')) fail('@raster/react: no "use client"');
for (const file of [
  "@raster/css/raster.css",
  "@raster/css/raster.min.css",
  "@raster/css/motion.css",
  "@raster/tokens/tokens.css",
  "@raster/tokens/tokens.json",
]) require.resolve(file);
console.log("pack check: the packages import, render and resolve");
`,
);
write(
  "consumer.tsx",
  `import { Button, type ButtonProps } from "@raster/react";
import { type Theme, themes } from "@raster/tokens";

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
```
Check the `@types/react-dom` version the repo already uses (`grep -r '"@types/react-dom"' apps packages`) and use that one. Add it to `devDependencies` if the repo has none.

`skipLibCheck: false` is deliberate. It makes the consumer typecheck the published `.d.ts` files.

- [ ] **Step 2: Add publint and the script, then run it to see it fail**

```bash
pnpm add -D -w publint
```
Pin publint exactly. In the root `package.json` scripts, add:
```json
"pack-check": "node scripts/pack-check.mjs",
"verify": "pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm pack-check && pnpm e2e"
```
Run `pnpm build && pnpm pack-check`.

Expected: it fails. `pnpm pack` refuses private packages, or publint reports missing fields. Read the errors.

- [ ] **Step 3: Package metadata**

Apply the following to each of the three packages, and keep their existing fields:

```json
"private": false,
"description": "<per package, below>",
"license": "MIT",
"author": "Raster contributors",
"homepage": "https://raster-docs.<workers subdomain>.workers.dev/",
"repository": { "type": "git", "url": "git+https://github.com/joshi-alok/raster.git", "directory": "packages/<name>" },
"bugs": "https://github.com/joshi-alok/raster/issues",
"keywords": ["design-system", "swiss", "css", "react", "design-tokens"],
"publishConfig": { "access": "public" },
"files": ["dist", "README.md"]
```
- **`homepage`:** leave it out until Task 9 gives a real URL.
- **Provenance:** it is not set in `publishConfig`, because it would make a local `npm publish` fail without OIDC. `scripts/publish.mjs` (Task 3) adds `--provenance` itself, on CI only.
- **Descriptions:**
  - tokens: "Raster's design tokens: two themes with light and dark modes, as CSS, JSON and design-tool files."
  - css: "Raster's CSS: Swiss International Style components that work in plain HTML."
  - react: "Raster's React components, built on React Aria and styled by @raster/css."
- **`@raster/css`:**
  - Add `"./raster.min.css": "./dist/raster.min.css"` to `exports`.
  - Add `"sideEffects": ["*.css"]`.
  - Move `@raster/tokens` to `devDependencies`, because the CSS is bundled with the tokens inlined.
- **`@raster/react`:** add `"@raster/css": "workspace:^"` to `peerDependencies`, and to `devDependencies` as `workspace:*`.
- **`@raster/tokens`:** keep `"sideEffects": false`.

- [ ] **Step 4: LICENSE and READMEs**

The root `LICENSE` is the standard MIT text with `Copyright (c) 2026 Raster contributors`.

Root `README.md`:
```markdown
# Raster

A design system in the Swiss International Style: a strict grid, plain type, and two themes (Alpine and Zürich), each with light and dark modes. Every component works in plain HTML with CSS, and in React.

| Package | What it is |
|---|---|
| [`@raster/css`](packages/css) | The stylesheet. Components as classes; works without JavaScript. |
| [`@raster/react`](packages/react) | React components on React Aria, styled by `@raster/css`. |
| [`@raster/tokens`](packages/tokens) | Tokens as CSS, JSON and design-tool files, plus the theme checks. |

Documentation: the docs site (see `apps/docs`), with a Get started page.

## Develop

Node 22 and pnpm 10 (`corepack enable`). Docker runs the browser tests.

    pnpm install
    pnpm build
    pnpm verify        # build, lint, typecheck, unit tests, pack check, browser tests
    pnpm baselines     # regenerate screenshot baselines (Linux, in Docker)

Changes that users of the packages will notice need a changeset: `pnpm changeset`. See RELEASING.md.

## Licence

MIT
```

Each package README has:
- one paragraph on what the package is;
- `npm install` lines;
- a minimal usage block (the same snippets the Get started page uses in Task 5);
- a link to the docs and to the repository.

Keep each under 40 lines.

`.gitignore`: add `.claude/`.

- [ ] **Step 5: Run the pack check until it passes**

```bash
pnpm install && pnpm build && pnpm pack-check
```
Expected: `pack check: the packages import, render and resolve`, publint prints no errors, and both `tsc` runs exit 0.

If the NodeNext typecheck fails on the bundled declarations, fix the build config. That is the bug class this check exists to catch. Do not loosen the consumer's settings.

- [ ] **Step 6: Commit**

```bash
git add -A LICENSE README.md .gitignore package.json pnpm-lock.yaml scripts/pack-check.mjs packages
git commit -m "build: publishable package metadata, licence, READMEs, and a pack check that installs the tarballs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Changesets and the publish script

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `scripts/publish.mjs`, `scripts/publish.test.mjs`, `.github/workflows/release.yml`
- Modify: the root `package.json`

- [ ] **Step 1: Failing test for the publish plan**

`scripts/publish.test.mjs`:
```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { toPublish } from "./publish.mjs";

const pkgs = [
  { name: "@raster/tokens", version: "0.2.0", dir: "packages/tokens" },
  { name: "@raster/css", version: "0.2.0", dir: "packages/css" },
];

test("publishes only versions the registry does not have", () => {
  const published = new Set(["@raster/tokens@0.2.0"]);
  assert.deepEqual(
    toPublish(pkgs, published).map((p) => p.name),
    ["@raster/css"],
  );
});

test("publishes nothing when every version is out", () => {
  assert.deepEqual(toPublish(pkgs, new Set(["@raster/tokens@0.2.0", "@raster/css@0.2.0"])), []);
});
```
In the root `package.json`, set `"test": "pnpm -r run test && node --test scripts/"`.

Run: `node --test scripts/`
Expected: FAIL, because `./publish.mjs` does not exist.

- [ ] **Step 2: The publish script**

`scripts/publish.mjs`:
```js
// Publishes each public package whose version is not on npm yet. pnpm packs it, which turns
// "workspace:" ranges into real versions, and npm publishes the tarball, which on CI uses trusted
// publishing (OIDC) with provenance. Prints "New tag:" lines for changesets/action and tags each
// release in git.
//   node scripts/publish.mjs            publish
//   node scripts/publish.mjs --dry-run  show what would be published
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
const PACKAGE_DIRS = ["packages/tokens", "packages/css", "packages/react"];

export function toPublish(pkgs, published) {
  return pkgs.filter((p) => !published.has(`${p.name}@${p.version}`));
}

function isPublished(name, version) {
  try {
    execFileSync("npm", ["view", `${name}@${version}`, "version"], { stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false; // E404: no such package or version
  }
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const pkgs = PACKAGE_DIRS.map((dir) => {
    const { name, version } = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
    return { name, version, dir: join(root, dir) };
  });
  const published = new Set(pkgs.filter((p) => isPublished(p.name, p.version)).map((p) => `${p.name}@${p.version}`));
  const queue = toPublish(pkgs, published);
  if (queue.length === 0) {
    console.log("Nothing to publish.");
    return;
  }
  const out = mkdtempSync(join(tmpdir(), "raster-publish-"));
  for (const p of queue) {
    const before = new Set(readdirSync(out));
    execFileSync("pnpm", ["pack", "--pack-destination", out], { cwd: p.dir, stdio: "inherit" });
    const tarball = join(out, readdirSync(out).find((f) => !before.has(f)));
    const args = ["publish", tarball, "--access", "public"];
    if (process.env.GITHUB_ACTIONS === "true") args.push("--provenance");
    if (dryRun) args.push("--dry-run");
    execFileSync("npm", args, { stdio: "inherit" });
    if (!dryRun) {
      execFileSync("git", ["tag", `${p.name}@${p.version}`], { cwd: root, stdio: "inherit" });
      console.log(`New tag: ${p.name}@${p.version}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

Run: `node --test scripts/`
Expected: 2 tests pass.

Run: `pnpm build && node scripts/publish.mjs --dry-run`
Expected: three `npm publish --dry-run` reports, one per package, each listing `dist/` files and `README.md`. Check that the css and react tarballs' `package.json` show `"@raster/tokens": "0.1.0"` and `"@raster/css": "^0.1.0"` rather than `workspace:` (`tar -xOf <tgz> package/package.json`).

- [ ] **Step 3: Changesets**

```bash
pnpm add -D -w @changesets/cli
pnpm changeset init
```
Pin the version. Replace `.changeset/config.json` with:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@raster/tokens", "@raster/css", "@raster/react"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@raster/docs", "@raster/studio"]
}
```
Use the schema URL whose version matches the installed `@changesets/config`.

Add these root scripts:
- `"changeset": "changeset"`
- `"version-packages": "changeset version && pnpm install --lockfile-only"`
- `"release": "node scripts/publish.mjs"`

- [ ] **Step 4: Check that a changeset versions all three together**

```bash
printf -- '---\n"@raster/css": minor\n---\n\nTry the fixed group.\n' > .changeset/try-fixed.md
pnpm changeset status --verbose
```
Expected: all three packages are listed at `0.2.0`, because they are fixed together. Then delete `.changeset/try-fixed.md`. Do not run `changeset version`.

- [ ] **Step 5: Release workflow**

`.github/workflows/release.yml`:
```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: release

permissions:
  contents: write # version commits and tags
  pull-requests: write # the "Version packages" PR
  id-token: write # npm trusted publishing and provenance

jobs:
  release:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
          registry-url: https://registry.npmjs.org
      # Trusted publishing needs npm 11.5.1 or later; Node 22 ships npm 10.
      - run: npm install -g npm@11
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
          title: Version packages
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 6: Commit**

```bash
git add -A .changeset scripts/publish.mjs scripts/publish.test.mjs .github/workflows/release.yml package.json pnpm-lock.yaml
git commit -m "build: Changesets with one fixed version, and a publish script for trusted publishing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Design-tool tokens (DTCG files per mode)

**Files:**
- Create: `packages/tokens/src/emit-design-tools.ts`, `packages/tokens/test/emit-design-tools.test.ts`, `apps/docs/src/pages/design-tools/[file].ts`
- Modify: `packages/tokens/src/foundation.ts` (export `SPACE`), `src/index.ts`, `src/build.ts`, `packages/tokens/package.json`, `scripts/pack-check.mjs`

The files follow DTCG format 2025.10:
- colours are `{ colorSpace: "srgb", components, hex }`;
- dimensions are `{ value, unit: "px" }`;
- durations are `{ value, unit: "ms" }`.

Figma imports one file per mode.

- [ ] **Step 1: Failing tests**

`packages/tokens/test/emit-design-tools.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { designToolFiles } from "../src/emit-design-tools";
import { foundationTokens, TYPE_STEPS } from "../src/foundation";
import { ROLES, themes } from "../src/themes";

const files = designToolFiles();
type Node = { [key: string]: unknown };
const TYPES = new Set(["color", "dimension", "fontFamily", "fontWeight", "number", "duration", "cubicBezier"]);

/** Every token in a file, as [path, token]. */
function tokens(node: Node, path: string[] = []): [string, Node][] {
  if ("$value" in node) return [[path.join("."), node]];
  return Object.entries(node).flatMap(([k, v]) => tokens(v as Node, [...path, k]));
}

describe("designToolFiles", () => {
  it("writes one file per theme mode and one per size mode", () => {
    expect(Object.keys(files).sort()).toEqual([
      "raster-alpine-dark.tokens.json",
      "raster-alpine-light.tokens.json",
      "raster-size-desktop.tokens.json",
      "raster-size-mobile.tokens.json",
      "raster-zurich-dark.tokens.json",
      "raster-zurich-light.tokens.json",
    ]);
  });

  it("gives every token a known $type and a $value", () => {
    for (const [file, content] of Object.entries(files)) {
      for (const [path, token] of tokens(content as Node)) {
        expect(TYPES.has(String(token.$type)), `${file} ${path}`).toBe(true);
      }
    }
  });

  it("carries every role colour, as the theme defines it", () => {
    for (const theme of themes) {
      for (const [mode, i] of [["light", 0], ["dark", 1]] as const) {
        const color = (files[`raster-${theme.name}-${mode}.tokens.json`] as Node).color as Node;
        for (const role of ROLES) {
          expect((color[role] as Node).$value, `${theme.name} ${mode} ${role}`).toMatchObject({
            colorSpace: "srgb",
            hex: theme.colors[role][i].toLowerCase(),
          });
        }
      }
    }
  });

  it("writes colours as sRGB components between 0 and 1", () => {
    const accent = ((files["raster-alpine-light.tokens.json"] as Node).color as Node).accent as Node;
    const { components } = accent.$value as { components: number[] };
    expect(components).toHaveLength(3);
    for (const c of components) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it("resolves fluid sizes at 360px (mobile) and 1440px (desktop), the ends of the CSS clamp()", () => {
    const size = (mode: string) => files[`raster-size-${mode}.tokens.json`] as Node;
    const value = (mode: string, group: string, name: string) =>
      (((size(mode)[group] as Node)[name] as Node).$value as { value: number }).value;
    expect(value("mobile", "space", "9")).toBe(64);
    expect(value("desktop", "space", "9")).toBe(96);
    expect(value("mobile", "layout", "grid-gutter")).toBe(16);
    expect(value("desktop", "layout", "grid-gutter")).toBe(28.8);
    for (const [name, step] of Object.entries(TYPE_STEPS)) {
      const text = (mode: string) => ((size(mode).text as Node)[name] as Node).size as Node;
      expect((text("mobile").$value as { value: number }).value).toBe(step.min);
      expect((text("desktop").$value as { value: number }).value).toBe(step.max);
    }
  });

  it("matches the CSS: each fluid token's mobile value is the clamp()'s minimum", () => {
    const css = foundationTokens();
    const mobile = files["raster-size-mobile.tokens.json"] as Node;
    for (let i = 1; i <= 9; i++) {
      const min = Number(/^(?:clamp\()?([\d.]+)rem/.exec(css[`space-${i}`])![1]) * 16;
      expect((((mobile.space as Node)[String(i)] as Node).$value as { value: number }).value).toBe(min);
    }
  });

  it("turns tracking in em into pixels at each size", () => {
    const display = ((files["raster-size-desktop.tokens.json"] as Node).text as Node).display as Node;
    expect((display.tracking as Node).$value).toEqual({ value: -1.3, unit: "px" });
  });
});
```

Run: `pnpm --filter @raster/tokens exec vitest run test/emit-design-tools.test.ts`
Expected: FAIL, cannot find `../src/emit-design-tools`.

- [ ] **Step 2: Export the spacing steps**

In `packages/tokens/src/foundation.ts`, change `const SPACE` to `export const SPACE`. Also export `VIEWPORT_MIN` and `VIEWPORT_MAX`.

- [ ] **Step 3: The emitter**

`packages/tokens/src/emit-design-tools.ts`:
```ts
import { SPACE, TYPE_STEPS, VIEWPORT_MAX, VIEWPORT_MIN } from "./foundation";
import { SCALES } from "./scales";
import { ROLES, type Theme, themes } from "./themes";

/**
 * Design-tool tokens in the DTCG format (2025.10), one file per mode, as Figma's variables import
 * reads them. Colour files hold a theme's roles, scales and radius in one mode. Size files hold the
 * fluid scales resolved at the narrowest and widest layouts (360px and 1440px, the ends of each
 * clamp()), plus the fixed sizes, type, motion and families. Values DTCG has no type for (shadows,
 * the scrim, light-dark()) are left out.
 */
type Token = { $type: string; $value: unknown };
type Group = { [key: string]: Token | Group };

const round = (n: number) => Number(n.toFixed(4));
const px = (value: number) => ({ value: Number(value.toFixed(2)), unit: "px" });
const ms = (value: number) => ({ value, unit: "ms" });

function color(hex: string): Token {
  const h = hex.toLowerCase();
  const components = [1, 3, 5].map((i) => round(parseInt(h.slice(i, i + 2), 16) / 255));
  return { $type: "color", $value: { colorSpace: "srgb", components, hex: h } };
}

function colourFile(theme: Theme, index: 0 | 1): Group {
  return {
    color: Object.fromEntries(ROLES.map((role) => [role, color(theme.colors[role][index])])),
    scale: Object.fromEntries(
      Object.entries(SCALES[theme.name]).map(([hue, stops]) => [
        hue,
        Object.fromEntries(Object.entries(stops).map(([stop, hex]) => [stop, color(hex as string)])),
      ]),
    ),
    radius: { $type: "dimension", $value: px(parseFloat(theme.radius)) },
  };
}

const WIDTHS = { mobile: VIEWPORT_MIN, desktop: VIEWPORT_MAX } as const;

/** clamp(min, vw, max) at a viewport width, in px. */
const clampAt = (minPx: number, vw: number, maxPx: number, width: number) => Math.min(maxPx, Math.max(minPx, (vw / 100) * width));

function sizeFile(mode: keyof typeof WIDTHS): Group {
  const width = WIDTHS[mode];
  const at = (min: number, max: number) => (mode === "mobile" ? min : max);
  const dimension = (value: number): Token => ({ $type: "dimension", $value: px(value) });
  const family = (names: string[]): Token => ({ $type: "fontFamily", $value: names });
  return {
    font: {
      sans: family(["Geist Variable", "Geist", "Noto Sans", "system-ui", "sans-serif"]),
      mono: family(["Geist Mono Variable", "Geist Mono", "ui-monospace", "Menlo", "monospace"]),
    },
    text: Object.fromEntries(
      Object.entries(TYPE_STEPS).map(([name, step]) => {
        const size = at(step.min, step.max);
        return [
          name,
          {
            size: dimension(size),
            weight: { $type: "fontWeight", $value: step.weight },
            leading: { $type: "number", $value: step.leading },
            tracking: dimension(parseFloat(step.tracking) * size),
          },
        ];
      }),
    ),
    space: Object.fromEntries(SPACE.map(([min, max], i) => [String(i + 1), dimension(at(min, max))])),
    layout: {
      "grid-gutter": dimension(clampAt(16, 2, 32, width)),
      "page-margin": dimension(clampAt(16, 5, 96, width)),
      "content-max": dimension(1440),
      "control-height": dimension(40),
      "target-min": dimension(44),
      "header-height": dimension(64),
      "focus-width": dimension(2),
      "focus-offset": dimension(2),
      "radius-full": dimension(9999),
    },
    motion: {
      "dur-fast": { $type: "duration", $value: ms(120) },
      "dur-base": { $type: "duration", $value: ms(200) },
      "dur-slow": { $type: "duration", $value: ms(320) },
      "dur-layout": { $type: "duration", $value: ms(480) },
      "ease-standard": { $type: "cubicBezier", $value: [0.2, 0, 0, 1] },
      "ease-linear": { $type: "cubicBezier", $value: [0, 0, 1, 1] },
    },
  };
}

/** File name → DTCG content, for every theme mode and both size modes. */
export function designToolFiles(): Record<string, Group> {
  const files: Record<string, Group> = {};
  for (const theme of themes) {
    files[`raster-${theme.name}-light.tokens.json`] = colourFile(theme, 0);
    files[`raster-${theme.name}-dark.tokens.json`] = colourFile(theme, 1);
  }
  files["raster-size-mobile.tokens.json"] = sizeFile("mobile");
  files["raster-size-desktop.tokens.json"] = sizeFile("desktop");
  return files;
}
```
The layout constants mirror `foundationTokens()`:
- `grid-gutter` is `clamp(1rem, 2vw, 2rem)`;
- `page-margin` is `clamp(1rem, 5vw, 6rem)`;
- the fixed sizes and durations match.

If you find a mismatch, fix the emitter. Also add a test assertion for each layout constant you touch.

Run: `pnpm --filter @raster/tokens exec vitest run`
Expected: all pass. Two cases are not mistakes in the expected values, so recheck your emitter rather than the test:
- the desktop display tracking: −0.025 × 52 = −1.3;
- the grid gutter at 1440: 2% of 1440 = 28.8.

- [ ] **Step 4: Export, build and package**

- In `src/index.ts`, add `export { designToolFiles } from "./emit-design-tools";`.
- In `src/build.ts`, after the existing writes:
  ```ts
  mkdirSync(resolve(dist, "design-tools"), { recursive: true });
  for (const [file, content] of Object.entries(designToolFiles())) {
    writeFileSync(resolve(dist, "design-tools", file), `${JSON.stringify(content, null, 2)}\n`);
  }
  ```
  Import `designToolFiles`. Change the final log line to mention `dist/design-tools/`.
- In `packages/tokens/package.json` `exports`, add `"./design-tools/*": "./dist/design-tools/*"`.
- In `scripts/pack-check.mjs`'s resolve list, add `"@raster/tokens/design-tools/raster-alpine-light.tokens.json"`.

- [ ] **Step 5: Serve the files from the docs**

`apps/docs/src/pages/design-tools/[file].ts`:
```ts
import { designToolFiles } from "@raster/tokens";
import type { APIRoute, GetStaticPaths } from "astro";

/** The design-tool token files, at /design-tools/<name>.tokens.json, for download. */
export const getStaticPaths: GetStaticPaths = () => Object.keys(designToolFiles()).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) =>
  new Response(`${JSON.stringify(designToolFiles()[params.file!], null, 2)}\n`, {
    headers: { "Content-Type": "application/json" },
  });
```
Run: `pnpm build && ls apps/docs/dist/design-tools/`
Expected: the six `.tokens.json` files, as files and not folders.

If Astro's `trailingSlash: "always"` turns them into folders, ask for the file format in the route with `src/pages/design-tools/[file].json.ts`, using params without `.json`. Then check the result again.

Run: `pnpm pack-check`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add -A packages/tokens apps/docs/src/pages/design-tools scripts/pack-check.mjs
git commit -m "feat(tokens): design-tool token files in the DTCG format, one per mode, served by the docs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Get started page and 404 page

**Files:**
- Create: `apps/docs/src/pages/get-started.astro`, `apps/docs/src/pages/404.astro`, `apps/docs/e2e/get-started.spec.ts`
- Modify: `apps/docs/src/lib/nav.ts`, `apps/docs/test/nav.test.ts`, `apps/docs/e2e/site.spec.ts`, `apps/docs/src/pages/index.astro`

- [ ] **Step 1: Failing nav test**

In `apps/docs/test/nav.test.ts`, change the label list in "has a Patterns section between Components and Templates" to:
```ts
expect(NAV.map((i) => i.label)).toEqual(["Principles", "Get started", "Foundations", "Components", "Patterns", "Templates", "Themes"]);
```
Then add:
```ts
it("has a Get started page after Principles", () => {
  expect(ariaCurrent("/get-started/", item("Get started"))).toBe("page");
});
```
Run: `cd apps/docs && npx vitest run test/nav.test.ts`. Expected: FAIL.

- [ ] **Step 2: Nav entry**

In `src/lib/nav.ts` `NAV`, after Principles, add `{ href: "/get-started/", label: "Get started" },`. Run the nav test: it passes.

In `e2e/site.spec.ts`, update the phone menu list to `["Principles", "Get started", "Foundations", "Components", "Patterns", "Templates", "Themes"]`.

- [ ] **Step 3: Failing e2e for the page**

`apps/docs/e2e/get-started.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

test("Get started shows how to install, theme, and use both routes", async ({ page }) => {
  await page.goto("/get-started/");
  await expect(page.getByRole("heading", { level: 1, name: "Get started" })).toBeVisible();
  for (const name of ["Install", "Fonts", "Theme and mode", "HTML and CSS", "React", "Design tools"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Install with npm" })).toContainText("npm install @raster/css");
});

test("each design-tool file downloads as DTCG JSON", async ({ page, request }) => {
  await page.goto("/get-started/");
  const links = page.getByRole("list", { name: "Design-tool files" }).getByRole("link");
  await expect(links).toHaveCount(6);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
    const response = await request.get(href);
    expect(response.ok(), href).toBe(true);
    const json = await response.json();
    expect(JSON.stringify(json)).toContain('"$type"');
  }
});

test("an unknown address shows the 404 page with a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
});
```
`astro preview` serves `dist/404.html` with status 404 for unknown paths. If it does not, change the 404 test to `page.goto("/404.html")` and check only the content. Note the change in your report.

- [ ] **Step 4: The pages**

`apps/docs/src/pages/get-started.astro`:
```astro
---
import { designToolFiles } from "@raster/tokens";
import CodeBlock from "../components/CodeBlock.astro";
import DocPage from "../layouts/DocPage.astro";

const INSTALL = `npm install @raster/css @fontsource-variable/geist @fontsource-variable/geist-mono
npm install @raster/react react react-dom   # for React`;

const FONTS = `import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@raster/css";              // or <link rel="stylesheet" href=".../raster.css">
import "@raster/css/motion.css";   // optional: the expressive motion tier`;

const THEME = `<html lang="en" data-theme="zurich" data-mode="dark">`;

const HTML = `<button class="sw-button" data-variant="primary" type="button">Send enquiry</button>`;

const REACT = `import { Button } from "@raster/react";

export function Send() {
  return <Button variant="primary">Send enquiry</Button>;
}`;

const files = Object.keys(designToolFiles());
---
<DocPage
  title="Get started"
  eyebrow="Get started"
  description="Install Raster from npm, load its fonts and stylesheet, choose a theme, then use components in plain HTML or in React."
>
  <h2>Install</h2>
  <p class="sw-measure">
    <code>@raster/css</code> is the whole visual system and needs no JavaScript.
    <code>@raster/react</code> adds behaviour through React Aria and uses the same classes. The
    three packages share one version number.
  </p>
  <CodeBlock code={INSTALL} label="Install with npm" />

  <h2>Fonts</h2>
  <p class="sw-measure">
    Raster sets type in Geist and Geist Mono. Load both before the stylesheet; the stack falls back
    to Noto Sans and the system font while they load.
  </p>
  <CodeBlock code={FONTS} label="Fonts and stylesheet" />

  <h2>Theme and mode</h2>
  <p class="sw-measure">
    Alpine is the default theme. Set <code>data-theme</code> and <code>data-mode</code> on the root,
    or on any region; without <code>data-mode</code>, the reader's system setting decides. See
    <a class="sw-link" href="/themes/">Themes</a>.
  </p>
  <CodeBlock code={THEME} label="Theme attributes" />

  <h2>HTML and CSS</h2>
  <p class="sw-measure">
    Every component page shows the HTML to copy. Interactive parts that HTML alone cannot do, such
    as a combobox, need React.
  </p>
  <CodeBlock code={HTML} label="A button in HTML" />

  <h2>React</h2>
  <CodeBlock code={REACT} label="A button in React" />

  <h2>Design tools</h2>
  <p class="sw-measure">
    These files follow the Design Tokens format, one file per mode. In Figma, import each colour
    file as a mode of one collection, and both size files as Mobile and Desktop modes of another.
    The same files ship in <code>@raster/tokens</code> under <code>design-tools/</code>.
  </p>
  <ul aria-label="Design-tool files">
    {files.map((file) => (
      <li><a class="sw-link" href={`/design-tools/${file}`} download>{file}</a></li>
    ))}
  </ul>
</DocPage>
```
Before writing the HTML snippet, check the real Button markup on `/components/button/`'s HTML example, and match it exactly.

`apps/docs/src/pages/404.astro`:
```astro
---
import DocPage from "../layouts/DocPage.astro";
---
<DocPage title="Page not found" description="There is no page at this address. It may have moved.">
  <p><a class="sw-link" href="/">Go to the home page</a></p>
</DocPage>
```
If `DocPage` requires `eyebrow`, pass `eyebrow="404"`.

In `src/pages/index.astro`, the "Get started" section's first paragraph says the packages are not published yet. Replace it with:
```astro
<p class="sw-measure">
  Raster ships as three packages: <code>@raster/tokens</code>, <code>@raster/css</code> and
  <code>@raster/react</code>. <a class="sw-link" href="/get-started/">Get started</a> covers
  installing them, fonts, themes and design tools.
</p>
```

- [ ] **Step 5: Run the checks**

```bash
pnpm build
cd apps/docs && npx vitest run && npx tsc --noEmit
npx playwright test e2e/get-started.spec.ts e2e/site.spec.ts e2e/a11y.spec.ts --project=chromium
```
These run on the host for now; Task 6 moves e2e into Docker. Make sure nothing is listening on port 4388 first (`lsof -ti :4388`).

Expected: all pass. The a11y spec picks up `/get-started/` automatically from `builtPages()`.

The unit copy test (`test/copy.test.ts`) does not scan `.astro` pages. Read the new page's copy against `/foundations/content/` by hand: sentence case, no exclamation marks, British spelling.

- [ ] **Step 6: Commit**

```bash
git add -A apps/docs
git commit -m "docs: Get started page with install, fonts, themes and design-tool downloads; a 404 page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: e2e in Playwright's Linux image, and Linux baselines

**Files:**
- Create: `scripts/e2e-docker.sh`
- Modify: the root `package.json`, `apps/docs/playwright.config.ts`, `apps/docs/e2e/visual.spec.ts`, `apps/docs/e2e/__screenshots__/*`

- [ ] **Step 1: The script**

`scripts/e2e-docker.sh`:
```sh
#!/bin/sh
# Runs the browser tests inside Playwright's Linux image, at the version the docs pin, so local
# screenshots match CI's pixels. With no arguments it runs the docs and studio suites; with
# arguments it runs only the docs suite and passes them to Playwright (e.g. --update-snapshots,
# -g "pattern", --project=visual). node_modules inside the container live in named volumes, so the
# host's macOS binaries and the container's Linux ones never mix.
set -eu
cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./apps/docs/package.json').devDependencies['@playwright/test']")
IMAGE="mcr.microsoft.com/playwright:v${VERSION}-noble"

VOLUMES="-v raster-pnpm-store:/pnpm-store"
for dir in node_modules packages/*/node_modules apps/*/node_modules; do
  [ -d "$dir" ] || continue
  VOLUMES="$VOLUMES -v raster-$(echo "$dir" | tr '/' '-'):/work/$dir"
done

# shellcheck disable=SC2086
exec docker run --rm --init --ipc=host \
  -v "$PWD":/work -w /work $VOLUMES \
  -e npm_config_store_dir=/pnpm-store -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  "$IMAGE" sh -c '
    set -e
    corepack enable
    pnpm install --frozen-lockfile --config.confirmModulesPurge=false
    pnpm build
    if [ "$#" -gt 0 ]; then
      pnpm --filter @raster/docs exec playwright test "$@"
    else
      pnpm --filter @raster/docs exec playwright test
      pnpm --filter @raster/studio exec playwright test
    fi
  ' sh "$@"
```
`chmod +x scripts/e2e-docker.sh`.

Root `package.json` scripts:
- `"e2e": "sh scripts/e2e-docker.sh"`
- `"baselines": "sh scripts/e2e-docker.sh --update-snapshots"`

- [ ] **Step 2: A tighter cap on full-page screenshots**

In `apps/docs/e2e/visual.spec.ts`, the template screenshot with `fullPage: true` becomes:
```ts
// A full page is about 800,000 pixels, so the 0.1% ratio would let a header-sized change (about
// 600 pixels) through; cap the count as well (spec §9).
await expect(page).toHaveScreenshot(`template-${slug(path)}-${variant}.png`, { fullPage: true, maxDiffPixels: 100 });
```
Grep for any other `fullPage: true` screenshot in `apps/docs/e2e`, and give each one the same cap.

In `apps/docs/playwright.config.ts`, replace the comment over `snapshotPathTemplate` with:
```ts
// Baselines are Linux only (…-linux.png), made in Playwright's Docker image: `pnpm baselines`.
```

- [ ] **Step 3: First run in the container, to prove the script works**

```bash
docker info >/dev/null && pnpm e2e -- --project=chromium -g "site"
```
Expected: the image pulls on first use, install and build run in the container, and the site tests pass. Screenshots have not been made yet.

If pnpm in the container complains about the store or node_modules, fix the script, not the repo.

- [ ] **Step 4: Replace the macOS baselines with Linux ones**

```bash
git rm -q 'apps/docs/e2e/__screenshots__/*-darwin.png'
pnpm baselines
```
This takes a long time (about 1,450 screenshots), so run it in the background.

Expected: Playwright writes every `*-linux.png` ("missing" snapshots are written and pass).

Then run `ls apps/docs/e2e/__screenshots__ | grep -c linux`. The count must equal the number of macOS files deleted, which `git status` shows. If they differ, find which names exist only on one side and explain why before going on.

- [ ] **Step 5: Look at the new baselines**

Open these with the Read tool, and confirm that each shows its example whole, with Geist type rendered (not a fallback font) and nothing blank or cut:
- a component (`button-1-alpine-light-1440-linux.png`);
- a chart (`line-chart-1-zurich-dark-768-linux.png`);
- a pattern (`pattern-forms-1-alpine-light-360-linux.png`);
- a full-page template (`template-manifesto-zurich-light-1440-linux.png`, or the nearest name);
- a forced-colours shot (`forced-meter-linux.png`).

- [ ] **Step 6: The whole suite passes in the container, twice**

```bash
pnpm e2e
```
Expected: the docs (chromium and visual) and studio suites all pass. Then run `pnpm e2e` again: it must pass with no snapshot changes, which proves the baselines are stable rather than flaky.

- **Parity failures:** parity screenshots compare two routes on one platform at 0 pixels. If one fails on Linux, investigate with superpowers:systematic-debugging, for example fractional offsets as in spec §9. Do not raise the tolerance unless the user agrees, and record any change in §21.
- **Timeouts:** treat timeouts under load as in Plan 8: re-run that test with `--repeat-each=3`.

- [ ] **Step 7: Commit**

```bash
git add -A scripts/e2e-docker.sh package.json apps/docs/playwright.config.ts apps/docs/e2e
git commit -m "test: run e2e in Playwright's Linux image; Linux baselines replace macOS; cap full-page diffs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: CI workflow and Cloudflare configuration

**Files:**
- Create: `.github/workflows/ci.yml`, `apps/docs/wrangler.jsonc`, `apps/studio/wrangler.jsonc`
- Modify: the root `package.json` (adds wrangler)

- [ ] **Step 1: Wrangler configs**

```bash
pnpm add -D -w wrangler
```
Pin the version.

`apps/docs/wrangler.jsonc`:
```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "raster-docs",
  "compatibility_date": "2026-11-01",
  // Static assets only: no Worker script. Astro writes every page as <path>/index.html.
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  },
  "workers_dev": true,
  "preview_urls": true
}
```
`apps/studio/wrangler.jsonc` is the same, with `"name": "raster-studio"` and `"not_found_handling": "none"`, because the studio has no 404 page.

Check that both configs are valid without an account:
```bash
pnpm build
pnpm exec wrangler deploy --dry-run --config apps/docs/wrangler.jsonc
pnpm exec wrangler deploy --dry-run --config apps/studio/wrangler.jsonc
```
Expected: each dry run lists the assets it would upload and exits 0. If wrangler rejects a key in this version, follow its message and note the change.

- [ ] **Step 2: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  PLAYWRIGHT_IMAGE: mcr.microsoft.com/playwright:v1.64.1-noble

jobs:
  check:
    name: Build, lint, typecheck, unit tests, pack check
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm pack-check

  docs-e2e:
    name: Docs e2e (${{ matrix.shard }}/4)
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.64.1-noble
      options: --ipc=host
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    env:
      CI: "1"
      HOME: /root # Firefox and Chromium in the image expect root's home
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm --filter @raster/docs exec playwright test --shard=${{ matrix.shard }}/4
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: docs-e2e-${{ matrix.shard }}
          path: apps/docs/test-results
          retention-days: 7

  studio-e2e:
    name: Studio e2e
    runs-on: ubuntu-24.04
    container:
      image: mcr.microsoft.com/playwright:v1.64.1-noble
      options: --ipc=host
    env:
      CI: "1"
      HOME: /root
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm --filter @raster/studio exec playwright test
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: studio-e2e
          path: apps/studio/test-results
          retention-days: 7

  deploy:
    name: Deploy to Cloudflare
    needs: [check, docs-e2e, studio-e2e]
    # Secrets are not available to pull requests from forks; those get no preview.
    if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-24.04
    permissions:
      contents: read
      pull-requests: write
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Deploy production
        if: github.event_name == 'push'
        run: |
          pnpm exec wrangler deploy --config apps/docs/wrangler.jsonc
          pnpm exec wrangler deploy --config apps/studio/wrangler.jsonc
      - name: Upload previews
        if: github.event_name == 'pull_request'
        run: |
          alias="pr-${{ github.event.number }}"
          pnpm exec wrangler versions upload --config apps/docs/wrangler.jsonc --preview-alias "$alias"
          pnpm exec wrangler versions upload --config apps/studio/wrangler.jsonc --preview-alias "$alias"
      - name: Comment preview links
        if: github.event_name == 'pull_request'
        env:
          GH_TOKEN: ${{ github.token }}
          SUBDOMAIN: ${{ vars.WORKERS_SUBDOMAIN }}
        run: |
          alias="pr-${{ github.event.number }}"
          body="Previews: [docs](https://${alias}-raster-docs.${SUBDOMAIN}.workers.dev/) · [studio](https://${alias}-raster-studio.${SUBDOMAIN}.workers.dev/)"
          gh pr comment ${{ github.event.number }} --body "$body" --edit-last --create-if-none
```
Remove the unused top-level `env: PLAYWRIGHT_IMAGE` if you don't refer to it. The `container.image` value cannot read `env`, so it is written out.

Keep the image tag in step with `@playwright/test`. Add this check to `scripts/pack-check.mjs`, at the top, before packing:
```js
const playwright = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8")).devDependencies["@playwright/test"];
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
if (!ci.includes(`playwright:v${playwright}-noble`)) throw new Error(`ci.yml's Playwright image must be v${playwright}-noble`);
```
Import `readFileSync` there.

- [ ] **Step 3: Lint the workflows**

```bash
docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:latest -color
```
Expected: no errors for `ci.yml` or `release.yml`. Fix anything it reports.

- [ ] **Step 4: Commit**

```bash
git add -A .github apps/docs/wrangler.jsonc apps/studio/wrangler.jsonc package.json pnpm-lock.yaml scripts/pack-check.mjs
git commit -m "ci: GitHub Actions for checks and sharded Linux e2e, and Cloudflare deploys with PR previews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Spec notes and verify

**Files:** Modify `docs/superpowers/specs/2026-11-06-raster-v2-components-design.md`

- [ ] **Step 1: Write §21 "Settled in Plan 9"**

Write it in the style of §17 and §19. It must cover:
- **The bundles:** why tsdown, and that `"use client"` is the first line of the React bundle. The pack check typechecks the consumer under both `Bundler` and `NodeNext`.
- **Releases:** the fixed group, the publish script, and why it packs with pnpm and publishes with npm. The first publish happens in Task 9; leave a line for it to fill in.
- **Linux baselines:** how many there are, and how long `pnpm baselines` takes. Record any parity or tolerance finding from running on Linux.
- **CI:** the shard count. Task 9 adds a typical run time.
- **Hosting:** "not yet deployed". Task 9 replaces it with the URLs.
- **Known gaps:**
  - no Figma component library;
  - no custom domain;
  - the design-tool files leave out shadows and the scrim;
  - Figma's import has not been tried by hand unless it was during the build.

- [ ] **Step 2: Verify**

Run: `pnpm verify`. Docker must be running, because e2e now runs in the container.

Expected: build, lint, typecheck, unit tests, the pack check and e2e all pass. Treat timeouts under load as in Plan 8.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-11-06-raster-v2-components-design.md
git commit -m "docs(spec): record Plan 9's outcomes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

After this task, the plan branch is reviewed and merged into `main` as usual. Task 9 runs on `main`.

---

### Task 9: Go live (checkpoints with the user, after the merge)

**Files:**
- Create: `RELEASING.md`

The person building this plan stops at each **CHECKPOINT (user)** and asks in chat. Nothing in this task is pushed, published or configured without that answer.

- [ ] **Step 1: RELEASING.md**

```markdown
# Releasing Raster

## Every change
Run `pnpm changeset` for anything users of the packages will notice. Pick patch, minor or major; the three packages share one version, so one entry covers them all.

## A release
When changesets reach `main` and CI passes there, the Release workflow opens a "Version packages" PR. It runs only after CI succeeds on a push to `main`, so a commit with failing checks never publishes. CI does not run on the Version PR itself, because the action opens it with `GITHUB_TOKEN`; its checks run once it is merged, before anything is published. Merging it bumps the version, writes each package's CHANGELOG.md, and publishes to npm with provenance (trusted publishing, no token). Tags `@raster/<name>@<version>` mark each release.

## First-time setup (done once)
1. GitHub: the public repository `joshi-alok/raster`.
2. Cloudflare: an API token with "Workers Scripts: Edit" on the account, saved as the `CLOUDFLARE_API_TOKEN` secret; the account id as `CLOUDFLARE_ACCOUNT_ID`; the workers.dev subdomain as the `WORKERS_SUBDOMAIN` variable.
3. npm: the `raster` organisation; a first manual publish (`npm login`, `pnpm build`, `node scripts/publish.mjs`), because trusted publishing can only be set up for a package that exists; then for each package, npmjs.com → Settings → Trusted publishing → GitHub Actions: repository `joshi-alok/raster`, workflow `release.yml`.

## Baselines
Screenshot baselines are Linux only. After a visual change: `pnpm baselines`, look at the changed images, and commit them.
```
Commit it.

- [ ] **Step 2: Secret scan before going public**

```bash
docker run --rm -v "$PWD":/repo zricethezav/gitleaks:latest git /repo --no-banner
```
Expected: `no leaks found`. If it reports anything, stop and show the user the findings. Report the file and commit, never the secret value.

- [ ] **Step 3: CHECKPOINT (user): create the repository and push**

Ask the user to approve this, quoting the command:
```bash
gh repo create joshi-alok/raster --public --source . --remote origin --description "A design system in the Swiss International Style"
git push -u origin main
```
`main` already holds Plan 9 by now, because it was merged after Task 8.

After the push, watch the CI run with `gh run watch`.
- `check` must pass.
- The e2e shards must pass on GitHub's runners. A failure that only happens there, such as a timeout, is debugged and fixed here.
- `deploy` fails until Step 4 adds the Cloudflare secrets. Say so to the user rather than treating it as a code failure.

- [ ] **Step 4: CHECKPOINT (user): Cloudflare**

The user creates the token, then runs these themselves, because secrets are typed by them and not by the agent:
```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh variable set WORKERS_SUBDOMAIN --body "<their workers.dev subdomain>"
```
Then re-run the failed `deploy` job (`gh run rerun --failed`). Open `https://raster-docs.<subdomain>.workers.dev/` in the browser pane, and check:
- the home page;
- `/get-started/`;
- one component page;
- a design-tool download;
- an unknown path, which must show the 404 page.

Do the same for `https://raster-studio.<subdomain>.workers.dev/`. Then set each package's `homepage` to the docs URL in a small commit, through a PR or with the user's approval to push.

- [ ] **Step 5: CHECKPOINT (user): npm**

The user creates the `raster` organisation on npmjs.com and runs `npm login`. Then, with their approval, run `node scripts/publish.mjs --dry-run` and show them the output. The user runs `node scripts/publish.mjs` themselves for the first publish of 0.1.0.

Then the user sets up trusted publishing for each of the three packages, as RELEASING.md describes. Confirm the packages are out:
```bash
npm view @raster/react version
```
Expected: `0.1.0`.

If the `raster` organisation name is taken, stop. Ask the user for another scope. A new scope means renaming the packages everywhere, which is its own change.

- [ ] **Step 6: Fill in §21**

Replace the placeholders that Task 8 left in §21 with:
- the hosting URLs;
- a typical CI run time;
- the first publish.

Commit on `main`. Push it with the user's approval, through a PR if they prefer.
