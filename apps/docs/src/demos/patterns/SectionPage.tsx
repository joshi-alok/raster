import { Breadcrumb, Breadcrumbs, Heading, Pagination, SideNav, SideNavGroup, SideNavLink, Stack, Text } from "@rasterdesign/react";

export default function SectionPage() {
  return (
    <Stack gap={5}>
      <Breadcrumbs aria-label="Example breadcrumbs">
        <Breadcrumb href="#studio">Studio</Breadcrumb>
        <Breadcrumb href="#projects">Projects</Breadcrumb>
        <Breadcrumb>Wayfinding</Breadcrumb>
      </Breadcrumbs>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))",
          gap: "var(--space-6)",
        }}
      >
        <SideNav aria-label="Projects">
          <SideNavLink href="#all">All projects</SideNavLink>
          <SideNavGroup title="Disciplines">
            <SideNavLink href="#wayfinding" current>
              Wayfinding
            </SideNavLink>
            <SideNavLink href="#identity">Identity</SideNavLink>
            <SideNavLink href="#exhibition">Exhibition</SideNavLink>
          </SideNavGroup>
        </SideNav>
        <Stack gap={4}>
          <Heading level={3}>Wayfinding</Heading>
          <Text>Signs, maps and directories for stations, museums and hospitals.</Text>
          <Pagination aria-label="Wayfinding projects" page={2} total={4} href={(page) => `#page-${page}`} />
        </Stack>
      </div>
    </Stack>
  );
}
