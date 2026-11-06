import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type BadgeProps = ComponentPropsWithRef<"span"> & {
  /** "neutral" (default), "accent" or "danger". */
  tone?: "neutral" | "accent" | "danger";
  /** What a count means, read instead of the bare number: "3 unread messages". */
  label?: string;
  children: ReactNode;
};

/** A small count or status marker. Give counts a label, so "3" is never read without its meaning. */
export function Badge({ tone = "neutral", label, children, className, ...rest }: BadgeProps) {
  return (
    <span className={cx("sw-badge", className)} data-tone={tone} {...rest}>
      {label ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sw-sr-only">{label}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}
