import { Breadcrumb, Breadcrumbs } from "@raster/react";

export default function Basic() {
  return (
    <Breadcrumbs aria-label="Example breadcrumbs">
      <Breadcrumb href="/">Home</Breadcrumb>
      <Breadcrumb href="/components/">Components</Breadcrumb>
      <Breadcrumb>Breadcrumbs</Breadcrumb>
    </Breadcrumbs>
  );
}
