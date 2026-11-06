import type { ReactNode } from "react";
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  type TagGroupProps as AriaTagGroupProps,
  type Key,
  TagList,
} from "react-aria-components";
import { cx } from "../utils/cx";
import { FieldDescription, FieldLabel } from "./FieldParts";

export type TagGroupProps = Omit<AriaTagGroupProps, "className" | "children" | "selectionMode"> & {
  label: ReactNode;
  description?: ReactNode;
  /** "multiple" (the default) for filters; "single" for one choice among several. */
  selectionMode?: "single" | "multiple";
  className?: string;
  /** Chip elements. */
  children: ReactNode;
};

/**
 * A labelled set of selectable chips, for filters. Arrow keys move between chips; Space toggles.
 * Native twin: a role="group" of <label class="sw-chip"> elements holding checkbox or radio inputs.
 */
export function TagGroup({ label, description, selectionMode = "multiple", className, children, ...rest }: TagGroupProps) {
  return (
    <AriaTagGroup className={cx("sw-field sw-chip-group", className)} selectionMode={selectionMode} {...rest}>
      <FieldLabel>{label}</FieldLabel>
      <TagList className="sw-chip-list">{children}</TagList>
      {description != null && <FieldDescription>{description}</FieldDescription>}
    </AriaTagGroup>
  );
}

export type ChipProps = {
  id: Key;
  /** The chip's text; also its accessible name. */
  children: string;
  isDisabled?: boolean;
  className?: string;
};

export function Chip({ id, children, isDisabled, className }: ChipProps) {
  return (
    <AriaTag id={id} textValue={children} isDisabled={isDisabled} className={cx("sw-chip", className)}>
      <span className="sw-chip-check" aria-hidden="true" />
      {children}
    </AriaTag>
  );
}
