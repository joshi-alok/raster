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
