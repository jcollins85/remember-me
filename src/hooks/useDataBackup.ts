import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
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

// Enforces shape/limits on imported people so corrupt backups can't crash the UI.
function sanitizePeople(raw: unknown): Person[] {
  if (!Array.isArray(raw)) {
    throw new Error("People data missing or malformed.");
  }
  if (raw.length > MAX_PEOPLE) {
    throw new Error(`Backup has too many people (max ${MAX_PEOPLE}).`);
  }
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
      ? item.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
      : [];

    return {
      id,
      name,
      position: typeof item.position === "string" ? truncate(item.position) : undefined,
      description: typeof item.description === "string" ? truncate(item.description) : undefined,
      venueId: typeof item.venueId === "string" ? item.venueId : undefined,
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

function parseBackup(text: string): BackupFile {
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
  return {
    version,
    exportedAt:
      typeof parsed.exportedAt === "string"
        ? parsed.exportedAt
        : new Date().toISOString(),
    people: sanitizePeople(parsed.people),
    venues,
    tags: sanitizeTags(parsed.tags),
    favoriteVenues: sanitizeFavoriteVenues(parsed.favoriteVenues, venues),
  };
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

  // Client-side export just serializes the sanitized contexts into a downloadable JSON blob.
  const exportBackup = useCallback(() => {
    try {
      const payload: BackupFile = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        people,
        venues,
        tags,
        favoriteVenues,
      };

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
    } catch (error) {
      console.error(error);
      showNotification("Unable to export data.", "error");
    }
  }, [favoriteVenues, people, showNotification, tags, venues]);

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

  return { exportBackup, importBackupFromFile };
}
