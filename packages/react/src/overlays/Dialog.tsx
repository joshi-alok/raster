import type { ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading as AriaHeading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { cx } from "../utils/cx";

export { DialogTrigger };

export type DialogProps = {
  /** Visible title; also the dialog's accessible name. */
  title: ReactNode;
  children: ReactNode | ((opts: { close: () => void }) => ReactNode);
  /** Close on outside click (Escape always closes). Defaults to true, or false for role "alertdialog". */
  isDismissable?: boolean;
  /** Controlled open state, for opening without a DialogTrigger (e.g. from a menu item). */
  isOpen?: boolean;
  /** Initial open state when uncontrolled and used without a DialogTrigger. */
  defaultOpen?: boolean;
  /** Called when the open state changes (e.g. Escape or an outside click requests closing). */
  onOpenChange?: (isOpen: boolean) => void;
  /** "alertdialog" for interruptions that need a response. */
  role?: "dialog" | "alertdialog";
  className?: string;
};

/** A modal dialog. Place inside DialogTrigger after the trigger Button. */
export function Dialog({
  title,
  children,
  isDismissable,
  isOpen,
  defaultOpen,
  onOpenChange,
  role = "dialog",
  className,
}: DialogProps) {
  const dismissable = isDismissable ?? role !== "alertdialog";
  return (
    <ModalOverlay
      className="sw-modal-overlay"
      isDismissable={dismissable}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Modal className="sw-modal">
        <AriaDialog className={cx("sw-dialog", className)} role={role}>
          {({ close }) => (
            <>
              <AriaHeading slot="title" level={2} className="sw-type-h3">
                {title}
              </AriaHeading>
              {typeof children === "function" ? children({ close }) : children}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
