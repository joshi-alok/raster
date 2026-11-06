import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { cx } from "../utils/cx";

export type PaginationItem = number | "ellipsis";

/**
 * The pages to show: the first, the last, and `siblings` pages either side of the current one.
 * A gap of one page shows that page; a longer gap becomes "ellipsis".
 */
export function paginationItems(page: number, total: number, siblings = 1): PaginationItem[] {
  if (total < 1) return [];
  const current = Math.min(Math.max(1, page), total);
  const shown = new Set<number>([1, total]);
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) shown.add(p);
  const items: PaginationItem[] = [];
  let previous = 0;
  for (const p of [...shown].sort((a, b) => a - b)) {
    if (p - previous === 2) items.push(previous + 1);
    else if (p - previous > 2) items.push("ellipsis");
    items.push(p);
    previous = p;
  }
  return items;
}

export type PaginationProps = Omit<ComponentPropsWithRef<"nav">, "children"> & {
  /** The current page, counted from 1. */
  page: number;
  /** The number of pages. */
  total: number;
  /** The URL of a page. */
  href: (page: number) => string;
  /** Pages shown either side of the current one. Defaults to 1. */
  siblings?: number;
  previousLabel?: string;
  nextLabel?: string;
};

/** Links between the pages of a list. Markup only, so the HTML route is the same markup. */
export function Pagination({
  page,
  total,
  href,
  siblings = 1,
  previousLabel = "Previous",
  nextLabel = "Next",
  className,
  "aria-label": ariaLabel = "Pagination",
  ...rest
}: PaginationProps) {
  const current = Math.min(Math.max(1, page), Math.max(total, 1));
  return (
    <nav className={cx("sw-pagination", className)} aria-label={ariaLabel} {...rest}>
      <ul className="sw-pagination-list">
        {current > 1 && (
          <li>
            <a className="sw-pagination-link sw-pagination-step" href={href(current - 1)} rel="prev">
              <ArrowLeft aria-hidden="true" />
              {previousLabel}
            </a>
          </li>
        )}
        {paginationItems(current, total, siblings).map((item, i) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${i}`}>
              <span className="sw-pagination-ellipsis" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              <a
                className="sw-pagination-link"
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
              >
                {item}
              </a>
            </li>
          ),
        )}
        {current < total && (
          <li>
            <a className="sw-pagination-link sw-pagination-step" href={href(current + 1)} rel="next">
              {nextLabel}
              <ArrowRight aria-hidden="true" />
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
