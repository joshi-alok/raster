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
 * A panel anchored to its trigger. Place inside DialogTrigger after the trigger Button.
 * On this route it is modal, as React Aria recommends: focus moves in, the rest of the page is
 * hidden from assistive technology while it is open, and an outside click lands on an underlay
 * that closes it.
 * Native twin: an element with the popover attribute and class "sw-popover sw-popover-content".
 * That one is non-modal: it light-dismisses and the page stays exposed to assistive technology.
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
