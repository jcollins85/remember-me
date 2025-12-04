// src/utils/filterHelpers.ts
import { Person } from "../types";

function getTagNames(person: Person, tagResolver?: (id: string) => string) {
  if (!person.tags || !tagResolver) return [];
  return person.tags.map(tagResolver);
}

/**
 * Returns true if the person matches the search query (case‐insensitive)
 * Checks name, position, and description fields.
 */
export function matchesSearch(
  person: Person,
  query: string,
  tagResolver?: (id: string) => string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const fields: string[] = [
    person.name,
    person.position ?? "",
    person.description ?? "",
    ...getTagNames(person, tagResolver),
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
