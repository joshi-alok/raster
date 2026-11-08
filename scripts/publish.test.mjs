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
