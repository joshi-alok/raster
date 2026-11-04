import type { CoverKind } from "../data/projects";

/** Everything Art.astro can draw: the six project covers plus case-study and contact figures. */
export type ArtKind = CoverKind | "signs" | "route" | "grid-study" | "palette" | "map";
