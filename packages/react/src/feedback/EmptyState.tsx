import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type EmptyStateProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  /** A short mono label for the area, such as "Projects". */
  label?: ReactNode;
  title: ReactNode;
  /** Defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** One sentence: what happened and what to do. */
  children?: ReactNode;
  /** One action, such as a button or link. */
  action?: ReactNode;
};

/** What to show when there is nothing to show. Keep it to one sentence and one action. */
export function EmptyState({ label, title, headingLevel = 2, children, action, className, ...rest }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as "h2";
  return (
    <div className={cx("sw-empty", className)} {...rest}>
      {label != null && <p className="sw-empty-label">{label}</p>}
      <Heading className="sw-empty-title sw-type-h3">{title}</Heading>
      {children != null && <p className="sw-empty-text">{children}</p>}
      {action != null && <div className="sw-empty-actions">{action}</div>}
    </div>
  );
}
