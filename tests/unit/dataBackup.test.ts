import { describe, expect, it } from "vitest";
import { parseBackup, parseCsvPeople } from "../../src/hooks/useDataBackup";

const buildVenue = (index: number) => ({
  id: `venue-${index}`,
  name: `Venue ${index}`,
  favorite: false,
});

describe("parseBackup", () => {
  it("throws when backup includes too many venues", () => {
    const venues = Array.from({ length: 501 }, (_, index) => buildVenue(index + 1));
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues,
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Backup has too many venues (max 500)."
    );
  });

  it("throws when a venue is missing a name", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [{ id: "venue-1", favorite: false }],
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Venue entry #1 is missing a name."
    );
  });

  it("throws when backup includes too many people", () => {
    const people = Array.from({ length: 2001 }, () => ({}));
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people,
      venues: [],
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Backup has too many people (max 2000)."
    );
  });

  it("throws when backup includes too many tags", () => {
    const tags = Array.from({ length: 501 }, () => ({}));
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [],
      tags,
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Backup has too many tags (max 500)."
    );
  });

  it("throws on invalid JSON", () => {
    expect(() => parseBackup("{not-json}")).toThrow(
      "The selected file is not valid JSON."
    );
  });

  it("throws when backup is from a newer app version", () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [],
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "This backup was created by a newer app version."
    );
  });

  it("throws when people data is missing", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      venues: [],
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "People data missing or malformed."
    );
  });

  it("throws when a person is missing a name", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [{ id: "person-1" }],
      venues: [],
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Person entry #1 is missing a name."
    );
  });

  it("throws when a tag is missing a name", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [],
      tags: [{ id: "tag-1" }],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Tag entry #1 is missing a name."
    );
  });

  it("throws when venue data is missing or malformed", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: "not-an-array",
      tags: [],
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Venue data missing or malformed."
    );
  });

  it("throws when tag data is missing or malformed", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [],
      tags: "not-an-array",
      favoriteVenues: [],
    };

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      "Tag data missing or malformed."
    );
  });

  it("drops favorite venues that are not present in the backup", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [
        { id: "venue-1", name: "Cafe", favorite: false },
        { id: "venue-2", name: "Diner", favorite: false },
      ],
      tags: [],
      favoriteVenues: ["Cafe", "Missing", "Diner", "Cafe"],
    };

    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed.favoriteVenues).toEqual(["Cafe", "Diner"]);
  });

  it("truncates long venue names to the max length", () => {
    const longName = "a".repeat(600);
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [],
      venues: [{ id: "venue-1", name: longName, favorite: false }],
      tags: [],
      favoriteVenues: [],
    };

    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed.venues[0].name.length).toBe(512);
  });

  it("truncates long person fields to the max length", () => {
    const longText = "b".repeat(700);
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [
        {
          id: "person-1",
          name: "Alex",
          dateMet: "2024-01-01T00:00:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
          position: longText,
          description: longText,
        },
      ],
      venues: [],
      tags: [],
      favoriteVenues: [],
    };

    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed.people[0].position?.length).toBe(512);
    expect(parsed.people[0].description?.length).toBe(512);
  });

  it("drops person venueId when it is not in the venues list", () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      people: [
        {
          id: "person-1",
          name: "Alex",
          dateMet: "2024-01-01T00:00:00.000Z",
          createdAt: "2024-01-01T00:00:00.000Z",
          venueId: "missing",
        },
      ],
      venues: [{ id: "venue-1", name: "Cafe", favorite: false }],
      tags: [],
      favoriteVenues: [],
    };

    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed.people[0].venueId).toBeUndefined();
  });
});

