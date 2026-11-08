export type NavItem = {
  href: string;
  label: string;
  /** Path prefix that also counts as current (a section link). */
  section?: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Principles" },
  { href: "/foundations/grid/", label: "Foundations", section: "/foundations/" },
  { href: "/components/", label: "Components", section: "/components/" },
  { href: "/patterns/", label: "Patterns", section: "/patterns/" },
  { href: "/templates/", label: "Templates", section: "/templates/" },
  { href: "/themes/", label: "Themes" },
];

export const FOUNDATIONS: NavItem[] = [
  { href: "/foundations/grid/", label: "Grid and spacing" },
  { href: "/foundations/type/", label: "Type" },
  { href: "/foundations/colour/", label: "Colour" },
  { href: "/foundations/motion/", label: "Motion" },
];

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/** "page" when the link is the current page; "true" when it leads to the section containing it. */
export function ariaCurrent(pathname: string, item: NavItem): "page" | "true" | undefined {
  const path = withSlash(pathname);
  if (path === item.href) return "page";
  return item.section !== undefined && path.startsWith(item.section) ? "true" : undefined;
}
