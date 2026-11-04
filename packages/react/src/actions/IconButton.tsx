import type { ReactElement } from "react";
import { cx } from "../utils/cx";
import { Button, type ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "children" | "aria-label"> & {
  /** Accessible name; required because the button has no visible text. */
  label: string;
  /** A single icon, e.g. a lucide-react icon (which is aria-hidden by default). */
  children: ReactElement;
};

export function IconButton({ label, children, className, ...rest }: IconButtonProps) {
  return (
    <Button aria-label={label} className={cx("sw-icon-button", className)} {...rest}>
      {children}
    </Button>
  );
}
