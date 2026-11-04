import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Required: names the table and its scroll region. */
  caption: ReactNode;
  striped?: boolean;
  /** Props for the scroll-region wrapper; role, label and tabIndex stay fixed. */
  wrapperProps?: Omit<ComponentPropsWithRef<"div">, "role" | "aria-labelledby" | "tabIndex">;
};

export function Table({ caption, striped, wrapperProps, className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    <div {...wrapperProps} className={cx("sw-table-wrap", wrapperProps?.className)} role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className={cx("sw-table", className)} data-striped={striped ? "" : undefined} {...rest}>
        <caption id={captionId}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
