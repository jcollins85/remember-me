import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { useAnalytics } from "../context/AnalyticsContext";
import { usePeople } from "../context/PeopleContext";
import { useTags } from "../context/TagContext";
import { useVenues } from "../context/VenueContext";
import { useNotification } from "../context/NotificationContext";
import type { Person, Tag, Venue } from "../types";

const BACKUP_VERSION = 1;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_PEOPLE = 2000;
const MAX_VENUES = 500;
const MAX_TAGS = 500;
const MAX_FIELD_LENGTH = 512;
const CSV_VERSION = 1;
const CSV_HEADERS = [
  "id",
  "name",
  "position",
  "dateMet",
  "venueName",
  "tags",
  "favorite",
  "description",
] as const;

interface BackupFile {
  version: number;
  exportedAt: string;
  people: Person[];
  venues: Venue[];
  tags: Tag[];
  favoriteVenues: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const truncate = (value: string) =>
  value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH) : value;

const sanitizeCoords = (value: unknown) => {
  if (!isRecord(value)) return undefined;
  const { lat, lon } = value;
  return typeof lat === "number" && typeof lon === "number"
    ? { lat, lon }
    : undefined;
};

const escapeCsvValue = (value: string) => {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const parseCsvLine = (line: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsv = (text: string) => {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) {
    throw new Error("CSV file is empty.");
  }
  const headers = parseCsvLine(lines[0].line).map((header) => header.toLowerCase());
  const rows = lines.slice(1).map((item) => ({
    lineNumber: item.lineNumber,
    values: parseCsvLine(item.line),
  }));
  return { headers, rows };
};

// Enforces shape/limits on imported people so corrupt backups can't crash the UI.
function sanitizePeople(raw: unknown, venues: Venue[], tags: Tag[]): Person[] {
  if (!Array.isArray(raw)) {
    throw new Error("People data missing or malformed.");
  }
  if (raw.length > MAX_PEOPLE) {
    throw new Error(`Backup has too many people (max ${MAX_PEOPLE}).`);
  }
  const venueIds = new Set(venues.map((venue) => venue.id));
  const tagIds = new Set(tags.map((tag) => tag.id));
  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Person entry #${index + 1} is invalid.`);
    }

    const name =
      typeof item.name === "string" ? truncate(item.name.trim()) : "";
    if (!name) {
      throw new Error(`Person entry #${index + 1} is missing a name.`);
    }

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : crypto.randomUUID();

    const dateMet = isIsoDate(item.dateMet)
      ? item.dateMet
      : new Date().toISOString();
    const createdAt = isIsoDate(item.createdAt) ? item.createdAt : dateMet;
    const updatedAt = isIsoDate(item.updatedAt) ? item.updatedAt : undefined;

    const tags = Array.isArray(item.tags)
      ? item.tags
          .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
          .filter((tag) => tagIds.has(tag))
      : [];

    const venueId =
      typeof item.venueId === "string" && venueIds.has(item.venueId)
        ? item.venueId
        : undefined;

    return {
      id,
      name,
      position: typeof item.position === "string" ? truncate(item.position) : undefined,
      description: typeof item.description === "string" ? truncate(item.description) : undefined,
      venueId,
      dateMet,
      createdAt,
      updatedAt,
      tags,
      favorite: Boolean(item.favorite),
      proximityAlertsEnabled: item.proximityAlertsEnabled !== false,
    };
  });
}

// Same guard rail for venues; also ensures coords/locationTag fields stay optional.
function sanitizeVenues(raw: unknown): Venue[] {
  if (!Array.isArray(raw)) {
    throw new Error("Venue data missing or malformed.");
  }
  if (raw.length > MAX_VENUES) {
    throw new Error(`Backup has too many venues (max ${MAX_VENUES}).`);
  }
  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Venue entry #${index + 1} is invalid.`);
    }
    const name =
      typeof item.name === "string" ? truncate(item.name.trim()) : "";
    if (!name) {
      throw new Error(`Venue entry #${index + 1} is missing a name.`);
    }
    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : crypto.randomUUID();
      return {
        id,
        name,
        locationTag: typeof item.locationTag === "string" ? truncate(item.locationTag) : undefined,
        coords: sanitizeCoords(item.coords),
        favorite: Boolean(item.favorite),
        proximityAlertsEnabled: item.proximityAlertsEnabled !== false,
        proximityEnterCount:
          typeof item.proximityEnterCount === "number" && item.proximityEnterCount >= 0
            ? Math.floor(item.proximityEnterCount)
            : 0,
        proximityLastEnterAt:
          typeof item.proximityLastEnterAt === "number" && item.proximityLastEnterAt > 0
            ? Math.floor(item.proximityLastEnterAt)
            : undefined,
      };
    });
  }

