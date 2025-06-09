// src/utils/filterHelpers.ts
import { Person } from "../types";

/**
 * Returns true if the person matches the search query (case‐insensitive)
 * Checks name, position, and description fields.
 */
export function matchesSearch(person: Person, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fields = [
    person.name,
    person.position ?? "",
    person.description ?? "",
  ];

  return fields.some((f) => f.toLowerCase().includes(q));
}

/**
 * Returns true if the person has _all_ of the activeTagIds
 */
export function matchesTagsAND(
  person: Person,
  activeTagIds: string[]
): boolean {
  if (activeTagIds.length === 0) return true;
  return activeTagIds.every((tagId) =>
    (person.tags ?? []).includes(tagId)
  );
}
