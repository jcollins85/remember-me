import { describe, it, expect } from "vitest";
import type { Person, Venue } from "../../src/types";
import { groupPeopleByVenue } from "../../src/hooks/useGroupedPeople";
import { UNCLASSIFIED } from "../../src/constants";

describe("groupPeopleByVenue", () => {
  it("groups people by venue name and falls back to Unclassified", () => {
    const venuesById: Record<string, Venue> = {
      v1: { id: "v1", name: "Cafe" } as Venue,
    };
    const people: Person[] = [
      { id: "p1", name: "Alex", venueId: "v1" } as Person,
      { id: "p2", name: "Sam" } as Person,
      { id: "p3", name: "Riley", venueId: "missing" } as Person,
    ];

    const result = groupPeopleByVenue(people, venuesById);

    expect(Object.keys(result)).toEqual(["Cafe", UNCLASSIFIED]);
    expect(result["Cafe"]).toHaveLength(1);
    expect(result["Cafe"][0].id).toBe("p1");
    expect(result[UNCLASSIFIED]).toHaveLength(2);
    expect(result[UNCLASSIFIED].map((p) => p.id)).toEqual(["p2", "p3"]);
  });

  it("returns an empty object for no people", () => {
    const result = groupPeopleByVenue([], {});
    expect(result).toEqual({});
  });

  it("preserves person order within a venue group", () => {
    const venuesById: Record<string, Venue> = {
      v1: { id: "v1", name: "Cafe" } as Venue,
    };
    const people: Person[] = [
      { id: "p1", name: "Alex", venueId: "v1" } as Person,
      { id: "p2", name: "Sam", venueId: "v1" } as Person,
      { id: "p3", name: "Riley", venueId: "v1" } as Person,
    ];

    const result = groupPeopleByVenue(people, venuesById);
    expect(result["Cafe"].map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });
});
