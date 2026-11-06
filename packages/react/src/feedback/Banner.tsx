import { type ComponentPropsWithRef, type ReactNode, useState } from "react";
import { Button } from "../actions/Button";
import { type Tone, TONE_ICONS, TONE_WORDS } from "../display/tones";
import { cx } from "../utils/cx";

export type BannerProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: Tone;
  title?: ReactNode;
  /** Shows a dismiss button; called after the banner hides. */
  onDismiss?: () => void;
  /** Text of the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  /** Where focus goes after dismissing, as a selector. Defaults to "#main". */
  focusAfterDismiss?: string;
};

/**
 * A page-level message strip, placed below the header. Danger uses the alert role; the other tones
 * use status. Without React the same markup works, minus the dismiss button.
 */
export function Banner({
  tone = "info",
  title,
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  focusAfterDismiss = "#main",
  className,
  ...rest
}: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const Icon = TONE_ICONS[tone];
  return (
    <div className={cx("sw-banner", className)} data-tone={tone} role={tone === "danger" ? "alert" : "status"} {...rest}>
      <div className="sw-banner-inner">
        <Icon aria-hidden="true" strokeWidth={1.5} />
        <div className="sw-banner-body">
          <span className="sw-sr-only">{TONE_WORDS[tone]}:</span>
          {title != null && title !== false && <p className="sw-banner-title">{title}</p>}
          {children}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            className="sw-banner-dismiss"
            onPress={() => {
              setDismissed(true);
              onDismiss();
              document.querySelector<HTMLElement>(focusAfterDismiss)?.focus();
            }}
          >
            {dismissLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
