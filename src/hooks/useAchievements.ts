import { useCallback, useEffect, useMemo } from "react";
import type { Person, Venue } from "../types";
import useLocalStorage from "./useLocalStorage";

type AchievementType = "people" | "venues" | "tags" | "favorites";

interface AchievementDefinition {
  id: string;
  type: AchievementType;
  target: number;
  title: string;
  description: string;
}

export interface AchievementProgress extends AchievementDefinition {
  unlocked: boolean;
  current: number;
  progress: number;
  unlockedAt?: string;
}

// Central library of every milestone (kept in-code for now so we can tweak copy/targets easily).
const DEFINITIONS: AchievementDefinition[] = [
  {
    id: "people_first",
    type: "people",
    target: 1,
    title: "Icebreaker",
    description: "Add your first person.",
  },
  {
    id: "people_5",
    type: "people",
    target: 5,
    title: "Circle of Five",
    description: "Track your first 5 people.",
  },
  {
    id: "people_20",
    type: "people",
    target: 20,
    title: "Network Builder",
    description: "Reach 20 tracked people.",
  },
  {
    id: "people_50",
    type: "people",
    target: 50,
    title: "Community Maven",
    description: "Log 50 people or more.",
  },
  {
    id: "people_75",
    type: "people",
    target: 75,
    title: "City Connector",
    description: "Keep tabs on 75 contacts.",
  },
  {
    id: "people_100",
    type: "people",
    target: 100,
    title: "Social Curator",
    description: "Reach 100 logged people.",
  },
  {
    id: "venues_first",
    type: "venues",
    target: 1,
    title: "First Venue",
    description: "Log someone at a venue.",
  },
  {
    id: "venues_3",
    type: "venues",
    target: 3,
    title: "Neighborhood Scout",
    description: "Add people from 3 different venues.",
  },
  {
    id: "venues_10",
    type: "venues",
    target: 10,
    title: "City Guide",
    description: "Tag 10 venues across the city.",
  },
  {
    id: "venues_25",
    type: "venues",
    target: 25,
    title: "Urban Explorer",
    description: "Log people from 25 venues.",
  },
  {
    id: "venues_40",
    type: "venues",
    target: 40,
    title: "City Curator",
    description: "Tag 40 unique venues.",
  },
  {
    id: "venues_50",
    type: "venues",
    target: 50,
    title: "Metropolitan Maven",
    description: "Map out 50 venues.",
  },
  {
    id: "tags_first",
    type: "tags",
    target: 1,
    title: "First Tag",
    description: "Categorize someone with a tag.",
  },
  {
    id: "tags_5",
    type: "tags",
    target: 5,
    title: "Trend Spotter",
    description: "Use 5 unique tags across your people.",
  },
  {
    id: "tags_15",
    type: "tags",
    target: 15,
    title: "Culture Curator",
    description: "Apply 15 different tags.",
  },
  {
    id: "tags_30",
    type: "tags",
    target: 30,
    title: "Storyteller",
    description: "Craft rich profiles with 30 tags.",
  },
  {
    id: "tags_40",
    type: "tags",
    target: 40,
    title: "Narrator",
    description: "Use 40 different tags.",
  },
  {
    id: "tags_50",
    type: "tags",
    target: 50,
    title: "Archivist",
    description: "Capture nuances with 50 tags.",
  },
  {
    id: "favorites_first",
    type: "favorites",
    target: 1,
    title: "First Favourite",
    description: "Mark your first favourite venue.",
  },
  {
    id: "favorites_3",
    type: "favorites",
    target: 3,
    title: "Venue Regular",
    description: "Have 3 go-to venues.",
  },
  {
    id: "favorites_5",
    type: "favorites",
    target: 5,
    title: "Community Builder",
    description: "Pin 5 favourite venues.",
  },
  {
    id: "favorites_8",
    type: "favorites",
    target: 8,
    title: "Neighborhood VIP",
    description: "Keep 8 venues on speed dial.",
  },
  {
    id: "favorites_10",
    type: "favorites",
    target: 10,
    title: "Scene Setter",
    description: "Highlight 10 go-to venues.",
  },
];

