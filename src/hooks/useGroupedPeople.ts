import { useMemo } from 'react';
import type { Person, Venue } from '../types';
import { UNCLASSIFIED } from '../constants';

/**
 * Groups a list of people by their venue name.
 * Falls back to UNCLASSIFIED for missing or unknown venues.
 */
export function useGroupedPeople(
  people: Person[],
  venuesById: Record<string, Venue>
): Record<string, Person[]> {
  return useMemo(() => {
    return people.reduce((groups: Record<string, Person[]>, person) => {
      const venueName = person.venueId
        ? venuesById[person.venueId]?.name ?? UNCLASSIFIED
        : UNCLASSIFIED;
      if (!groups[venueName]) {
        groups[venueName] = [];
      }
      groups[venueName].push(person);
      return groups;
    }, {});
  }, [people, venuesById]);
}