// Tags store usage counts for achievements/filter chips, so keep them sane too.
function sanitizeTags(raw: unknown): Tag[] {
  if (!Array.isArray(raw)) {
    throw new Error("Tag data missing or malformed.");
  }
  if (raw.length > MAX_TAGS) {
    throw new Error(`Backup has too many tags (max ${MAX_TAGS}).`);
  }
  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Tag entry #${index + 1} is invalid.`);
    }
    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : crypto.randomUUID();
    const name =
      typeof item.name === "string" ? truncate(item.name.trim()) : "";
    if (!name) {
      throw new Error(`Tag entry #${index + 1} is missing a name.`);
    }
    const count =
      typeof item.count === "number" && item.count >= 0 ? item.count : 0;
    const lastUsed =
      typeof item.lastUsed === "number" && item.lastUsed >= 0
        ? item.lastUsed
        : Date.now();
    return { id, name, count, lastUsed };
  });
}

const sanitizeFavoriteVenues = (value: unknown, venues: Venue[]): string[] => {
  if (!Array.isArray(value)) return [];
  const validNames = new Set(venues.map((v) => v.name));
  const seen = new Set<string>();
  return value
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
    .map((name) => truncate(name.trim()))
    .filter((name) => {
      if (!validNames.has(name) || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
};

// Exposed for unit tests so we can validate backup safety rails.
export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Backup payload is malformed.");
  }

  const version =
    typeof parsed.version === "number" ? parsed.version : BACKUP_VERSION;
  if (version > BACKUP_VERSION) {
    throw new Error("This backup was created by a newer app version.");
  }

  const venues = sanitizeVenues(parsed.venues);
  const tags = sanitizeTags(parsed.tags);
  return {
    version,
    exportedAt:
      typeof parsed.exportedAt === "string"
        ? parsed.exportedAt
        : new Date().toISOString(),
    people: sanitizePeople(parsed.people, venues, tags),
    venues,
    tags,
    favoriteVenues: sanitizeFavoriteVenues(parsed.favoriteVenues, venues),
  };
}

// Exposed for unit tests so we can validate CSV guard rails.
export function parseCsvPeople(text: string) {
  const { headers, rows } = parseCsv(text);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const nameIndex = headerIndex.get("name");
  const dateIndex = headerIndex.get("datemet");
  if (nameIndex === undefined || dateIndex === undefined) {
    throw new Error("CSV must include at least 'name' and 'dateMet' columns.");
  }

  if (rows.length > MAX_PEOPLE) {
    throw new Error(`CSV has too many people (max ${MAX_PEOPLE}).`);
  }

  const venues: Venue[] = [];
  const tags: Tag[] = [];
  const people: Person[] = [];
  const venueByName = new Map<string, Venue>();
  const tagByName = new Map<string, Tag>();
  const seenIds = new Set<string>();
  let skipped = 0;
  const errors: Array<{ line: number; reason: string }> = [];

  const getVenue = (rawVenue: string | undefined) => {
    const trimmed = rawVenue?.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.toLowerCase();
    const existing = venueByName.get(normalized);
    if (existing) return existing;
    if (venues.length >= MAX_VENUES) {
      throw new Error(`CSV has too many venues (max ${MAX_VENUES}).`);
    }
    const venue: Venue = {
      id: crypto.randomUUID(),
      name: truncate(trimmed),
      locationTag: undefined,
      coords: undefined,
      favorite: false,
      proximityAlertsEnabled: true,
      proximityEnterCount: 0,
      proximityLastEnterAt: undefined,
    };
    venues.push(venue);
    venueByName.set(normalized, venue);
    return venue;
  };

  const getTags = (rawTags: string | undefined) => {
    if (!rawTags) return [];
    const parts = Array.from(
      new Set(
        rawTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => tag.toLowerCase())
      )
    );
    const tagIds: string[] = [];
    parts.forEach((tagName) => {
      const normalized = tagName.toLowerCase();
      let tag = tagByName.get(normalized);
      if (!tag) {
        if (tags.length >= MAX_TAGS) {
          throw new Error(`CSV has too many tags (max ${MAX_TAGS}).`);
        }
        tag = {
          id: crypto.randomUUID(),
          name: truncate(normalized),
          count: 0,
          lastUsed: Date.now(),
        };
        tags.push(tag);
        tagByName.set(normalized, tag);
      }
      tagIds.push(tag.id);
    });
    return tagIds;
  };

  rows.forEach((row) => {
    const values = row.values;
    const name = values[nameIndex]?.trim();
    const dateValue = values[dateIndex]?.trim();
    if (!name || !dateValue) {
      errors.push({
        line: row.lineNumber,
        reason: !name ? "Missing name." : "Missing dateMet.",
      });
      skipped += 1;
      return;
    }
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push({ line: row.lineNumber, reason: "Invalid dateMet." });
      skipped += 1;
      return;
    }

    const idValue = values[headerIndex.get("id") ?? -1]?.trim();
    const position = values[headerIndex.get("position") ?? -1]?.trim();
    const description = values[headerIndex.get("description") ?? -1]?.trim();
    const venueName = values[headerIndex.get("venuename") ?? -1]?.trim();
    const tagsValue = values[headerIndex.get("tags") ?? -1]?.trim();
    const favoriteValue = values[headerIndex.get("favorite") ?? -1]
      ?.trim()
      ?.toLowerCase();

    const venue = getVenue(venueName);
    const tagIds = getTags(tagsValue);
    const favorite =
      favoriteValue === "true" || favoriteValue === "yes" || favoriteValue === "1";

    const dateMet = parsedDate.toISOString();
    const id = idValue && !seenIds.has(idValue) ? idValue : crypto.randomUUID();
    if (idValue && seenIds.has(idValue)) {
      errors.push({ line: row.lineNumber, reason: "Duplicate id; generated a new one." });
    }
    seenIds.add(id);

    people.push({
      id,
      name: truncate(name),
      position: position ? truncate(position) : undefined,
      description: description ? truncate(description) : undefined,
      venueId: venue?.id,
      dateMet,
      createdAt: dateMet,
      updatedAt: undefined,
      tags: tagIds,
      favorite,
    });
  });

  return { people, venues, tags, skipped, errors };
}

