import { SideNav, SideNavGroup, SideNavLink } from "@rasterdesign/react";

export default function Docs() {
  return (
    <SideNav aria-label="Example section">
      <SideNavLink href="/">Principles</SideNavLink>
      <SideNavGroup title="Foundations">
        <SideNavLink href="/foundations/grid/">Grid</SideNavLink>
        <SideNavLink href="/foundations/type/" current>
          Type
        </SideNavLink>
        <SideNavLink href="/foundations/colour/">Colour</SideNavLink>
      </SideNavGroup>
      <SideNavGroup title="Components" defaultExpanded={false}>
        <SideNavLink href="/components/">All components</SideNavLink>
      </SideNavGroup>
    </SideNav>
  );
}
