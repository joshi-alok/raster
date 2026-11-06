import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";
import { type Tone, TONE_ICONS, TONE_WORDS } from "./tones";

export type CalloutTone = Tone;

export type CalloutProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: CalloutTone;
  title?: ReactNode;
};

export function Callout({ tone = "info", title, children, className, ...rest }: CalloutProps) {
  const Icon = TONE_ICONS[tone];
  return (
    <div className={cx("sw-callout", className)} data-tone={tone} {...rest}>
      <Icon aria-hidden="true" strokeWidth={1.5} />
      <div className="sw-callout-body">
        <span className="sw-sr-only">{TONE_WORDS[tone]}:</span>
        {title != null && title !== false && <p className="sw-callout-title">{title}</p>}
        {children}
      </div>
    </div>
  );
}
