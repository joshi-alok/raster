import { defineConfig } from "astro/config";

export default defineConfig({
  // Every internal link ends in "/", so pages build to <path>/index.html and match exactly.
  trailingSlash: "always",
});
