import { type ComponentPropsWithRef, type ReactNode, useId } from "react";
import { cx } from "../utils/cx";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Required: names the table and its scroll region. */
  caption: ReactNode;
  striped?: boolean;
};

export function Table({ caption, striped, className, children, ...rest }: TableProps) {
  const captionId = useId();
  return (
    <div className="sw-table-wrap" role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className={cx("sw-table", className)} data-striped={striped ? "" : undefined} {...rest}>
        <caption id={captionId}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
