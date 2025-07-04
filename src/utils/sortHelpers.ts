import { Person, Venue } from "../types";

/**
 * Keys you can sort people by
 */
export type SortKey =
  | "name"
  | "dateMet"
  | "createdAt"
  | "updatedAt"
  | "favorite";

/**
 * Keys you can sort venues by
 */
export type VenueSortKey =
  | "name"
  | "recentVisit"
  | "knownCount";

/**
 * Sorts a copy of the people array by given key and order
 */
export function sortPeople(
  people: Person[],
  sortBy: SortKey,
  asc: boolean = true
): Person[] {
  return [...people].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "dateMet":
        aValue = new Date(a.dateMet).getTime();
        bValue = new Date(b.dateMet).getTime();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "updatedAt":
        aValue = new Date(a.updatedAt ?? a.createdAt).getTime();
        bValue = new Date(b.updatedAt ?? b.createdAt).getTime();
        break;
      case "favorite":
        aValue = a.favorite ? 0 : 1;
        bValue = b.favorite ? 0 : 1;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return asc ? -1 : 1;
    if (aValue > bValue) return asc ? 1 : -1;
    return 0;
  });
}

/**
 * Helper to compute the last visit timestamp for a venue
 */
function getVenueLastVisit(venue: Venue, people: Person[]): number {
  const times = people
    .filter((p) => p.venueId === venue.id)
    .map((p) => new Date(p.updatedAt ?? p.createdAt).getTime());
  return times.length ? Math.max(...times) : 0;
}

/**
 * Sorts a copy of the venue array by given key and order
 */
export function sortVenues(
  venues: Venue[],
  people: Person[],
  sortBy: VenueSortKey,
  asc: boolean = true
): Venue[] {
  return [...venues].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "recentVisit":
        aValue = getVenueLastVisit(a, people);
        bValue = getVenueLastVisit(b, people);
        break;
      case "knownCount":
        // count how many people are associated with each venue
        aValue = people.filter((p) => p.venueId === a.id).length;
        bValue = people.filter((p) => p.venueId === b.id).length;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return asc ? -1 : 1;
    if (aValue > bValue) return asc ? 1 : -1;
    return 0;
  });
}