export interface AchievementStats {
  peopleCount: number;
  venueCount: number;
  venuesWithPeople: number;
  uniqueTagCount: number;
  favoriteVenueCount: number;
}

interface LifetimeStats {
  peopleMax: number;
  venuesMax: number;
  tagsMax: number;
  favoritesMax: number;
}

// Computes progress + persists unlock timestamps so achievements survive reloads/offline sessions.
export function useAchievements(
  people: Person[],
  venues: Venue[],
  favoriteVenues: string[]
) {
  const [earnedEntries, setEarnedEntries] = useLocalStorage<
    Record<string, string>
  >(
    "achievementEarned",
    {}
  );
  const [lifetimeStats, setLifetimeStats] = useLocalStorage<LifetimeStats>(
    "achievementLifetimeStats",
    {
      peopleMax: 0,
      venuesMax: 0,
      tagsMax: 0,
      favoritesMax: 0,
    }
  );

  const stats = useMemo<AchievementStats>(() => {
    const venueSet = new Set<string>();
    const tagUsage = new Set<string>();

    people.forEach((person) => {
      if (person.venueId) {
        venueSet.add(person.venueId);
      }
      (person.tags ?? []).forEach((tagId) => tagUsage.add(tagId));
    });

    return {
      peopleCount: people.length,
      venueCount: venues.length,
      venuesWithPeople: venueSet.size,
      uniqueTagCount: tagUsage.size,
      favoriteVenueCount: favoriteVenues.length,
    };
  }, [favoriteVenues, people, venues]);

  // Track highest counts ever reached so we don't lose milestone progress when someone deletes data.
  useEffect(() => {
    setLifetimeStats((prev) => {
      const next: LifetimeStats = {
        peopleMax: Math.max(prev.peopleMax, stats.peopleCount),
        venuesMax: Math.max(prev.venuesMax, stats.venuesWithPeople),
        tagsMax: Math.max(prev.tagsMax, stats.uniqueTagCount),
        favoritesMax: Math.max(prev.favoritesMax, stats.favoriteVenueCount),
      };
      const changed =
        next.peopleMax !== prev.peopleMax ||
        next.venuesMax !== prev.venuesMax ||
        next.tagsMax !== prev.tagsMax ||
        next.favoritesMax !== prev.favoritesMax;
      return changed ? next : prev;
    });
  }, [setLifetimeStats, stats]);

  const achievements = useMemo<AchievementProgress[]>(() => {
    const displayCounts = {
      people: Math.max(stats.peopleCount, lifetimeStats.peopleMax),
      venues: Math.max(stats.venuesWithPeople, lifetimeStats.venuesMax),
      tags: Math.max(stats.uniqueTagCount, lifetimeStats.tagsMax),
      favorites: Math.max(stats.favoriteVenueCount, lifetimeStats.favoritesMax),
    };

    return DEFINITIONS.map((definition) => {
      const current =
        definition.type === "people"
          ? displayCounts.people
          : definition.type === "venues"
          ? displayCounts.venues
          : definition.type === "tags"
          ? displayCounts.tags
          : displayCounts.favorites;

      const progress = Math.min(current / definition.target, 1);
      return {
        ...definition,
        current,
        progress,
        unlocked:
          current >= definition.target || !!earnedEntries[definition.id],
        unlockedAt: earnedEntries[definition.id],
      };
    });
  }, [earnedEntries, lifetimeStats, stats]);

  useEffect(() => {
    setEarnedEntries((prev) => {
      let changed = false;
      const next = { ...prev };
      achievements.forEach((achievement) => {
        if (
          achievement.current >= achievement.target &&
          !next[achievement.id]
        ) {
          next[achievement.id] = new Date().toISOString();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [achievements, setEarnedEntries]);

  const resetAchievements = useCallback(() => {
    setEarnedEntries({});
    setLifetimeStats({
      peopleMax: 0,
      venuesMax: 0,
      tagsMax: 0,
      favoritesMax: 0,
    });
  }, [setEarnedEntries, setLifetimeStats]);

  return { achievements, stats, resetAchievements };
}
