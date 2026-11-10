import { Button, EmptyState } from "@rasterdesign/react";

export default function FirstUse() {
  return (
    <EmptyState
      label="Projects"
      title="No projects yet"
      headingLevel={3}
      action={<Button variant="primary">Create a project</Button>}
    >
      Projects you create or join appear here.
    </EmptyState>
  );
}
