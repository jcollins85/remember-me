// src/utils/sortHelpers.ts
import { Person } from "../types";

/**
 * Keys you can sort by
 */
export type SortKey = 
  | "name"
  | "dateMet"
  | "createdAt"
  | "updatedAt"
  | "favorite";

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
        // favorites first
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
 * Sorts an array of venue strings alphabetically
 */
export function sortVenues(
  venues: string[],
  asc: boolean = true
): string[] {
  return [...venues].sort((a, b) => {
    const aVal = a.toLowerCase();
    const bVal = b.toLowerCase();
    if (aVal < bVal) return asc ? -1 : 1;
    if (aVal > bVal) return asc ? 1 : -1;
    return 0;
  });
}