import { contrastPairs, contrastRatio } from "@rasterdesign/tokens";

type ColourToken = { $value: string };
type ModeTokens = Record<string, ColourToken>;

/** The part of tokens.json (W3C DTCG) this page reads. */
export type TokensJson = { themes: Record<string, { light: ModeTokens; dark: ModeTokens }> };

export type ContrastRow = {
  foreground: string;
  background: string;
  foregroundValue: string;
  backgroundValue: string;
  ratio: number;
  minimum: number;
  passes: boolean;
};

export type ContrastTable = { theme: string; mode: "light" | "dark"; rows: ContrastRow[] };

function value(tokens: ModeTokens, role: string, where: string): string {
  const token = tokens[role];
  if (!token) throw new Error(`tokens.json has no ${role} in ${where}`);
  return token.$value;
}

/** Every pairing the token build checks, recomputed from tokens.json for each theme and mode. */
export function contrastTables(json: TokensJson): ContrastTable[] {
  const tables: ContrastTable[] = [];
  for (const [theme, modes] of Object.entries(json.themes)) {
    for (const mode of ["light", "dark"] as const) {
      const rows = contrastPairs().map(({ foreground, background, minimum }) => {
        const foregroundValue = value(modes[mode], foreground, `${theme}/${mode}`);
        const backgroundValue = value(modes[mode], background, `${theme}/${mode}`);
        const ratio = contrastRatio(foregroundValue, backgroundValue);
        return { foreground, background, foregroundValue, backgroundValue, ratio, minimum, passes: ratio >= minimum };
      });
      tables.push({ theme, mode, rows });
    }
  }
  return tables;
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

export const THEME_NAMES: Record<string, string> = { alpine: "Alpine", zurich: "Zürich" };
