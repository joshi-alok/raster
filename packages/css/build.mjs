import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleAsync } from "lightningcss";

const root = dirname(fileURLToPath(import.meta.url));

// Lightning CSS hoists/moves the source @layer statement, so the canonical order is re-asserted here
// to make the cascade independent of import order.
const LAYER_ORDER =
  "@layer raster.reset, raster.tokens, raster.base, raster.layout, raster.components, raster.utilities;";

/** Bundle src/index.css (resolving package imports such as @raster/tokens) into one string. */
export async function buildCss({ minify = false } = {}) {
  const { code } = await bundleAsync({
    filename: resolve(root, "src/index.css"),
    minify,
    resolver: {
      resolve(specifier, from) {
        if (specifier.startsWith(".")) return resolve(dirname(from), specifier);
        return createRequire(from).resolve(specifier);
      },
    },
  });
  return `${LAYER_ORDER}\n${code.toString()}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(resolve(root, "dist"), { recursive: true });
  writeFileSync(resolve(root, "dist/raster.css"), await buildCss());
  writeFileSync(resolve(root, "dist/raster.min.css"), await buildCss({ minify: true }));
  console.log("Wrote dist/raster.css and dist/raster.min.css");
}
