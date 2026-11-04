import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type TagTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type TagProps = ComponentPropsWithRef<"span"> & { tone?: TagTone };

export function Tag({ tone = "neutral", className, ...rest }: TagProps) {
  return <span className={cx("sw-tag", className)} data-tone={tone === "neutral" ? undefined : tone} {...rest} />;
}
