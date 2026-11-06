import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type PopoverProps = {
  /** Visible title; it also names the popover. Without one, pass aria-label. */
  title?: ReactNode;
  "aria-label"?: string;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Position relative to the trigger. Defaults to "bottom start". */
  placement?: AriaPopoverProps["placement"];
  className?: string;
};

/**
 * A non-modal panel anchored to its trigger. Place inside DialogTrigger after the trigger Button.
 * Native twin: an element with the popover attribute and class "sw-popover sw-popover-content".
 */
export function Popover({ title, children, placement = "bottom start", className, "aria-label": ariaLabel }: PopoverProps) {
  return (
    <AriaPopover className={cx("sw-popover sw-popover-content", className)} placement={placement} offset={8}>
      <AriaDialog className="sw-popover-dialog" aria-label={ariaLabel}>
        {({ close }) => (
          <>
            {title != null && (
              <AriaHeading slot="title" level={3} className="sw-popover-title">
                {title}
              </AriaHeading>
            )}
            {typeof children === "function" ? children({ close }) : children}
          </>
        )}
      </AriaDialog>
    </AriaPopover>
  );
}
