import { CircleCheck, Info, OctagonExclamationPoint, TriangleExclamationPoint } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type CalloutTone = "info" | "success" | "warning" | "danger";

export type CalloutProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: CalloutTone;
  title?: ReactNode;
};

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleExclamationPoint,
  danger: OctagonExclamationPoint,
} as const;

/** Read before the content so tone never relies on colour or icon alone. */
const TONE_WORDS: Record<CalloutTone, string> = {
  info: "Note",
  success: "Success",
  warning: "Warning",
  danger: "Error",
};

export function Callout({ tone = "info", title, children, className, ...rest }: CalloutProps) {
  const Icon = ICONS[tone];
  return (
    <div className={cx("sw-callout", className)} data-tone={tone} {...rest}>
      <Icon aria-hidden="true" strokeWidth={1.5} />
      <div className="sw-callout-body">
        <span className="sw-sr-only">{TONE_WORDS[tone]}:</span>
        {title && <p className="sw-callout-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}