// Provides export/import helpers that validate payloads before touching state.
// This keeps the Settings panel lean and centralizes backup schemas in one place.
export function useDataBackup(
  favoriteVenues: string[],
  setFavoriteVenues: Dispatch<SetStateAction<string[]>>
) {
  const { people, replacePeople } = usePeople();
  const { tags, replaceTags } = useTags();
  const { venues, replaceVenues } = useVenues();
  const { showNotification } = useNotification();
  const { trackEvent } = useAnalytics();

  // Client-side export just serializes the sanitized contexts into a downloadable JSON blob.
  const buildBackupPayload = () => ({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    people,
    venues,
    tags,
    favoriteVenues,
  });

  const exportBackup = useCallback(() => {
    try {
      const payload: BackupFile = buildBackupPayload();

      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `remember-me-backup-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showNotification("Backup downloaded.", "success");
      trackEvent("backup_exported", { type: "json" });
    } catch (error) {
      console.error(error);
      showNotification("Unable to export data.", "error");
    }
  }, [favoriteVenues, people, showNotification, tags, venues]);

  const exportIcloudBackup = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      exportBackup();
      return;
    }
    try {
      const payload: BackupFile = buildBackupPayload();
      const json = JSON.stringify(payload, null, 2);
      const fileName = `methere-backup-${new Date().toISOString().split("T")[0]}.json`;

      await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const { uri } = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents,
      });

      await Share.share({
        title: "MetHere backup",
        url: uri,
        dialogTitle: "Backup to iCloud Drive",
      });
      showNotification("Backup ready to save.", "success");
      trackEvent("backup_exported", { type: "icloud" });
    } catch (error) {
      console.error(error);
      showNotification("Unable to prepare iCloud backup.", "error");
    }
  }, [exportBackup, favoriteVenues, people, showNotification, tags, venues]);

  const exportCsvBackup = useCallback(() => {
    try {
      const tagById = new Map(tags.map((tag) => [tag.id, tag.name]));
      const venueById = new Map(venues.map((venue) => [venue.id, venue.name]));
      const rows = people.map((person) => {
        const tagNames = (person.tags ?? [])
          .map((tagId) => tagById.get(tagId))
          .filter(Boolean)
          .join(", ");
        const venueName = person.venueId ? venueById.get(person.venueId) ?? "" : "";
        return [
          person.id,
          person.name,
          person.position ?? "",
          person.dateMet,
          venueName ?? "",
          tagNames,
          person.favorite ? "true" : "false",
          person.description ?? "",
        ].map((value) => escapeCsvValue(String(value)));
      });

      const csv = [
        `# MetHere CSV v${CSV_VERSION}`,
        `# exportedAt=${new Date().toISOString()}`,
        CSV_HEADERS.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
      const fileName = `methere-people-${new Date().toISOString().split("T")[0]}.csv`;
      if (Capacitor.isNativePlatform()) {
        Filesystem.writeFile({
          path: fileName,
          data: csv,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        })
          .then(() =>
            Filesystem.getUri({
              path: fileName,
              directory: Directory.Documents,
            })
          )
          .then(({ uri }) =>
            Share.share({
              title: "MetHere CSV export",
              url: uri,
              dialogTitle: "Export CSV",
            })
          )
          .then(() => {
            showNotification("CSV ready to save.", "success");
            trackEvent("backup_exported", { type: "csv" });
          })
          .catch((error) => {
            console.error(error);
            showNotification("Unable to export CSV.", "error");
          });
      } else {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        showNotification("CSV exported.", "success");
        trackEvent("backup_exported", { type: "csv" });
      }
    } catch (error) {
      console.error(error);
      showNotification("Unable to export CSV.", "error");
    }
  }, [people, showNotification, tags, venues]);

  const importBackupFromFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const limitMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
        const error = new Error(`Backup file is too large (max ${limitMb} MB).`);
        showNotification(error.message, "error");
        throw error;
      }
      const text = await file.text();
      try {
        const payload = parseBackup(text);

        const previousState = {
          people: [...people],
          venues: [...venues],
          tags: [...tags],
          favorites: [...favoriteVenues],
        };

        try {
          replacePeople(payload.people);
          replaceVenues(payload.venues);
          replaceTags(payload.tags);
          setFavoriteVenues(payload.favoriteVenues);
        } catch (applyError) {
          replacePeople(previousState.people);
          replaceVenues(previousState.venues);
          replaceTags(previousState.tags);
          setFavoriteVenues(previousState.favorites);
          throw applyError;
        }

        showNotification("Backup imported successfully.", "success");
        trackEvent("backup_imported", { type: "json" });
        return payload;
      } catch (error) {
        console.error(error);
        showNotification(
          error instanceof Error ? error.message : "Import failed.",
          "error"
        );
        throw error;
      }
    },
    [favoriteVenues, people, replacePeople, replaceTags, replaceVenues, setFavoriteVenues, showNotification, tags, venues]
  );

  const importCsvFromFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const limitMb = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1);
        const error = new Error(`CSV file is too large (max ${limitMb} MB).`);
        showNotification(error.message, "error");
        throw error;
      }
      const text = await file.text();
      try {
        const payload = parseCsvPeople(text);

        const previousState = {
          people: [...people],
          venues: [...venues],
          tags: [...tags],
          favorites: [...favoriteVenues],
        };

        try {
          replacePeople(payload.people);
          replaceVenues(payload.venues);
          replaceTags(payload.tags);
          setFavoriteVenues([]);
        } catch (applyError) {
          replacePeople(previousState.people);
          replaceVenues(previousState.venues);
          replaceTags(previousState.tags);
          setFavoriteVenues(previousState.favorites);
          throw applyError;
        }

        if (payload.errors.length > 0) {
          console.warn("CSV import row issues:", payload.errors);
        }
        let message = "CSV imported";
        if (payload.skipped) {
          message += ` (skipped ${payload.skipped} rows)`;
        }
        if (payload.errors.length > 0) {
          const example = payload.errors[0];
          message += `. ${payload.errors.length} issue${payload.errors.length === 1 ? "" : "s"} found`;
          if (example?.reason) {
            message += ` (e.g. ${example.reason})`;
          }
        }
        message += ".";
        showNotification(message, "success");
        trackEvent("backup_imported", { type: "csv" });
        return payload;
      } catch (error) {
        console.error(error);
        showNotification(error instanceof Error ? error.message : "CSV import failed.", "error");
        throw error;
      }
    },
    [favoriteVenues, people, replacePeople, replaceTags, replaceVenues, setFavoriteVenues, showNotification, tags, venues]
  );

  return { exportBackup, exportIcloudBackup, importBackupFromFile, exportCsvBackup, importCsvFromFile };
}
