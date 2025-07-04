import { useMemo } from 'react';

/**
 * Splits a list of names into favorites and others based on a favorites list.
 * @param allNames List of all item names (e.g., venue names).
 * @param favoriteNames List of names marked as favorites.
 * @returns An object with `favorites` and `others` arrays.
 */
export function useFavoriteSections(
  allNames: string[],
  favoriteNames: string[]
): {
  favorites: string[];
  others: string[];
} {
  return useMemo(
    () => ({
      favorites: allNames.filter((name) => favoriteNames.includes(name)),
      others:    allNames.filter((name) => !favoriteNames.includes(name)),
    }),
    [allNames, favoriteNames]
  );
}
