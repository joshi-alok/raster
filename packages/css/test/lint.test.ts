import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";
import { describe, expect, it } from "vitest";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(pkg, ".stylelintrc.json"), "utf8"));
const lint = async (code: string) => (await stylelint.lint({ code, config })).errored;

describe("raw colour guard", () => {
  it("rejects hex colours", async () => expect(await lint(".a { color: #fff; }")).toBe(true));
  it("rejects colour functions", async () => expect(await lint(".a { color: rgb(0 0 0); }")).toBe(true));
  it("rejects named colours", async () => expect(await lint(".a { color: red; }")).toBe(true));
  it("accepts token references", async () => expect(await lint(".a { color: var(--text-primary); }")).toBe(false));
  it("accepts transparent and color-mix of tokens", async () =>
    expect(await lint(".a { background: color-mix(in srgb, var(--accent) 10%, transparent); }")).toBe(false));

  it("passes for every source file", async () => {
    const result = await stylelint.lint({ files: "src/**/*.css", cwd: pkg, config });
    expect(result.errored).toBe(false);
  });
});
