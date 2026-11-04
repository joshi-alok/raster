import type { Theme } from "./themes";

export const SCALE_STOPS = ["50", "100", "300", "500", "700", "900"] as const;
export type ScaleStop = (typeof SCALE_STOPS)[number];
export type Scale = Partial<Record<ScaleStop, string>>;

const ochre: Scale = { "100": "#F7EED9", "300": "#E5C98A", "500": "#C9962E", "700": "#7F5C14", "900": "#4A360C" };

/**
 * Per-theme hue ramps (spec §5). They are design-time references: themes map their roles onto
 * these stops, and components never use them directly. Neutrals add a 50 stop.
 */
export const SCALES = {
  alpine: {
    slate: { "50": "#F2F5F7", "100": "#E3E8EC", "300": "#B4BFC8", "500": "#7D8A96", "700": "#4A5763", "900": "#1B242C" },
    glacier: { "100": "#E3EDF5", "300": "#A9C6DE", "500": "#7FA7C9", "700": "#2F5F8A", "900": "#183652" },
    moss: { "100": "#E6EEE5", "300": "#B7CBB4", "500": "#7C9A79", "700": "#476445", "900": "#2A3D29" },
    alert: { "100": "#FBE7E4", "300": "#F2AFA4", "500": "#D6402E", "700": "#B23422", "900": "#6E1F14" },
    ochre,
  },
  zurich: {
    "warm-grey": { "50": "#F4F1EA", "100": "#E8E4DA", "300": "#BDB7AA", "500": "#8A847A", "700": "#55524C", "900": "#1C1C1E" },
    cobalt: { "100": "#E4E8FB", "300": "#9DAAF0", "500": "#6A7FEA", "700": "#2F4BD8", "900": "#1A2A80" },
    sage: { "100": "#E8EEE7", "300": "#C3D0C1", "500": "#9DB09A", "700": "#4F6450", "900": "#2C3A2D" },
    "signal-red": { "100": "#FBE5E1", "300": "#F4A797", "500": "#E5341D", "700": "#C02A17", "900": "#6F180D" },
    ochre,
  },
} satisfies Record<Theme["name"], Record<string, Scale>>;
