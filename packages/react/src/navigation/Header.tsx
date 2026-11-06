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
                          if (opensInPlace(event)) closeAfterClick(close);
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

/**
 * Whether a click inside the menu follows a link in this page. Modified and non-primary clicks
 * open the link elsewhere (new tab, window, download), as does a link with a target other than
 * _self; the menu stays open for those.
 */
function opensInPlace(event: MouseEvent<HTMLElement>): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const link = (event.target as Element).closest("a");
  if (!link) return false;
  const target = link.getAttribute("target");
  return !target || target === "_self";
}

/** Close once the click has finished dispatching, so the link is still in the document when it is followed. */
function closeAfterClick(close: () => void) {
  window.setTimeout(close, 0);
}
