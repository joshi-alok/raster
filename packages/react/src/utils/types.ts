/** A step on the 4px-based spacing scale: --space-1 … --space-9. */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Inline CSS custom properties, e.g. { "--span-8": 4 }. */
export type CSSVars = Record<`--${string}`, string | number>;
