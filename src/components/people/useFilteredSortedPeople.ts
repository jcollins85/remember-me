// src/components/people/useFilteredSortedPeople.ts
import { useMemo } from 'react';
import { useVenues } from '../../context/VenueContext';
import { Person } from '../../types';
import { matchesSearch, matchesTagsAND } from '../../utils/filterHelpers';
import { useTags } from '../../context/TagContext';
import { sortPeople, SortKey } from '../../utils/sortHelpers';

/**
 * Filters and sorts the people array based on search (including venue names),
 * active tags, and sort settings.
 */
export function useFilteredSortedPeople(
  people: Person[],
  searchQuery: string,
  activeTagIds: string[],
  sortBy: SortKey,
  sortAsc: boolean = true
): Person[] {
  const { venues } = useVenues();
  const { getTagNameById } = useTags();
  const venuesById = useMemo(
    () =>
      Object.fromEntries(venues.map((v) => [v.id, v.name])) as Record<string, string>,
    [venues]
  );

  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = people;

    // 1. Filter by search query (person fields OR venue name)
    if (query) {
      filtered = filtered.filter((person) => {
        const personMatches = matchesSearch(person, searchQuery, getTagNameById);
        const venueName = person.venueId ? venuesById[person.venueId]?.toLowerCase() : '';
        const venueMatches = venueName.includes(query);
        return personMatches || venueMatches;
      });
    }

    // 2. Filter by active tags (AND logic)
    filtered = filtered.filter((person) => matchesTagsAND(person, activeTagIds));

    // 3. Sort the resulting list
    return sortPeople(filtered, sortBy, sortAsc);
  }, [people, searchQuery, activeTagIds, sortBy, sortAsc, venuesById]);
}
