/**
 * The content style rules a script can check (see /foundations/content/). Pure functions over
 * strings; test/copy.test.ts runs them over the docs' own copy.
 */
export type CopyRule = "exclamation" | "click-here" | "error-prefix" | "ellipsis" | "spelling" | "sentence-case" | "generic-label";

export interface CopyIssue {
  rule: CopyRule;
  detail: string;
}

/** American spellings and the British ones Raster writes. Whole words only. */
export const SPELLINGS: Readonly<Record<string, string>> = {
  color: "colour",
  colors: "colours",
  colored: "coloured",
  center: "centre",
  centers: "centres",
  centered: "centred",
  gray: "grey",
  behavior: "behaviour",
  behaviors: "behaviours",
  favorite: "favourite",
  favorites: "favourites",
  canceled: "cancelled",
  catalog: "catalogue",
  organize: "organise",
  organized: "organised",
};

/**
 * Words that keep their capital mid-sentence: places, people, products, languages, months,
 * days and key names. Add only real proper nouns; fix any other capital in the copy instead.
 */
export const PROPER_NOUNS: ReadonlySet<string> = new Set([
  "Raster", "Swiss", "Zürich", "Basel", "Bern", "Geneva", "Alpine",
  "React", "Aria", "Astro", "Geist", "Chrome", "Safari", "Firefox", "Windows", "VoiceOver",
  "English", "British", "American", "German", "French", "Italian",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "Enter", "Escape", "Tab", "Space", "Home", "End", "Shift", "Page", "Up", "Down", "Left", "Right", "Backspace", "Delete",
]);

/** Button labels that say nothing about what happens. */
const GENERIC_LABELS = new Set(["ok", "okay", "submit", "yes", "no", "go", "click here"]);

const withoutCode = (text: string) => text.replace(/`[^`]*`/g, " ");
const withoutQuotes = (text: string) => text.replace(/"[^"]*"|“[^”]*”|‘[^’]*’/g, " ");

export function checkCopy(text: string): CopyIssue[] {
  const t = withoutCode(text);
  const issues: CopyIssue[] = [];
  if (t.includes("!")) issues.push({ rule: "exclamation", detail: text });
  if (/\bclick here\b/i.test(t)) issues.push({ rule: "click-here", detail: text });
  if (/^\s*error\s*:/i.test(t)) issues.push({ rule: "error-prefix", detail: text });
  if (t.includes("...")) issues.push({ rule: "ellipsis", detail: text });
  for (const word of t.toLowerCase().match(/\p{L}+/gu) ?? []) {
    const british = SPELLINGS[word];
    if (british !== undefined) issues.push({ rule: "spelling", detail: `${word}: write "${british}"` });
  }
  return issues;
}

function keepsCapital(word: string, names: ReadonlySet<string>): boolean {
  return (
    names.has(word) ||
    PROPER_NOUNS.has(word) ||
    /^[\p{Lu}\d]+s?$/u.test(word) || // acronyms: CSV, URLs, A4
    /\p{Ll}\p{Lu}/u.test(word) || // names with an inner capital: DataGrid, VoiceOver
    /\d/.test(word) ||
    word.split("-").every((part) => PROPER_NOUNS.has(part)) // Müller-Brockmann, once both parts are listed
  );
}

/** Capitals only at the start of a sentence, in proper nouns, names, acronyms and quoted text. */
export function checkSentenceCase(text: string, names: ReadonlySet<string>): CopyIssue[] {
  const issues: CopyIssue[] = [];
  let sentenceStart = true;
  for (const raw of withoutQuotes(withoutCode(text)).split(/\s+/)) {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (word !== "") {
      if (!sentenceStart && /^\p{Lu}/u.test(word) && !keepsCapital(word, names)) {
        issues.push({ rule: "sentence-case", detail: `"${word}" in "${text}"` });
      }
      sentenceStart = false;
    }
    if (/[.?:;]$/.test(raw)) sentenceStart = true;
  }
  return issues;
}

export function checkButtonLabel(label: string): CopyIssue[] {
  return GENERIC_LABELS.has(label.trim().toLowerCase()) ? [{ rule: "generic-label", detail: label }] : [];
}
