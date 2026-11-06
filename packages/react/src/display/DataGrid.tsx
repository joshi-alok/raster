import { type ReactNode, useId } from "react";
import {
  Cell,
  type CellProps,
  Column,
  type ColumnProps,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  type RowProps,
  Table,
  TableBody,
  type TableBodyProps,
  TableHeader,
  type TableHeaderProps,
  TableLayout,
  type TableProps,
  useTableOptions,
  Virtualizer,
} from "react-aria-components";
import { Checkbox } from "../forms/Checkbox";
import { cx } from "../utils/cx";

export type DataGridProps = Omit<TableProps, "className" | "children" | "aria-label" | "aria-labelledby"> & {
  /** Required. Shown above the grid in the mono label style, and names it. */
  caption: ReactNode;
  /** A CSS length. The grid scrolls inside this height and its header row sticks. */
  maxHeight?: string;
  /** Draw only the rows in view. Rows must all be rowHeight pixels tall. */
  virtualized?: { rowHeight: number; headingHeight?: number };
  className?: string;
  /** A DataGridHeader and a DataGridBody. */
  children: ReactNode;
};

/**
 * A table to sort, select from and resize, for data people work with. For static data, use Table.
 * Arrow keys move between rows and cells; Space selects a row; Enter on a header sorts.
 * Native twin: <table class="sw-table sw-data-grid"> with sort links and checkbox inputs.
 */
export function DataGrid({ caption, maxHeight, virtualized, selectionMode = "none", className, children, ...rest }: DataGridProps) {
  const captionId = useId();
  const grid = (
    <Table
      aria-labelledby={captionId}
      selectionMode={selectionMode}
      className={cx(
        "sw-table sw-data-grid",
        selectionMode !== "none" && "sw-data-grid-selectable",
        virtualized && "sw-data-grid-virtualized",
        className,
      )}
      {...rest}
    >
      {children}
    </Table>
  );
  return (
    <div className="sw-data-grid-wrap">
      <div className="sw-data-grid-caption" id={captionId}>
        {caption}
      </div>
      <ResizableTableContainer className="sw-data-grid-scroll" style={maxHeight ? { maxBlockSize: maxHeight } : undefined}>
        {virtualized ? (
          <Virtualizer
            layout={TableLayout}
            layoutOptions={{ rowHeight: virtualized.rowHeight, headingHeight: virtualized.headingHeight ?? virtualized.rowHeight }}
          >
            {grid}
          </Virtualizer>
        ) : (
          grid
        )}
      </ResizableTableContainer>
    </div>
  );
}

/** Whether the grid shows checkboxes: multiple selection with React Aria's default toggle behaviour. */
function useCheckboxes() {
  const { selectionMode, selectionBehavior } = useTableOptions();
  return selectionMode === "multiple" && selectionBehavior === "toggle";
}

export type DataGridHeaderProps = Omit<TableHeaderProps<object>, "className" | "children"> & {
  className?: string;
  /** DataGridColumn elements. */
  children: ReactNode;
};

/** The header row. Adds the Select all column when the grid allows multiple selection. */
export function DataGridHeader({ className, children, ...rest }: DataGridHeaderProps) {
  const checkboxes = useCheckboxes();
  return (
    <TableHeader className={cx("sw-data-grid-header", className)} {...rest}>
      {checkboxes && (
        <Column className="sw-data-grid-column sw-data-grid-select" width={44} minWidth={44}>
          <Checkbox slot="selection" />
        </Column>
      )}
      {children}
    </TableHeader>
  );
}

export type DataGridColumnProps = Omit<ColumnProps, "className" | "children"> & {
  children: ReactNode;
  /** End-align in tabular mono. Use the same on the column's cells. */
  numeric?: boolean;
  /** Stick to the inline start when the grid scrolls sideways. Use on one column, usually the row header. */
  sticky?: boolean;
  /** Add a resize handle at the inline end. */
  allowsResizing?: boolean;
  className?: string;
};

/** A column header: its label, the sort chevrons when sortable, and a resize handle when resizable. */
export function DataGridColumn({ children, numeric, sticky, allowsResizing, className, ...rest }: DataGridColumnProps) {
  return (
    <Column
      className={cx("sw-data-grid-column", numeric && "sw-data-grid-numeric", sticky && "sw-data-grid-sticky", className)}
      {...rest}
    >
      {({ allowsSorting, sortDirection }) => (
        <div className="sw-data-grid-head">
          <span className="sw-data-grid-label">{children}</span>
          {allowsSorting && <span className="sw-data-grid-sort-icon" data-direction={sortDirection} aria-hidden="true" />}
          {allowsResizing && <ColumnResizer className="sw-data-grid-resizer" />}
        </div>
      )}
    </Column>
  );
}

export type DataGridBodyProps<T extends object> = Omit<TableBodyProps<T>, "className" | "renderEmptyState"> & {
  /** Shown inside the grid when there are no rows; usually an EmptyState. */
  emptyState?: ReactNode;
  className?: string;
};

/** The rows: DataGridRow elements, or a render function with `items`. */
export function DataGridBody<T extends object>({ emptyState, className, ...rest }: DataGridBodyProps<T>) {
  return (
    <TableBody
      className={cx("sw-data-grid-body", className)}
      renderEmptyState={emptyState != null ? () => emptyState : undefined}
      {...rest}
    />
  );
}

export type DataGridRowProps<T extends object> = Omit<RowProps<T>, "className" | "children"> & {
  /** DataGridCell elements, one per column. */
  children: ReactNode;
  className?: string;
};

/** A row. Adds its selection checkbox when the grid allows multiple selection. */
export function DataGridRow<T extends object>({ children, className, ...rest }: DataGridRowProps<T>) {
  const checkboxes = useCheckboxes();
  return (
    <Row className={cx("sw-data-grid-row", className)} {...rest}>
      {checkboxes && (
        <Cell className="sw-data-grid-cell sw-data-grid-select">
          <Checkbox slot="selection" />
        </Cell>
      )}
      {children}
    </Row>
  );
}

export type DataGridCellProps = Omit<CellProps, "className"> & {
  numeric?: boolean;
  sticky?: boolean;
  className?: string;
};

export function DataGridCell({ numeric, sticky, className, ...rest }: DataGridCellProps) {
  return (
    <Cell
      className={cx("sw-data-grid-cell", numeric && "sw-data-grid-numeric", sticky && "sw-data-grid-sticky", className)}
      {...rest}
    />
  );
}