describe("parseCsvPeople", () => {
  it("throws when required CSV headers are missing", () => {
    const csv = [
      "# MetHere CSV v1",
      `# exportedAt=${new Date().toISOString()}`,
      "id,name,position",
      "1,Alice,Designer",
    ].join("\n");

    expect(() => parseCsvPeople(csv)).toThrow(
      "CSV must include at least 'name' and 'dateMet' columns."
    );
  });

  it("throws when CSV exceeds max people limit", () => {
    const header = ["id", "name", "dateMet"].join(",");
    const rows = Array.from({ length: 2001 }, (_, index) =>
      `${index + 1},Person ${index + 1},2024-01-01`
    );
    const csv = [header, ...rows].join("\n");

    expect(() => parseCsvPeople(csv)).toThrow(
      "CSV has too many people (max 2000)."
    );
  });

  it("skips rows with missing required fields and reports errors", () => {
    const header = ["id", "name", "dateMet"].join(",");
    const rows = [
      "1,Alice,2024-01-01",
      "2,,2024-01-01",
      "3,Bob,",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.people).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.skipped).toBe(2);
  });

  it("normalizes duplicate venue names into one venue record", () => {
    const header = ["id", "name", "dateMet", "venueName"].join(",");
    const rows = [
      "1,Alice,2024-01-01,Cafe",
      "2,Bob,2024-01-02,cafe",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.venues).toHaveLength(1);
    expect(result.venues[0].name).toBe("Cafe");
  });

  it("creates tags from CSV tags column", () => {
    const header = ["id", "name", "dateMet", "tags"].join(",");
    const rows = [
      "1,Alice,2024-01-01,\"friend, runner\"",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.tags.map((tag) => tag.name).sort()).toEqual(["friend", "runner"]);
    expect(result.people[0].tags?.length).toBe(2);
  });

  it("skips rows with invalid dateMet values", () => {
    const header = ["id", "name", "dateMet"].join(",");
    const rows = [
      "1,Alice,not-a-date",
      "2,Bob,2024-01-01",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.people).toHaveLength(1);
    expect(result.skipped).toBe(1);
    expect(result.errors[0]?.reason).toBe("Invalid dateMet.");
  });

  it("records a warning when CSV IDs are duplicated", () => {
    const header = ["id", "name", "dateMet"].join(",");
    const rows = [
      "same-id,Alice,2024-01-01",
      "same-id,Bob,2024-01-02",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.people).toHaveLength(2);
    expect(result.errors.some((err) => err.reason.includes("Duplicate id"))).toBe(true);
  });

  it("generates a new id when CSV IDs are duplicated", () => {
    const header = ["id", "name", "dateMet"].join(",");
    const rows = [
      "same-id,Alice,2024-01-01",
      "same-id,Bob,2024-01-02",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    const ids = result.people.map((person) => person.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe("same-id");
    expect(ids[1]).not.toBe("same-id");
  });

  it("throws when CSV creates too many venues", () => {
    const header = ["id", "name", "dateMet", "venueName"].join(",");
    const rows = Array.from({ length: 501 }, (_, index) =>
      `${index + 1},Person ${index + 1},2024-01-01,Venue ${index + 1}`
    );
    const csv = [header, ...rows].join("\n");

    expect(() => parseCsvPeople(csv)).toThrow(
      "CSV has too many venues (max 500)."
    );
  });

  it("throws when CSV creates too many tags", () => {
    const header = ["id", "name", "dateMet", "tags"].join(",");
    const tags = Array.from({ length: 501 }, (_, index) => `tag${index + 1}`).join(", ");
    const row = `1,Alice,2024-01-01,\"${tags}\"`;
    const csv = [header, row].join("\n");

    expect(() => parseCsvPeople(csv)).toThrow(
      "CSV has too many tags (max 500)."
    );
  });

  it("throws when CSV exceeds tag limit across multiple rows", () => {
    const header = ["id", "name", "dateMet", "tags"].join(",");
    const rows = Array.from({ length: 251 }, (_, index) =>
      `${index + 1},Person ${index + 1},2024-01-01,\"tag${index * 2 + 1}, tag${index * 2 + 2}\"`
    );
    const csv = [header, ...rows].join("\n");

    expect(() => parseCsvPeople(csv)).toThrow(
      "CSV has too many tags (max 500)."
    );
  });

  it("truncates long CSV fields to the max length", () => {
    const header = ["id", "name", "dateMet", "position", "description"].join(",");
    const longValue = "x".repeat(600);
    const row = `1,Alex,2024-01-01,${longValue},${longValue}`;
    const csv = [header, row].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.people[0].position?.length).toBe(512);
    expect(result.people[0].description?.length).toBe(512);
  });

  it("normalizes favorite values for CSV rows", () => {
    const header = ["id", "name", "dateMet", "favorite"].join(",");
    const rows = [
      "1,Alice,2024-01-01,true",
      "2,Bob,2024-01-02,yes",
      "3,Casey,2024-01-03,1",
      "4,Dana,2024-01-04,no",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    const favorites = result.people.map((person) => person.favorite);
    expect(favorites).toEqual([true, true, true, false]);
  });

  it("de-duplicates tags from CSV rows", () => {
    const header = ["id", "name", "dateMet", "tags"].join(",");
    const rows = [
      "1,Alice,2024-01-01,\"Friend, friend, FRIEND\"",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.tags.map((tag) => tag.name)).toEqual(["friend"]);
    expect(result.people[0].tags?.length).toBe(1);
  });

  it("trims and normalizes venue names from CSV rows", () => {
    const header = ["id", "name", "dateMet", "venueName"].join(",");
    const rows = [
      "1,Alice,2024-01-01,  Cafe  ",
      "2,Bob,2024-01-02,CAFE",
    ];
    const csv = [header, ...rows].join("\n");

    const result = parseCsvPeople(csv);
    expect(result.venues).toHaveLength(1);
    expect(result.venues[0].name).toBe("Cafe");
  });
});
