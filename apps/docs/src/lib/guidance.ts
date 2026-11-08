import { componentHref } from "./components";

/** The pattern pages, in reading order. Their MDX files are src/content/patterns/<id>.mdx. */
export const PATTERNS = [
  { id: "forms", title: "Forms" },
  { id: "navigation", title: "Navigation" },
  { id: "data", title: "Data" },
  { id: "empty-states", title: "Empty states" },
  { id: "errors-and-feedback", title: "Errors and feedback" },
] as const;

export const patternHref = (id: string) => `/patterns/${id}/`;

const PATTERN_PREFIX = "patterns/";

/**
 * The link for an `avoid` item's `instead`: a component id ("select") or a pattern ("patterns/forms").
 * Null when it names nothing, so the page build can fail loudly.
 */
export function usageLink(instead: string, componentTitles: ReadonlyMap<string, string>): { href: string; text: string } | null {
  if (instead.startsWith(PATTERN_PREFIX)) {
    const id = instead.slice(PATTERN_PREFIX.length);
    const pattern = PATTERNS.find((p) => p.id === id);
    return pattern ? { href: patternHref(id), text: `See the ${pattern.title} pattern.` } : null;
  }
  const title = componentTitles.get(instead);
  return title ? { href: componentHref(instead), text: `Use ${title} instead.` } : null;
}

/** Pattern entries in PATTERNS order; unknown ids last. */
export function sortPatterns<T extends { id: string }>(entries: readonly T[]): T[] {
  const rank = (id: string) => {
    const i = PATTERNS.findIndex((p) => p.id === id);
    return i === -1 ? PATTERNS.length : i;
  };
  return [...entries].sort((a, b) => rank(a.id) - rank(b.id));
}
