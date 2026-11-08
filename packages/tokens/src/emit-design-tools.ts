import { SPACE, TYPE_STEPS, VIEWPORT_MAX, VIEWPORT_MIN } from "./foundation";
import { SCALES } from "./scales";
import { ROLES, type Theme, themes } from "./themes";

/**
 * Design-tool tokens in the DTCG format (2025.10), one file per mode, as Figma's variables import
 * reads them. Colour files hold a theme's roles, scales and radius in one mode. Size files hold the
 * fluid scales resolved at the narrowest and widest layouts (360px and 1440px, the ends of each
 * clamp()), plus the fixed sizes, type, motion and families. Values DTCG has no type for (shadows,
 * the scrim, light-dark()) are left out.
 */
type Token = { $type: string; $value: unknown };
type Group = { [key: string]: Token | Group };

const round = (n: number) => Number(n.toFixed(4));
const px = (value: number) => ({ value: Number(value.toFixed(2)), unit: "px" });
const ms = (value: number) => ({ value, unit: "ms" });

function color(hex: string): Token {
  const h = hex.toLowerCase();
  const components = [1, 3, 5].map((i) => round(parseInt(h.slice(i, i + 2), 16) / 255));
  return { $type: "color", $value: { colorSpace: "srgb", components, hex: h } };
}

function colourFile(theme: Theme, index: 0 | 1): Group {
  return {
    color: Object.fromEntries(ROLES.map((role) => [role, color(theme.colors[role][index])])),
    scale: Object.fromEntries(
      Object.entries(SCALES[theme.name]).map(([hue, stops]) => [
        hue,
        Object.fromEntries(Object.entries(stops).map(([stop, hex]) => [stop, color(hex as string)])),
      ]),
    ),
    radius: { $type: "dimension", $value: px(parseFloat(theme.radius)) },
  };
}

const WIDTHS = { mobile: VIEWPORT_MIN, desktop: VIEWPORT_MAX } as const;

/** clamp(min, vw, max) at a viewport width, in px. */
const clampAt = (minPx: number, vw: number, maxPx: number, width: number) => Math.min(maxPx, Math.max(minPx, (vw / 100) * width));

function sizeFile(mode: keyof typeof WIDTHS): Group {
  const width = WIDTHS[mode];
  const at = (min: number, max: number) => (mode === "mobile" ? min : max);
  const dimension = (value: number): Token => ({ $type: "dimension", $value: px(value) });
  const family = (names: string[]): Token => ({ $type: "fontFamily", $value: names });
  return {
    font: {
      sans: family(["Geist Variable", "Geist", "Noto Sans", "system-ui", "sans-serif"]),
      mono: family(["Geist Mono Variable", "Geist Mono", "ui-monospace", "Menlo", "monospace"]),
    },
    text: Object.fromEntries(
      Object.entries(TYPE_STEPS).map(([name, step]) => {
        const size = at(step.min, step.max);
        return [
          name,
          {
            size: dimension(size),
            weight: { $type: "fontWeight", $value: step.weight },
            leading: { $type: "number", $value: step.leading },
            tracking: dimension(parseFloat(step.tracking) * size),
          },
        ];
      }),
    ),
    space: Object.fromEntries(SPACE.map(([min, max], i) => [String(i + 1), dimension(at(min, max))])),
    layout: {
      "grid-gutter": dimension(clampAt(16, 2, 32, width)),
      "page-margin": dimension(clampAt(16, 5, 96, width)),
      "content-max": dimension(1440),
      "control-height": dimension(40),
      "target-min": dimension(44),
      "header-height": dimension(64),
      "focus-width": dimension(2),
      "focus-offset": dimension(2),
      "radius-full": dimension(9999),
    },
    motion: {
      "dur-fast": { $type: "duration", $value: ms(120) },
      "dur-base": { $type: "duration", $value: ms(200) },
      "dur-slow": { $type: "duration", $value: ms(320) },
      "dur-layout": { $type: "duration", $value: ms(480) },
      "ease-standard": { $type: "cubicBezier", $value: [0.2, 0, 0, 1] },
      "ease-linear": { $type: "cubicBezier", $value: [0, 0, 1, 1] },
    },
  };
}

/** File name → DTCG content, for every theme mode and both size modes. */
export function designToolFiles(): Record<string, Group> {
  const files: Record<string, Group> = {};
  for (const theme of themes) {
    files[`raster-${theme.name}-light.tokens.json`] = colourFile(theme, 0);
    files[`raster-${theme.name}-dark.tokens.json`] = colourFile(theme, 1);
  }
  files["raster-size-mobile.tokens.json"] = sizeFile("mobile");
  files["raster-size-desktop.tokens.json"] = sizeFile("desktop");
  return files;
}
