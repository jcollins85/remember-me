import { describe, it, expect } from "vitest";
import type { Person } from "../../src/types";
import { togglePersonFavorite, toggleVenueFavoriteName } from "../../src/utils/favorites";

describe("togglePersonFavorite", () => {
  it("toggles favorite from false to true", () => {
    const person: Person = {
      id: "p1",
      name: "Alex",
      dateMet: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
      favorite: false,
    };
    const result = togglePersonFavorite(person);
    expect(result.favorite).toBe(true);
    expect(person.favorite).toBe(false);
  });

  it("toggles favorite from true to false", () => {
    const person: Person = {
      id: "p2",
      name: "Sam",
      dateMet: "2024-01-02T00:00:00.000Z",
      createdAt: "2024-01-02T00:00:00.000Z",
      favorite: true,
    };
    const result = togglePersonFavorite(person);
    expect(result.favorite).toBe(false);
    expect(person.favorite).toBe(true);
  });
});

describe("toggleVenueFavoriteName", () => {
  it("adds a venue if it does not exist", () => {
    const result = toggleVenueFavoriteName(["Cafe"], "Diner");
    expect(result).toEqual(["Cafe", "Diner"]);
  });

  it("removes a venue if it exists", () => {
    const result = toggleVenueFavoriteName(["Cafe", "Diner"], "Cafe");
    expect(result).toEqual(["Diner"]);
  });

  it("handles empty input list", () => {
    const result = toggleVenueFavoriteName([], "Cafe");
    expect(result).toEqual(["Cafe"]);
  });

  it("does not mutate the input array", () => {
    const input = ["Cafe", "Diner"];
    const result = toggleVenueFavoriteName(input, "Cafe");
    expect(result).toEqual(["Diner"]);
    expect(input).toEqual(["Cafe", "Diner"]);
  });
});
