import { useMemo } from "react";
import type { Person, Venue } from "../types";
import { UNCLASSIFIED } from "../constants";

/**
 * Groups a list of people by their venue id.
 * Falls back to UNCLASSIFIED for missing or unknown venues.
 */
export const groupPeopleByVenue = (
  people: Person[],
  venuesById: Record<string, Venue>
): Record<string, Person[]> => {
  return people.reduce((groups: Record<string, Person[]>, person) => {
    const venueKey =
      person.venueId && venuesById[person.venueId] ? person.venueId : UNCLASSIFIED;
    if (!groups[venueKey]) {
      groups[venueKey] = [];
    }
    groups[venueKey].push(person);
    return groups;
  }, {});
};

export function useGroupedPeople(
  people: Person[],
  venuesById: Record<string, Venue>
): Record<string, Person[]> {
  return useMemo(() => groupPeopleByVenue(people, venuesById), [people, venuesById]);
}
