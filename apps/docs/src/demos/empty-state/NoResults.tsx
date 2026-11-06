import { EmptyState, Link } from "@raster/react";

export default function NoResults() {
  return (
    <EmptyState
      label="Projects"
      title="No projects match these filters"
      headingLevel={3}
      action={<Link href="/components/empty-state/">Clear filters</Link>}
    >
      Try fewer disciplines, or include every year.
    </EmptyState>
  );
}
