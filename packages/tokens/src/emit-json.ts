import { foundationTokens } from "./foundation";
import { type Scale, SCALES } from "./scales";
import { ROLES, type Theme, themes } from "./themes";

type ColorToken = { $type: "color"; $value: string };

function modeGroup(theme: Theme, index: 0 | 1): Record<string, ColorToken> {
  return Object.fromEntries(
    ROLES.map((role): [string, ColorToken] => [role, { $type: "color", $value: theme.colors[role][index] }]),
  );
}

function scaleGroup(scales: Record<string, Scale>): Record<string, Record<string, ColorToken>> {
  return Object.fromEntries(
    Object.entries(scales).map(([hue, stops]) => [
      hue,
      Object.fromEntries(
        Object.entries(stops).map(([stop, value]): [string, ColorToken] => [stop, { $type: "color", $value: value }]),
      ),
    ]),
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
        {
          light: modeGroup(t, 0),
          dark: modeGroup(t, 1),
          radius: { $type: "dimension", $value: t.radius },
          scales: scaleGroup(SCALES[t.name]),
        },
      ]),
    ) as Record<
      Theme["name"],
      {
        light: Record<string, ColorToken>;
        dark: Record<string, ColorToken>;
        radius: { $type: "dimension"; $value: string };
        scales: Record<string, Record<string, ColorToken>>;
      }
    >,
  };
}
