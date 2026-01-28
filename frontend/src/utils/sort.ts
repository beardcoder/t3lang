export type SortMode = 'manual' | 'key-asc' | 'source-asc';

export function sortUnits<T extends { id: string; source: string }>(units: T[], mode: SortMode): T[] {
  if (mode === 'manual') return [...units];

  const next = [...units];

  if (mode === 'key-asc') {
    next.sort((a, b) => a.id.localeCompare(b.id));
  }

  if (mode === 'source-asc') {
    next.sort((a, b) => a.source.localeCompare(b.source));
  }

  return next;
}
