import { foundationTokens } from "./foundation";
import { ROLES, type Theme, themes } from "./themes";

type ColorToken = { $type: "color"; $value: string };

function modeGroup(theme: Theme, index: 0 | 1): Record<string, ColorToken> {
  return Object.fromEntries(
    ROLES.map((role): [string, ColorToken] => [role, { $type: "color", $value: theme.colors[role][index] }]),
  );
}

/** W3C Design Tokens Community Group format, for Figma and other tools. */
export function tokensJson() {
  return {
    foundation: Object.fromEntries(
      Object.entries(foundationTokens()).map(([name, value]) => [name, { $value: value }]),
    ) as Record<string, { $value: string }>,
    themes: Object.fromEntries(
      themes.map((t) => [
        t.name,
        { light: modeGroup(t, 0), dark: modeGroup(t, 1), radius: { $type: "dimension", $value: t.radius } },
      ]),
    ) as Record<
      Theme["name"],
      { light: Record<string, ColorToken>; dark: Record<string, ColorToken>; radius: { $type: "dimension"; $value: string } }
    >,
  };
}
