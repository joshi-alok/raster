import { designToolFiles } from "@rasterdesign/tokens";
import type { APIRoute, GetStaticPaths } from "astro";

/** The design-tool token files, at /design-tools/<name>.tokens.json, for download. */
export const getStaticPaths: GetStaticPaths = () => Object.keys(designToolFiles()).map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) =>
  new Response(`${JSON.stringify(designToolFiles()[params.file!], null, 2)}\n`, {
    headers: { "Content-Type": "application/json" },
  });
