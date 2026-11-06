import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { Dialog as AriaDialog, DialogTrigger, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "../actions/Button";
import { cx } from "../utils/cx";

export type HeaderProps = Omit<ComponentPropsWithRef<"header">, "children"> & {
  /** Logo or site name, usually a link home. */
  brand: ReactNode;
  /** Navigation links (Link components; mark the current page with aria-current="page"). */
  children?: ReactNode;
  /** Controls at the inline end, such as a theme switch. */
  actions?: ReactNode;
  /** Name of the navigation landmark. Defaults to "Main". */
  navLabel?: string;
  /** Target of the skip link. Defaults to "#main"; give the main element that id and tabIndex={-1}. */
  skipTo?: string;
  /** Stick to the top of the viewport. Defaults to true. */
  sticky?: boolean;
  /** Below 600px of header width, move the links into a full-screen menu. Defaults to true. */
  compact?: boolean;
  /** Text of the menu button and name of the menu dialog. Defaults to "Menu". */
  menuLabel?: string;
};

/** The site banner: skip link, brand, primary navigation and actions; compact on narrow screens. */
export function Header({
  brand,
  children,
  actions,
  navLabel = "Main",
  skipTo = "#main",
  sticky = true,
  compact = true,
  menuLabel = "Menu",
  className,
  ...rest
}: HeaderProps) {
  const hasMenu = compact && children != null;
  return (
    <header
      className={cx("sw-header", className)}
      data-sticky={sticky ? "" : undefined}
      data-compact={hasMenu ? "" : undefined}
      {...rest}
    >
      <a className="sw-skip-link" href={skipTo}>
        Skip to content
      </a>
      <div className="sw-header-inner">
        <div className="sw-header-brand">{brand}</div>
        {children != null && (
          <nav className="sw-header-nav" aria-label={navLabel}>
            {children}
          </nav>
        )}
        {actions != null && <div className="sw-header-actions">{actions}</div>}
        {hasMenu && (
          <DialogTrigger>
            <Button variant="ghost" className="sw-header-menu-button">
              {menuLabel}
            </Button>
            <ModalOverlay className="sw-header-menu-overlay" isDismissable>
              <Modal className="sw-header-menu">
                <AriaDialog className="sw-header-menu-dialog" aria-label={menuLabel}>
                  {({ close }) => (
                    <>
                      <div className="sw-header-menu-bar">
                        <span className="sw-type-label sw-text-secondary">{menuLabel}</span>
                        <Button variant="ghost" onPress={close}>
                          Close
                        </Button>
                      </div>
                      <nav
                        className="sw-header-menu-nav"
                        aria-label={navLabel}
                        // Capture phase: React Aria's Link stops the click from bubbling past itself.
                        onClickCapture={(event: MouseEvent<HTMLElement>) => {
                          if ((event.target as Element).closest("a")) close();
                        }}
                      >
                        {children}
                      </nav>
                    </>
                  )}
                </AriaDialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>
        )}
      </div>
    </header>
  );
}
