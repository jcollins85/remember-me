import { describe, it, expect } from "vitest";
import { sortPeople, sortVenues } from "../../src/utils/sortHelpers";
import type { Person, Venue } from "../../src/types";

// Simple deep clone for plain data objects
const clone = <T,>(val: T): T => JSON.parse(JSON.stringify(val));

const basePeople: Person[] = [
  {
    id: "p1",
    name: "Charlie",
    dateMet: "2024-01-10T00:00:00.000Z",
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-12T00:00:00.000Z",
    venueId: "v1",
    favorite: false,
  },
  {
    id: "p2",
    name: "alice",
    dateMet: "2024-01-05T00:00:00.000Z",
    createdAt: "2024-01-05T00:00:00.000Z",
    venueId: "v2",
    favorite: true,
  },
  {
    id: "p3",
    name: "Bob",
    dateMet: "2024-01-08T00:00:00.000Z",
    createdAt: "2024-01-08T00:00:00.000Z",
    updatedAt: "2024-01-11T00:00:00.000Z",
    venueId: "v1",
    favorite: false,
  },
];

const baseVenues: Venue[] = [
  { id: "v1", name: "Cafe", favorite: false },
  { id: "v2", name: "Bakery", favorite: false },
  { id: "v3", name: "Diner", favorite: false },
];

describe("sortPeople", () => {
  it("sorts by name alphabetically (case-insensitive)", () => {
    const result = sortPeople(basePeople, "name", true);
    expect(result.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
  });

  it("sorts by favorite with favorites first when asc (and preserves relative order among non-favorites)", () => {
    const result = sortPeople(basePeople, "favorite", true);

    // Favorites-first
    expect(result[0].id).toBe("p2");

    // Stable among non-favorites: p1 then p3 in the same order as input
    const nonFavIds = result.filter((p) => !p.favorite).map((p) => p.id);
    expect(nonFavIds).toEqual(["p1", "p3"]);
  });

  it("uses updatedAt fallback to createdAt for updatedAt sorting", () => {
    const result = sortPeople(basePeople, "updatedAt", false);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3", "p2"]);
  });

  it("sorts by dateMet ascending", () => {
    const result = sortPeople(basePeople, "dateMet", true);
    expect(result.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
  });

  it("sorts by dateMet descending", () => {
    const result = sortPeople(basePeople, "dateMet", false);
    expect(result.map((p) => p.id)).toEqual(["p1", "p3", "p2"]);
  });

  it("preserves order when dateMet values are equal", () => {
    const people: Person[] = [
      {
        id: "p1",
        name: "Alpha",
        dateMet: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "p2",
        name: "Beta",
        dateMet: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-02T00:00:00.000Z",
      },
    ];

    const result = sortPeople(people, "dateMet", true);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("returns an empty list when given empty input", () => {
    expect(sortPeople([], "name", true)).toEqual([]);
  });

  it("preserves input order for equal keys (stable sort)", () => {
    const people: Person[] = [
      {
        id: "p1",
        name: "Same",
        dateMet: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "p2",
        name: "Same",
        dateMet: "2024-01-02T00:00:00.000Z",
        createdAt: "2024-01-02T00:00:00.000Z",
      },
    ];

    const result = sortPeople(people, "name", true);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("does not mutate the input array", () => {
    const input = clone(basePeople);
    const snapshot = clone(input);

    sortPeople(input, "name", true);

    // Input array (and objects) should remain unchanged
    expect(input).toEqual(snapshot);
  });
});

describe("sortVenues", () => {
  it("sorts venues by name alphabetically", () => {
    const result = sortVenues(baseVenues, basePeople, "name", true);
    expect(result.map((v) => v.id)).toEqual(["v2", "v1", "v3"]);
  });

  it("sorts by knownCount", () => {
    const result = sortVenues(baseVenues, basePeople, "knownCount", false);
    expect(result[0].id).toBe("v1");
  });

  it("sorts by recentVisit using updatedAt fallback", () => {
    const result = sortVenues(baseVenues, basePeople, "recentVisit", false);
    expect(result[0].id).toBe("v1");
  });

  it("handles empty venue list", () => {
    expect(sortVenues([], basePeople, "name", true)).toEqual([]);
  });

  it("does not mutate the input venues array", () => {
    const venuesInput = clone(baseVenues);
    const venuesSnapshot = clone(venuesInput);

    // people is only used for computing derived sort keys; we still snapshot it for safety
    const peopleInput = clone(basePeople);
    const peopleSnapshot = clone(peopleInput);

    sortVenues(venuesInput, peopleInput, "name", true);

    expect(venuesInput).toEqual(venuesSnapshot);
    expect(peopleInput).toEqual(peopleSnapshot);
  });
});
