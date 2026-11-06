import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

/** The first letters of the first and last words of a name, upper-cased: "Lea Brunner" → "LB". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return `${first}${last}`.toLocaleUpperCase();
}

export type AvatarProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  /** The person's name: the text alternative, and the source of the initials. */
  name: string;
  /** A photo. Without one, initials are shown. */
  src?: string;
  /** "sm" (32px), "md" (40px, the default) or "lg" (56px). */
  size?: "sm" | "md" | "lg";
  /** Hide from screen readers when the name is shown as text beside the avatar. */
  decorative?: boolean;
};

export function Avatar({ name, src, size = "md", decorative = false, className, ...rest }: AvatarProps) {
  if (src) {
    return (
      <span className={cx("sw-avatar", className)} data-size={size} aria-hidden={decorative || undefined} {...rest}>
        <img src={src} alt={decorative ? "" : name} />
      </span>
    );
  }
  return (
    <span
      className={cx("sw-avatar", className)}
      data-size={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      {...rest}
    >
      {initials(name)}
    </span>
  );
}
