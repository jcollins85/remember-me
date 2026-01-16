import type { Person } from "../types";

// Pure helpers so we can unit test favorite toggles without UI state.
export const togglePersonFavorite = (person: Person): Person => ({
  ...person,
  favorite: !person.favorite,
});

export const toggleVenueFavoriteName = (
  favorites: string[],
  venueName: string
): string[] => {
  if (favorites.includes(venueName)) {
    return favorites.filter((name) => name !== venueName);
  }
  return [...favorites, venueName];
};
