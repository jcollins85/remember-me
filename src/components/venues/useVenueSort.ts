import { useMemo } from 'react';
import { sortVenues, VenueSortKey } from '../../utils/sortHelpers';
import { Venue, Person } from '../../types';

/**
 * Returns venues sorted by the selected key and order.
 * @param venues Array of Venue objects.
 * @param people Array of Person objects, used to compute recentVisit.
 * @param sortBy Sort key: 'name' | 'recentVisit'.
 * @param asc true for ascending order (A→Z or oldest-first), false for descending (Z→A or newest-first).
 */
export function useVenueSort(
  venues: Venue[],
  people: Person[],
  sortBy: VenueSortKey = 'recentVisit',
  asc: boolean = false
): Venue[] {
  return useMemo(
    () => sortVenues(venues, people, sortBy, asc),
    [venues, people, sortBy, asc]
  );
}
