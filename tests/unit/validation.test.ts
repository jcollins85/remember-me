import { describe, it, expect } from "vitest";
import { validatePersonForm } from "../../src/utils/validation";

const basePayload = {
  name: "Alex",
  dateMet: "2024-01-01",
  venue: "Cafe",
  tags: [],
};

describe("validatePersonForm", () => {
  it("rejects missing name", () => {
    const result = validatePersonForm({ ...basePayload, name: " " });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe("Name is required");
  });

  it("rejects overly long names", () => {
    const name = "a".repeat(61);
    const result = validatePersonForm({ ...basePayload, name });
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe("Name must be 60 characters or fewer");
  });

  it("rejects future dateMet", () => {
    const future = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const result = validatePersonForm({ ...basePayload, dateMet: future });
    expect(result.isValid).toBe(false);
    expect(result.errors.dateMet).toBe("Date Met cannot be in the future");
  });

  it("rejects too many tags", () => {
    const tags = Array.from({ length: 16 }, (_, i) => `tag-${i}`);
    const result = validatePersonForm({ ...basePayload, tags });
    expect(result.isValid).toBe(false);
    expect(result.errors.tags).toBe("Maximum of 15 tags allowed");
  });

  it("rejects overly long description", () => {
    const description = "a".repeat(501);
    const result = validatePersonForm({ ...basePayload, description });
    expect(result.isValid).toBe(false);
    expect(result.errors.description).toBe("Description must be 500 characters or fewer");
  });

  it("rejects invalid coordinates", () => {
    const result = validatePersonForm({
      ...basePayload,
      latitude: "200",
      longitude: "10",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.coords).toBe(
      "Enter valid latitude (-90 to 90) and longitude (-180 to 180)"
    );
  });

  it("rejects overly long venue names", () => {
    const venue = "a".repeat(51);
    const result = validatePersonForm({ ...basePayload, venue });
    expect(result.isValid).toBe(false);
    expect(result.errors.venue).toBe("Venue name must be 50 characters or fewer");
  });

  it("rejects overly long position values", () => {
    const position = "a".repeat(61);
    const result = validatePersonForm({ ...basePayload, position });
    expect(result.isValid).toBe(false);
    expect(result.errors.position).toBe("Position must be 60 characters or fewer");
  });
});
