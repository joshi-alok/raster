export const GROUPS = ["Layout", "Type", "Actions", "Forms", "Display", "Overlay and navigation"] as const;
export type Group = (typeof GROUPS)[number];

type Entry = { id: string; data: { title: string; group: string; order: number } };

const groupIndex = (group: string) => {
  const i = (GROUPS as readonly string[]).indexOf(group);
  return i === -1 ? GROUPS.length : i;
};

/** By group (in GROUPS order), then by order, then by title. */
export function sortComponents<T extends Entry>(entries: readonly T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      groupIndex(a.data.group) - groupIndex(b.data.group) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title),
  );
}

export function groupComponents<T extends Entry>(entries: readonly T[]): { group: Group; entries: T[] }[] {
  const sorted = sortComponents(entries);
  return GROUPS.map((group) => ({ group, entries: sorted.filter((e) => e.data.group === group) })).filter(
    (g) => g.entries.length > 0,
  );
}

export function neighbours<T extends Entry>(sorted: readonly T[], id: string): { previous?: T; next?: T } {
  const i = sorted.findIndex((e) => e.id === id);
  return { previous: i > 0 ? sorted[i - 1] : undefined, next: i >= 0 ? sorted[i + 1] : undefined };
}

export const componentHref = (id: string) => `/components/${id}/`;
