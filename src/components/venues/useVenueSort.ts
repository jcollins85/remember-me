// src/components/venues/useVenueSort.ts
import { useMemo } from 'react';

/**
 * Sort venue names based on favorites and alphabetical order.
 * @param venueNames Array of venue keys
 * @param favoriteVenues Array of favorite venue names
 * @param direction 'asc' or 'desc'
 */
export function useVenueSort(
  venueNames: string[],
  favoriteVenues: string[],
  direction: 'asc' | 'desc' = 'asc'
): string[] {
  return useMemo(() => {
    return [...venueNames].sort((a, b) => {
      // favorites first
      const aFav = favoriteVenues.includes(a) ? 0 : 1;
      const bFav = favoriteVenues.includes(b) ? 0 : 1;
      if (aFav !== bFav) {
        return aFav - bFav;
      }
      // then alphabetical
      return direction === 'asc'
        ? a.localeCompare(b)
        : b.localeCompare(a);
    });
  }, [venueNames, favoriteVenues, direction]);
}
