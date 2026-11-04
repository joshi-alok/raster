const ROOT_PX = 16;
const VIEWPORT_MIN = 360;
const VIEWPORT_MAX = 1440;

const fmt = (n: number): string => String(Number(n.toFixed(4)));

export const rem = (px: number): string => `${fmt(px / ROOT_PX)}rem`;

/** A clamp() that grows linearly from minPx at a 360px viewport to maxPx at 1440px. */
export function fluid(minPx: number, maxPx: number): string {
  if (minPx === maxPx) return rem(minPx);
  const slope = (maxPx - minPx) / (VIEWPORT_MAX - VIEWPORT_MIN);
  const intercept = minPx - slope * VIEWPORT_MIN;
  return `clamp(${rem(minPx)}, ${fmt(intercept / ROOT_PX)}rem + ${fmt(slope * 100)}vw, ${rem(maxPx)})`;
}

export interface TypeStep {
  min: number;
  max: number;
  weight: 300 | 400 | 500;
  tracking: string;
  leading: number;
}

export const TYPE_STEPS = {
  display: { min: 40, max: 52, weight: 300, tracking: "-0.025em", leading: 1.1 },
  h1: { min: 33, max: 42, weight: 400, tracking: "-0.02em", leading: 1.15 },
  h2: { min: 28, max: 33, weight: 400, tracking: "-0.015em", leading: 1.15 },
  h3: { min: 23, max: 27, weight: 400, tracking: "-0.01em", leading: 1.2 },
  h4: { min: 19, max: 21, weight: 500, tracking: "0", leading: 1.3 },
  body: { min: 16, max: 17, weight: 400, tracking: "0", leading: 1.5 },
  caption: { min: 13, max: 14, weight: 400, tracking: "0", leading: 1.4 },
  label: { min: 12, max: 12, weight: 400, tracking: "0.04em", leading: 1.3 },
} as const satisfies Record<string, TypeStep>;

/** [minPx, maxPx] per spacing step; steps 7–9 grow with the viewport. */
const SPACE: ReadonlyArray<readonly [number, number]> = [
  [4, 4], [8, 8], [12, 12], [16, 16], [24, 24], [32, 32], [40, 48], [48, 64], [64, 96],
];

/** Theme-independent tokens, keyed by custom property name without the leading "--". */
export function foundationTokens(): Record<string, string> {
  const t: Record<string, string> = {
    "font-sans": '"Geist Variable", "Geist", "Noto Sans", system-ui, sans-serif',
    "font-mono": '"Geist Mono Variable", "Geist Mono", ui-monospace, Menlo, monospace',
  };

  for (const [name, step] of Object.entries(TYPE_STEPS)) {
    t[`text-${name}-size`] = fluid(step.min, step.max);
    t[`text-${name}-weight`] = String(step.weight);
    t[`text-${name}-tracking`] = step.tracking;
    t[`text-${name}-leading`] = String(step.leading);
  }

  SPACE.forEach(([min, max], i) => {
    t[`space-${i + 1}`] = fluid(min, max);
  });

  Object.assign(t, {
    "grid-gutter": "clamp(1rem, 2vw, 2rem)",
    "page-margin": "clamp(1rem, 5vw, 6rem)",
    "content-max": "90rem",
    "control-height": rem(40),
    "target-min": rem(44),
    "focus-width": "2px",
    "focus-offset": "2px",
    "radius-full": "9999px",
    "shadow-overlay":
      "0 8px 24px light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.48)), 0 2px 6px light-dark(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.32))",
    scrim: "light-dark(rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6))",
    "dur-fast": "120ms",
    "dur-base": "200ms",
    "dur-slow": "320ms",
    "dur-layout": "480ms",
    "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
    "ease-linear": "linear",
  });

  return t;
}
