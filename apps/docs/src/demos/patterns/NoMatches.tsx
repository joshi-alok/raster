import { Button, EmptyState, SearchField, Stack } from "@rasterdesign/react";
import { useState } from "react";

export const PROJECTS = [
  "Museum wayfinding",
  "Annual report",
  "Type specimen",
  "Station signage",
  "Exhibition graphics",
];

/** Project names containing the query, ignoring case and spaces at the ends. */
export function matching(query: string): string[] {
  const q = query.trim().toLowerCase();
  return PROJECTS.filter((name) => name.toLowerCase().includes(q));
}

export default function NoMatches() {
  const [query, setQuery] = useState("Zeppelin");
  const results = matching(query);
  const count =
    results.length === 0
      ? `No projects match "${query.trim()}"`
      : `${results.length} ${results.length === 1 ? "project" : "projects"}`;
  return (
    <>
      <Stack gap={5}>
        <SearchField
          label="Search projects"
          value={query}
          onChange={setQuery}
        />
        {results.length > 0 ? (
          <ul>
            {results.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <EmptyState
            label="Projects"
            title={`No projects match "${query.trim()}"`}
            headingLevel={3}
            action={<Button onPress={() => setQuery("")}>Clear search</Button>}
          >
            Check the spelling, or search for part of a name.
          </EmptyState>
        )}
      </Stack>
      {/* The list and the empty state swap without a sound, so the count is announced as it changes. */}
      <p role="status" className="sw-sr-only">
        {count}
      </p>
    </>
  );
}
