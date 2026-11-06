import type { ReactNode } from "react";
import { Dialog as AriaDialog, Heading as AriaHeading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

export type DrawerProps = {
  /** Visible title; also the drawer's accessible name. */
  title: ReactNode;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** "end" docks to the inline end (default); "bottom" makes a sheet. */
  placement?: "end" | "bottom";
  /** Close on a click outside the panel. Escape always closes. Defaults to true. */
  isDismissable?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Text of the close button. Defaults to "Close". */
  closeLabel?: string;
  className?: string;
};

/**
 * A modal panel docked to one edge. Place inside DialogTrigger after the trigger Button.
 * Native twin: <dialog class="sw-drawer"> opened by a button with command="show-modal".
 */
export function Drawer({
  title,
  children,
  placement = "end",
  isDismissable = true,
  isOpen,
  defaultOpen,
  onOpenChange,
  closeLabel = "Close",
  className,
}: DrawerProps) {
  return (
    <ModalOverlay
      className="sw-drawer-overlay"
      isDismissable={isDismissable}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className="sw-drawer" data-placement={placement}>
        <AriaDialog className={cx("sw-dialog sw-drawer-dialog", className)}>
          {({ close }) => (
            <>
              <div className="sw-drawer-head">
                <AriaHeading slot="title" level={2} className="sw-type-h3">
                  {title}
                </AriaHeading>
                <Button variant="ghost" onPress={close}>
                  {closeLabel}
                </Button>
              </div>
              {typeof children === "function" ? children({ close }) : children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
