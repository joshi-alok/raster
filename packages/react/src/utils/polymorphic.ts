import type { ComponentPropsWithRef, ElementType } from "react";

/**
 * Props for a component that renders `as` any element (default set by the component).
 * P holds the component's own props; they win over the element's props of the same name.
 */
export type PolymorphicProps<E extends ElementType, P = object> = P & {
  as?: E;
  className?: string;
} & Omit<ComponentPropsWithRef<E>, keyof P | "as" | "className">;
