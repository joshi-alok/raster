/** A piece of copy found in a demo's source: an attribute or key name, "text" or "button". */
export type DemoCopy = { kind: string; text: string };

/** Attributes and object keys whose values are copy people read. */
const COPY_KEYS = "label|title|description|errorMessage|aria-label|caption|placeholder|change|dismissLabel";

/** The index just past the brace that closes the one at `open`, skipping string contents. */
function closingBrace(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = source.indexOf(ch, i + 1);
      if (i < 0) return source.length;
    } else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return i + 1;
  }
  return source.length;
}

/** The string and template literals in an expression; each `${…}` reads as "1". */
function literals(expression: string): string[] {
  return [...expression.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)].map((m) =>
    (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, "1"),
  );
}

/**
 * The copy in a demo's source: quoted and expression attributes, object-literal keys, text between
 * tags, and Button labels. A regex alone cannot find the end of a tag whose attributes hold nested
 * braces ("onPress={() => add({ … })}"), so braces are matched by counting.
 */
export function demoCopy(source: string): DemoCopy[] {
  const found: DemoCopy[] = [];
  for (const m of source.matchAll(new RegExp(`\\b(${COPY_KEYS})(=|\\s*:\\s*)`, "g"))) {
    const start = m.index + m[0].length;
    const ch = source[start];
    if (m[2] === "=" && ch === "{") {
      const end = closingBrace(source, start);
      for (const text of literals(source.slice(start, end))) found.push({ kind: m[1], text });
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const end = source.indexOf(ch, start + 1);
      for (const text of literals(source.slice(start, end + 1))) found.push({ kind: m[1], text });
    }
  }
  for (const m of source.matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)) {
    found.push({ kind: "text", text: m[1].trim() });
  }
  for (const m of source.matchAll(/<Button\b/g)) {
    let i = m.index + m[0].length;
    while (i < source.length && source[i] !== ">") i = source[i] === "{" ? closingBrace(source, i) : i + 1;
    const label = /^>\s*([^<{]+?)\s*<\/Button>/.exec(source.slice(i));
    if (label) found.push({ kind: "button", text: label[1] });
  }
  return found;
}
