import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading as AriaHeading,
  type Key,
} from "react-aria-components";
import { cx } from "../utils/cx";

export type DisclosureProps = {
  /** The row's label; also the trigger button's accessible name. */
  title: ReactNode;
  children: ReactNode;
  /** Key within an Accordion. */
  id?: Key;
  /** Level of the heading that wraps the trigger. Defaults to 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  isDisabled?: boolean;
  className?: string;
};

/** A row that shows or hides its panel. Native twin: <details class="sw-disclosure">. */
export function Disclosure({ title, children, headingLevel = 3, className, ...rest }: DisclosureProps) {
  return (
    <AriaDisclosure className={cx("sw-disclosure", className)} {...rest}>
      <AriaHeading level={headingLevel} className="sw-disclosure-heading">
        <AriaButton slot="trigger" className="sw-disclosure-trigger">
          <span className="sw-disclosure-title">{title}</span>
          <span className="sw-disclosure-icon" aria-hidden="true" />
        </AriaButton>
      </AriaHeading>
      <DisclosurePanel className="sw-disclosure-panel">{children}</DisclosurePanel>
    </AriaDisclosure>
  );
}

export type AccordionProps = {
  children: ReactNode;
  /** Let several rows stay open. Defaults to false: opening one closes the others. */
  allowsMultipleExpanded?: boolean;
  defaultExpandedKeys?: Iterable<Key>;
  className?: string;
};

/** A group of Disclosures. Native twin: <details> elements sharing a name attribute. */
export function Accordion({ className, ...rest }: AccordionProps) {
  return <DisclosureGroup className={cx("sw-accordion", className)} {...rest} />;
}
