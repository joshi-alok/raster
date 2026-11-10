import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BarChart, LineChart, numberFormatter, Sparkline } from "@rasterdesign/react";
import { describe, expect, it } from "vitest";
import { projectsByYear } from "../src/demos/bar-chart/ProjectsByYear";
import { visitors } from "../src/demos/line-chart/Visitors";
import { revenue } from "../src/demos/sparkline/InAStat";
import { htmlSnippet } from "../src/lib/html-snippet";

// en-US, as Playwright's browser is, so the parity screenshots compare like with like.
const format = numberFormatter("en-US");

/**
 * The native examples are what a server would write. They are the React components drawn without
 * the focus layer, so this test keeps each committed file equal to that rendering. After changing a
 * demo or the components, regenerate with: UPDATE_CHART_HTML=1 npx vitest run test/chart-html.test.tsx
 */
const CASES = [
  {
    file: "../src/demos/bar-chart/projects-by-year.html",
    Demo: () => <BarChart {...projectsByYear} format={format} interactive={false} />,
  },
  { file: "../src/demos/line-chart/visitors.html", Demo: () => <LineChart {...visitors} format={format} interactive={false} /> },
  { file: "../src/demos/sparkline/revenue.html", Demo: () => <Sparkline {...revenue} format={format} /> },
];

describe("native chart examples", () => {
  it.each(CASES)("$file is the React rendering without the focus layer", async ({ file, Demo }) => {
    const path = fileURLToPath(new URL(file, import.meta.url));
    const html = `${await htmlSnippet(Demo)}\n`;
    if (process.env.UPDATE_CHART_HTML) writeFileSync(path, html);
    expect(readFileSync(path, "utf8")).toBe(html);
  });
});
