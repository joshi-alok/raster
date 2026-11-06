import { type ReactNode, useId } from "react";
import { type Key, ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { cx } from "../utils/cx";

export type SegmentedControlProps = {
  label: ReactNode;
  /** Segment elements. */
  children: ReactNode;
  selectedKey?: Key;
  defaultSelectedKey?: Key;
  onSelectionChange?: (key: Key) => void;
  isDisabled?: boolean;
  className?: string;
};

/**
 * One choice from two to five options, shown as a joined row. There is always exactly one selection.
 * Native twin: a role="radiogroup" of <label class="sw-segment"> elements holding radio inputs.
 */
export function SegmentedControl({
  label,
  children,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  isDisabled,
  className,
}: SegmentedControlProps) {
  const labelId = useId();
  return (
    <div className={cx("sw-field sw-segmented", className)}>
      <span className="sw-field-label" id={labelId}>
        {label}
      </span>
      <ToggleButtonGroup
        className="sw-segmented-list"
        aria-labelledby={labelId}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={selectedKey === undefined ? undefined : [selectedKey]}
        defaultSelectedKeys={defaultSelectedKey === undefined ? undefined : [defaultSelectedKey]}
        onSelectionChange={(keys) => {
          const [key] = [...keys];
          if (key !== undefined) onSelectionChange?.(key);
        }}
        isDisabled={isDisabled}
      >
        {children}
      </ToggleButtonGroup>
    </div>
  );
}

export type SegmentProps = {
  id: Key;
  children: ReactNode;
  isDisabled?: boolean;
  className?: string;
};

export function Segment({ id, children, isDisabled, className }: SegmentProps) {
  return (
    <ToggleButton id={id} isDisabled={isDisabled} className={cx("sw-segment", className)}>
      {children}
    </ToggleButton>
  );
}
