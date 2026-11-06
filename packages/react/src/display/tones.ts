import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint } from "lucide-react";

export type Tone = "info" | "success" | "warning" | "danger";

export const TONE_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

/** Read before the content so tone never relies on colour or icon alone. */
export const TONE_WORDS: Record<Tone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  danger: "Error",
};
