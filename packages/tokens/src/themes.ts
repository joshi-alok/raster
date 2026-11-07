export const ROLES = [
  "surface-page", "surface-raised", "surface-subtle",
  "text-primary", "text-secondary", "text-muted",
  "border", "border-strong",
  "accent", "on-accent", "accent-subtle", "on-accent-subtle",
  "success", "on-success", "success-subtle", "on-success-subtle",
  "warning", "on-warning", "warning-subtle", "on-warning-subtle",
  "danger", "on-danger", "danger-subtle", "on-danger-subtle",
  "brand-signal",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-muted",
] as const;

export type Role = (typeof ROLES)[number];

/** [light, dark] */
export type ModePair = readonly [string, string];

export interface Theme {
  name: "alpine" | "zurich";
  radius: string;
  colors: Record<Role, ModePair>;
}

export const alpine: Theme = {
  name: "alpine",
  radius: "4px",
  colors: {
    "surface-page": ["#FFFFFF", "#12181D"],
    "surface-raised": ["#FFFFFF", "#1A2229"],
    "surface-subtle": ["#F2F5F7", "#222C34"],
    "text-primary": ["#1B242C", "#E6ECF0"],
    "text-secondary": ["#4A5763", "#A3AFB9"],
    "text-muted": ["#63707C", "#8794A0"],
    border: ["#E3E8EC", "#2E3943"],
    "border-strong": ["#7D8A96", "#74818D"],
    accent: ["#2F5F8A", "#9DC0DE"],
    "on-accent": ["#FFFFFF", "#12181D"],
    "accent-subtle": ["#E3EDF5", "#183652"],
    "on-accent-subtle": ["#183652", "#9DC0DE"],
    success: ["#476445", "#A3BFA0"],
    "on-success": ["#FFFFFF", "#12181D"],
    "success-subtle": ["#E6EEE5", "#2A3D29"],
    "on-success-subtle": ["#2A3D29", "#A3BFA0"],
    warning: ["#7F5C14", "#E2B85C"],
    "on-warning": ["#FFFFFF", "#12181D"],
    "warning-subtle": ["#F7EED9", "#4A360C"],
    "on-warning-subtle": ["#4A360C", "#E2B85C"],
    danger: ["#B23422", "#F08A78"],
    "on-danger": ["#FFFFFF", "#12181D"],
    "danger-subtle": ["#FBE7E4", "#6E1F14"],
    "on-danger-subtle": ["#6E1F14", "#F08A78"],
    "brand-signal": ["#7FA7C9", "#9DC0DE"],
    // Charts (spec §16): series slots in a fixed order, checked by chart-palette.ts.
    "chart-1": ["#2E6DB4", "#4A8AD4"],
    "chart-2": ["#C8661A", "#D07A35"],
    "chart-3": ["#00897B", "#1A9E8F"],
    "chart-4": ["#8E4FA6", "#A26BC0"],
    "chart-5": ["#9A8A10", "#A39418"],
    "chart-6": ["#C2457A", "#D2638F"],
    "chart-muted": ["#B4BFC8", "#4A5763"],
  },
};

export const zurich: Theme = {
  name: "zurich",
  radius: "0",
  colors: {
    "surface-page": ["#FCFBF8", "#161513"],
    "surface-raised": ["#FFFFFF", "#1F1E1B"],
    "surface-subtle": ["#F4F1EA", "#282622"],
    "text-primary": ["#1C1C1E", "#EDEAE3"],
    "text-secondary": ["#55524C", "#B3AEA4"],
    "text-muted": ["#6B665D", "#918C82"],
    border: ["#E8E4DA", "#34322D"],
    "border-strong": ["#8A847A", "#7E796F"],
    accent: ["#2F4BD8", "#9DAAF0"],
    "on-accent": ["#FFFFFF", "#161513"],
    "accent-subtle": ["#E4E8FB", "#1A2A80"],
    "on-accent-subtle": ["#1A2A80", "#9DAAF0"],
    success: ["#4F6450", "#A8BBA6"],
    "on-success": ["#FFFFFF", "#161513"],
    "success-subtle": ["#E8EEE7", "#2C3A2D"],
    "on-success-subtle": ["#2C3A2D", "#A8BBA6"],
    warning: ["#7F5C14", "#E2B85C"],
    "on-warning": ["#FFFFFF", "#161513"],
    "warning-subtle": ["#F7EED9", "#4A360C"],
    "on-warning-subtle": ["#4A360C", "#E2B85C"],
    danger: ["#C02A17", "#F2836F"],
    "on-danger": ["#FFFFFF", "#161513"],
    "danger-subtle": ["#FBE5E1", "#6F180D"],
    "on-danger-subtle": ["#6F180D", "#F2836F"],
    "brand-signal": ["#E5341D", "#F2836F"],
    "chart-1": ["#2F4BD8", "#7086F0"],
    "chart-2": ["#C8661A", "#D07A35"],
    "chart-3": ["#00897B", "#1A9E8F"],
    "chart-4": ["#8E4FA6", "#A26BC0"],
    "chart-5": ["#9A8A10", "#A39418"],
    "chart-6": ["#C2457A", "#D2638F"],
    "chart-muted": ["#BDB7AA", "#55524C"],
  },
};

/** Order matters: Alpine is emitted first so `[data-theme="zurich"]` on :root overrides it. */
export const themes: readonly Theme[] = [alpine, zurich];
