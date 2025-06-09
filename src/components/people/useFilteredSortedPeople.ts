// src/components/people/useFilteredSortedPeople.ts
import { useMemo } from 'react';
import { Person } from '../../types';
import { matchesSearch, matchesTagsAND } from '../../utils/filterHelpers';
import { sortPeople, SortKey } from '../../utils/sortHelpers';

/**
 * Filters and sorts the people array based on search, tags, and sort settings.
 */
export function useFilteredSortedPeople(
  people: Person[],
  searchQuery: string,
  activeTagIds: string[],
  sortBy: SortKey,
  sortAsc: boolean = true
): Person[] {
  return useMemo(() => {
    // 1. Filter by search text
    let filtered = people.filter((p) => matchesSearch(p, searchQuery));

    // 2. Filter by tags (AND logic)
    filtered = filtered.filter((p) => matchesTagsAND(p, activeTagIds));

    // 3. Sort the resulting list
    return sortPeople(filtered, sortBy, sortAsc);
  }, [people, searchQuery, activeTagIds, sortBy, sortAsc]);
}
