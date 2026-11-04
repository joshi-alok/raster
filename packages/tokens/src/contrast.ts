import { contrastRatio } from "./color";
import type { Role, Theme } from "./themes";

export interface Pair {
  foreground: Role;
  background: Role;
  minimum: number;
}

export interface Violation extends Pair {
  theme: string;
  mode: "light" | "dark";
  ratio: number;
}

const SURFACES = ["surface-page", "surface-raised", "surface-subtle"] as const;
const TEXT = ["text-primary", "text-secondary", "text-muted", "accent", "success", "warning", "danger"] as const;
const STATUSES = ["accent", "success", "warning", "danger"] as const;

/** Every foreground/background pairing the system promises is legible. */
export function contrastPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const foreground of TEXT) {
    for (const background of SURFACES) pairs.push({ foreground, background, minimum: 4.5 });
  }
  for (const background of SURFACES) pairs.push({ foreground: "border-strong", background, minimum: 3 });
  for (const s of STATUSES) {
    pairs.push({ foreground: `on-${s}` as Role, background: s, minimum: 4.5 });
    pairs.push({ foreground: `on-${s}-subtle` as Role, background: `${s}-subtle` as Role, minimum: 4.5 });
  }
  return pairs;
}

export function checkTheme(theme: Theme): Violation[] {
  const violations: Violation[] = [];
  (["light", "dark"] as const).forEach((mode, i) => {
    for (const pair of contrastPairs()) {
      const ratio = contrastRatio(theme.colors[pair.foreground][i], theme.colors[pair.background][i]);
      if (ratio < pair.minimum) violations.push({ ...pair, theme: theme.name, mode, ratio });
    }
  });
  return violations;
}

export function formatViolations(violations: Violation[]): string {
  return violations
    .map(
      (v) =>
        `${v.theme}/${v.mode}: ${v.foreground} on ${v.background} = ${v.ratio.toFixed(2)}:1 (needs ${v.minimum}:1)`,
    )
    .join("\n");
}
