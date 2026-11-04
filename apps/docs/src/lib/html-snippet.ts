import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as htmlPlugin from "prettier/plugins/html";
import { format } from "prettier/standalone";

/**
 * The HTML a static demo renders, as a readable snippet of the @raster/css class contract.
 * React Aria's runtime attributes (generated ids, press markers, tabindex on native controls) are
 * removed, and Lucide icon paths are collapsed, since none of them is part of the contract.
 */
export async function htmlSnippet(Demo: ComponentType): Promise<string> {
  const raw = renderToStaticMarkup(createElement(Demo));
  // Generated ids are kept when another attribute points at them (labels, descriptions, controls).
  const referenced = new Set(
    [...raw.matchAll(/ (?:aria-labelledby|aria-describedby|aria-controls|for)="([^"]*)"/g)].flatMap((m) =>
      m[1].split(/\s+/),
    ),
  );
  const markup = raw
    .replace(/ data-rac=""/g, "")
    .replace(/ data-react-aria-pressable="true"/g, "")
    .replace(/ id="(react-aria-[^"]*)"/g, (whole, id: string) => (referenced.has(id) ? whole : ""))
    .replace(/(<(?:button|a)\b[^>]*?) tabindex="0"/g, "$1")
    .replace(/<svg\b[^>]*class="lucide[^"]*"[^>]*>.*?<\/svg>/g, '<svg aria-hidden="true"><!-- Lucide icon --></svg>');
  const formatted = await format(markup, {
    parser: "html",
    plugins: [htmlPlugin],
    printWidth: 88,
    htmlWhitespaceSensitivity: "ignore",
  });
  return formatted.trim();
}
