import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "../utils/cx";

export type DescriptionListProps = ComponentPropsWithRef<"dl"> & {
  /** DescriptionItem elements. */
  children: ReactNode;
};

/** Facts as a grid of term and value pairs, such as a project's client, scope and team. */
export function DescriptionList({ className, ...rest }: DescriptionListProps) {
  return <dl className={cx("sw-dl", className)} {...rest} />;
}

export type DescriptionItemProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  term: ReactNode;
  children: ReactNode;
};

export function DescriptionItem({ term, children, className, ...rest }: DescriptionItemProps) {
  return (
    <div className={cx("sw-dl-item", className)} {...rest}>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
