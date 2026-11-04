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
  /** Close on outside click (Escape always closes). Defaults to true. */
  isDismissable?: boolean;
  /** "alertdialog" for interruptions that need a response. */
  role?: "dialog" | "alertdialog";
  className?: string;
};

/** A modal dialog. Place inside DialogTrigger after the trigger Button. */
export function Dialog({ title, children, isDismissable = true, role = "dialog", className }: DialogProps) {
  return (
    <ModalOverlay className="sw-modal-overlay" isDismissable={isDismissable}>
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
