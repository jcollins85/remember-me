// src/App.tsx
import React, { useState, useEffect, useMemo, useDeferredValue } from "react";
import { AnimatePresence } from "framer-motion";
import { Person, Venue } from "./types";

import { useTags } from "./context/TagContext";
import { usePeople } from './context/PeopleContext';
import { useVenues } from "./context/VenueContext";
import { useNotification } from './context/NotificationContext';

import { useGroupedPeople } from './hooks/useGroupedPeople';
import { useFavoriteSections } from './hooks/useFavouriteSections';
import { useFavorites } from './hooks/useFavourites';
import { useAchievements } from "./hooks/useAchievements";

import VenueSections from './components/venues/VenueSections';
import ModalManager from './components/common/ModalManager';
import Header from "./components/header/Header";
import { useFilteredSortedPeople } from "./components/people/useFilteredSortedPeople";
import { useVenueSort } from './components/venues/useVenueSort';
import { useSearchSort } from './components/header/useSearchSort';
import Notification from './components/common/Notification';
import SettingsPanel from "./components/settings/SettingsPanel";
import ProfilePanel from "./components/profile/ProfilePanel";

import { SortKey, VenueSortKey } from "./utils/sortHelpers";
import { triggerImpact, ImpactStyle } from "./utils/haptics";
import { useAnalytics } from "./context/AnalyticsContext";

import { UNCLASSIFIED } from "./constants";
import { samplePeople, sampleTags, sampleVenues } from "./data";

import { Capacitor, registerPlugin } from "@capacitor/core";
import { Geolocation as CapacitorGeolocation } from "@capacitor/geolocation";
import { Geolocation } from "@capacitor/geolocation";

import { isProximityAlertsEnabled, setProximityAlertsEnabled } from "./utils/proximityAlerts";
import {
  refreshMonitoredVenues,
  startProximityAlerts,
  stopProximityAlerts,
  type MonitoredVenue,
} from "./utils/proximityService";

type VenueView = "all" | "favs";
const SMART_MONITOR_LIMIT = 12;

// App orchestrates all persistent providers and renders the main layout,
// wiring together search, sorting, modals, notifications, and persisted data.
function App() {
  const proximitySupported = Capacitor.isNativePlatform();
  // ── Tag context ──
  const { tags, createTag, getTagIdByName, getTagNameById, replaceTags } = useTags();  
  
  // ── UI state ──
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // ── People state ──
  const { people, addPerson, updatePerson, deletePerson, replacePeople } = usePeople();

  // ── Favorites state (persisted) ──
  const [favoriteVenues, setFavoriteVenues] = useFavorites('favoriteVenues');

  // ── Modals/edit state ──
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // ── Settings panel ──
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sortSheet, setSortSheet] = useState<"venue" | "people" | null>(null);
  const [proximityEnabled, setProximityEnabled] = useState(() =>
    proximitySupported && isProximityAlertsEnabled()
  );

  // ── Sorting prefs ──  
  const [venueSortKey, setVenueSortKey] = useState<VenueSortKey>("recentVisit");
  const [venueSortDir, setVenueSortDir] = useState<"asc" | "desc">("desc");
  const [venueView, setVenueView] = useState<VenueView>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Capture a lightweight location snapshot so we can show venue distances and feed smart
  // monitoring without aggressively polling the GPS (500m distance filter keeps battery happy).
  useEffect(() => {
    let cancelled = false;
    let watchId: string | null = null;
    const fetchLocation = async () => {
      try {
        await CapacitorGeolocation.requestPermissions();
        const position = await CapacitorGeolocation.getCurrentPosition();
        if (!cancelled) {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        }
        watchId = await CapacitorGeolocation.watchPosition(
          { enableHighAccuracy: false, distanceFilter: 500 },
          (position, error) => {
            if (error || !position || cancelled) return;
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.warn("Unable to fetch current location", err);
      }
    };
    fetchLocation();
    return () => {
      cancelled = true;
      if (watchId) {
        CapacitorGeolocation.clearWatch({ id: watchId });
      }
    };
  }, []);


  const {
    toasts,
    showNotification,
    dismissToast,
  } = useNotification();
  
  const {
    searchQuery, setSearchQuery,
    activeTags,  setActiveTags,
    personSort,  setPersonSort
  } = useSearchSort();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const { trackEvent } = useAnalytics();

  // ── Venue context & lookup ──
  const { venues, replaceVenues } = useVenues();
  const venuesById = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])) as Record<string, Venue>,
    [venues]
  );  

  const monitoredVenues = useMemo<MonitoredVenue[]>(() => {
    return venues.map((venue) => {
      if (!venue.id) {
        return venue;
      }
      const peopleAtVenue = people.filter((person) => person.venueId === venue.id);
      const favoriteNames = peopleAtVenue
        .filter((person) => person.favorite)
        .map((person) => person.name);
      return {
        ...venue,
        proximityMeta: {
          totalPeople: peopleAtVenue.length,
          favoriteNames,
        },
      };
    });
  }, [venues, people]);

  const monitoredSubset = useMemo<MonitoredVenue[]>(() => {
    if (!userLocation) return monitoredVenues;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000;
    const withDistance = monitoredVenues
      .filter((venue) => venue.coords)
      .map((venue) => {
        const dLat = toRad(venue.coords!.lat - userLocation.lat);
        const dLon = toRad(venue.coords!.lon - userLocation.lon);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userLocation.lat)) *
            Math.cos(toRad(venue.coords!.lat)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return { venue, distance };
      })
      .sort((a, b) => a.distance - b.distance);
    const selected = withDistance
      .slice(0, SMART_MONITOR_LIMIT)
      .map((item) => item.venue);
    const withoutCoords = monitoredVenues.filter((venue) => !venue.coords);
    return [...selected, ...withoutCoords];
  }, [monitoredVenues, userLocation]);

  const venueDistanceLabels = useMemo(() => {
    if (!userLocation) return {};
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000;
    return monitoredVenues.reduce<Record<string, string>>((acc, venue) => {
      if (!venue.coords) return acc;
      const dLat = toRad(venue.coords.lat - userLocation.lat);
      const dLon = toRad(venue.coords.lon - userLocation.lon);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(userLocation.lat)) *
          Math.cos(toRad(venue.coords.lat)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      const label =
        distance < 1000
          ? `${Math.round(distance)} m away`
          : `${(distance / 1000).toFixed(1)} km away`;
      acc[venue.name] = label;
      return acc;
    }, {});
  }, [monitoredVenues, userLocation]);

  // ── Filter & sort hook ──
  const [sortField, sortDir] = personSort.split("-") as [SortKey, "asc" | "desc"];
  const filteredPeople = useFilteredSortedPeople(
    people,
    deferredSearchQuery,
    activeTags,
    sortField,
    sortDir === "asc"
  );

  // Debounce search logging so analytics only records deliberate queries (prevents spam per keypress).
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    const handler = window.setTimeout(() => {
      trackEvent("search_used", {
        query_length: trimmed.length,
        results: filteredPeople.length,
      });
    }, 500);
    return () => window.clearTimeout(handler);
  }, [searchQuery, filteredPeople.length, trackEvent]);

  // ── Handlers ──
  const toggleGroup = (venueName: string) => {
    setOpenGroups((prev: Record<string, boolean>) => {
      // default false if undefined
      const isOpen = prev[venueName] ?? false;
      return {
        ...prev,
        [venueName]: !isOpen,
      };
    });
  };

  const handleDelete = (id: string, name: string) => {
    setPersonToDelete({ id, name } as Person);
  };

  const handleResetData = () => {
    if (
      !window.confirm(
        "Reset to sample data? This will overwrite all people, venues, tags, and favourites."
      )
    ) {
      return;
    }

    const clonedPeople = samplePeople.map((person) => ({
      ...person,
      tags: person.tags ? [...person.tags] : [],
    }));
    const clonedVenues = sampleVenues.map((venue) => ({
      ...venue,
      coords: venue.coords ? { ...venue.coords } : undefined,
    }));
    const clonedTags = sampleTags.map((tag) => ({ ...tag }));

    replacePeople(clonedPeople);
    replaceVenues(clonedVenues);
    replaceTags(clonedTags);
    setFavoriteVenues([]);

    showNotification("App data reset to sample set.", "info");
  };

  const handleResetApp = () => {
    if (
      !window.confirm(
        "Reset app to a blank state? This will permanently remove all people, venues, tags, favourites, and achievements."
      )
    ) {
      return;
    }
    replacePeople([]);
    replaceVenues([]);
    replaceTags([]);
    setFavoriteVenues([]);
    resetAchievements();
    showNotification("App reset to a blank state.", "info");
  };

  const handleProximityToggle = async () => {
    if (!proximitySupported) {
      showNotification("Proximity alerts are only available in the iOS app.", "info");
      return;
    }
    const next = !proximityEnabled;
    setProximityAlertsEnabled(next);
    setProximityEnabled(next);
    trackEvent("proximity_toggle", { enabled: next });
  };

  const handleClearAchievements = () => {
    if (
      !window.confirm(
        "Clear achievement progress? Existing milestones will need to be re-earned."
      )
    ) {
      return;
    }
    resetAchievements();
    showNotification("Achievements cleared.", "info");
  };

  // ── Group by venue via new hook ──
  const groupedPeople = useGroupedPeople(filteredPeople, venuesById);

  // ── Initialize openGroups keys ──
  useEffect(() => {
    const groupKeys = Object.keys(
      people.reduce((acc, person) => {
        // Lookup name by ID, or fall back to UNCLASSIFIED
        const venueName = person.venueId
          ? venuesById[person.venueId]?.name ?? UNCLASSIFIED
          : UNCLASSIFIED;
        acc[venueName] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );

    setOpenGroups((prev) => {
      const updated = { ...prev };
      groupKeys.forEach((key) => {
        if (updated[key] === undefined) updated[key] = true;
      });
      return updated;
    });
  }, [people, venuesById]);

  // ── Prevent scrolling ──
  useEffect(() => {
    const shouldLock =
      showSettings ||
      showProfile ||
      showAddModal ||
      editingPerson ||
      personToDelete ||
      sortSheet !== null;
    document.body.style.overflow = shouldLock ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSettings, showProfile, showAddModal, editingPerson, personToDelete, sortSheet]);

  // Guard against someone syncing an “on” toggle from device and then opening the PWA.
  useEffect(() => {
    if (!proximitySupported && isProximityAlertsEnabled()) {
      setProximityAlertsEnabled(false);
      setProximityEnabled(false);
    }
  }, [proximitySupported]);

  // Kick off / stop the native watcher whenever the global toggle or monitored venues change.
  useEffect(() => {
    let cancelled = false;
    if (!proximityEnabled || !proximitySupported) {
      stopProximityAlerts();
      return;
    }
    (async () => {
      const result = await startProximityAlerts(monitoredSubset);
      if (!cancelled && !result.ok) {
        setProximityAlertsEnabled(false);
        setProximityEnabled(false);
        showNotification(result.error ?? "Unable to enable proximity alerts.", "error");
        trackEvent("proximity_error", { message: result.error ?? "unknown" });
      }
      if (!cancelled && result.ok) {
        trackEvent("proximity_started", { monitoredVenues: monitoredSubset.length });
      }
    })();
    return () => {
      cancelled = true;
      stopProximityAlerts();
    };
  }, [proximityEnabled, showNotification, monitoredSubset, proximitySupported]);

  // Keep the watcher in sync with current venue coordinates/toggles.
  useEffect(() => {
    if (!proximityEnabled || !proximitySupported) return;
    refreshMonitoredVenues(monitoredSubset);
  }, [monitoredSubset, proximityEnabled, proximitySupported]);

  const sortedVenues = useVenueSort(
    venues,
    people,
    venueSortKey,
    venueSortDir === "asc"
  );
  
  const sortedVenueNames = sortedVenues
    .map((v) => v.name)
    .filter((name) => groupedPeople[name]);

  const favoriteSections = useFavoriteSections(sortedVenueNames, favoriteVenues);
  const favoriteVenueNames = favoriteSections.favorites;
  const visibleVenueNames =
    venueView === "favs" ? favoriteVenueNames : sortedVenueNames;

  const { achievements, stats, resetAchievements } = useAchievements(
    people,
    venues,
    favoriteVenues
  );

  const getVenueAnalyticsMeta = (venueId?: string) => {
    if (!venueId) {
      return { venue_name: "Unclassified", venue_type: "unclassified" };
    }
    const venue = venuesById[venueId];
    if (!venue) {
      return { venue_name: "Custom Venue", venue_type: "new" };
    }
    return {
      venue_name: venue.name,
      venue_type: favoriteVenues.includes(venue.name) ? "favorite" : "existing",
    };
  };

  const unlockedRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    const prev = unlockedRef.current;
    const next = new Set(prev);
    achievements.forEach((achievement) => {
      if (achievement.unlocked && !achievement.unlockedAt && !prev.has(achievement.id)) {
        triggerImpact(ImpactStyle.Heavy);
        trackEvent("achievement_unlocked", {
          id: achievement.id,
          type: achievement.type,
          title: achievement.title,
        });
        showNotification(`Achievement unlocked: ${achievement.title}`, "celebration", { description: achievement.description });
        next.add(achievement.id);
      }
    });
    unlockedRef.current = next;
  }, [achievements, showNotification]);

  const usageInsights = useMemo(() => {
    const venueUsage = people.reduce<Record<string, number>>((acc, person) => {
      const venueName = person.venueId
        ? venuesById[person.venueId]?.name ?? UNCLASSIFIED
        : UNCLASSIFIED;
      acc[venueName] = (acc[venueName] || 0) + 1;
      return acc;
    }, {});
    const topVenueEntry = Object.entries(venueUsage).sort((a, b) => b[1] - a[1])[0];
    const topVenue = topVenueEntry
      ? { name: topVenueEntry[0], count: topVenueEntry[1] }
      : undefined;

    const tagUsage = people.reduce<Record<string, number>>((acc, person) => {
      person.tags?.forEach((tagId) => {
        const tagName = getTagNameById(tagId);
        if (!tagName) return;
        acc[tagName] = (acc[tagName] || 0) + 1;
      });
      return acc;
    }, {});
    const topTagEntry = Object.entries(tagUsage).sort((a, b) => b[1] - a[1])[0];
    const topTag = topTagEntry
      ? { name: topTagEntry[0], count: topTagEntry[1] }
      : undefined;

    const favoritesCount = people.filter((person) => person.favorite).length;

    const lastMet = [...people]
      .filter((person) => person.dateMet)
      .sort((a, b) => new Date(b.dateMet).getTime() - new Date(a.dateMet).getTime())[0];
    const lastInteraction = lastMet
      ? { name: lastMet.name, date: lastMet.dateMet }
      : undefined;

    return {
      topVenue,
      topTag,
      favoritesCount,
      lastInteraction,
    };
  }, [people, venuesById, getTagNameById]);

  useEffect(() => {
    const usage = new Map<string, number>();
    people.forEach((person) => {
      person.tags?.forEach((tagId) => {
        usage.set(tagId, (usage.get(tagId) ?? 0) + 1);
      });
    });
    const normalized = tags.map((tag) => {
      const count = usage.get(tag.id) ?? 0;
      if (tag.count !== count) {
        return { ...tag, count };
      }
      return tag;
    });
    const changed = normalized.some((tag, idx) => tag !== tags[idx]);
    if (changed) {
      replaceTags(normalized);
    }
  }, [people, tags, replaceTags]);

  return (
    <div
      className="flex flex-col min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTags={activeTags}
        setActiveTags={setActiveTags}
        venueSortKey={venueSortKey}
        venueSortDir={venueSortDir}
        setVenueSortKey={setVenueSortKey}
        setVenueSortDir={setVenueSortDir}
        personSort={personSort}
        setPersonSort={setPersonSort}
        onOpenSettings={() => setShowSettings(true)}
        onOpenProfile={() => setShowProfile(true)}
        getTagNameById={getTagNameById}
        venueView={venueView}
        setVenueView={setVenueView}
        favoriteVenueCount={favoriteVenueNames.length}
        totalVenueCount={sortedVenueNames.length}
        sortSheet={sortSheet}
        setSortSheet={setSortSheet}
      />

      <main
        className="flex-1 pb-24 w-full"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 grid gap-4 md:gap-6 lg:gap-8 max-w-3xl lg:max-w-5xl mx-auto w-full">
          <ModalManager
            showAdd={showAddModal}
            onAddCancel={() => setShowAddModal(false)}
            onAdd={async (newPerson) => {
              await triggerImpact(ImpactStyle.Heavy);
              addPerson(newPerson);
              setShowAddModal(false);
              showNotification(`${newPerson.name} added`, "success");
              const venueMeta = getVenueAnalyticsMeta(newPerson.venueId);
              trackEvent("person_added", {
                ...venueMeta,
                tags: newPerson.tags?.length ?? 0,
                favorite: !!newPerson.favorite,
              });
            }}
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}

            editingPerson={editingPerson}
            onEditCancel={() => setEditingPerson(null)}
            onEdit={async (updated) => {
              await triggerImpact(ImpactStyle.Heavy);
              updatePerson(updated);
              setEditingPerson(null);
              showNotification(`${updated.name} updated`, "success");
              const venueMeta = getVenueAnalyticsMeta(updated.venueId);
              trackEvent("person_updated", {
                id: updated.id,
                ...venueMeta,
                tags: updated.tags?.length ?? 0,
                favorite: !!updated.favorite,
              });
            }}

            personToDelete={personToDelete}
            onDeleteCancel={() => setPersonToDelete(null)}
            onDeleteConfirm={(id) => {
              const deletedName = personToDelete?.name ?? "Person";
              const deletedPerson = people.find((p) => p.id === id);
              const venueMeta = getVenueAnalyticsMeta(deletedPerson?.venueId);
              trackEvent("person_deleted", {
                id,
                ...venueMeta,
                tags: deletedPerson?.tags?.length ?? 0,
                favorite: deletedPerson?.favorite ?? false,
              });
              deletePerson(id);
              setPersonToDelete(null);
              showNotification(`${deletedName} deleted`, "info");
            }}
          />

          <VenueSections
            groupedPeople={groupedPeople}
            favoriteVenues={favoriteVenues}
            visibleVenueNames={visibleVenueNames}
            viewMode={venueView}
            personSort={personSort}
            activeTags={activeTags}
            setActiveTags={setActiveTags}
            getTagNameById={getTagNameById}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            setFavoriteVenues={setFavoriteVenues}
            onEdit={setEditingPerson}
            onDelete={handleDelete}
            onToggleFavorite={(id) => {
              const p = people.find(p => p.id === id);
              if (p) updatePerson({ ...p, favorite: !p.favorite });
            }}
            searchQuery={searchQuery}
            distanceLabels={venueDistanceLabels}
          /> 
        </div>
      </main>

      <button
        onClick={async () => {
          await triggerImpact(ImpactStyle.Light);
          setShowAddModal(true);
        }}
        className="fixed sm:bottom-8 md:bottom-10 right-6 bg-[var(--color-accent)] text-white text-3xl rounded-full w-14 h-14 hover:brightness-110 transition z-40"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        aria-label="Add Person"
      >
        ＋
      </button>

      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        favoriteVenues={favoriteVenues}
        setFavoriteVenues={setFavoriteVenues}
        onResetData={handleResetData}
        onResetApp={handleResetApp}
        onClearAchievements={handleClearAchievements}
        proximityEnabled={proximityEnabled}
        onToggleProximity={handleProximityToggle}
        proximitySupported={proximitySupported}
      />

      <ProfilePanel
        open={showProfile}
        onClose={() => setShowProfile(false)}
        achievements={achievements}
        stats={stats}
        insights={usageInsights}
      />

      <div
        className="fixed right-6 z-[120] flex flex-col gap-3 pointer-events-none"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <Notification
              key={toast.id}
              message={toast.message}
              type={toast.type}
              meta={toast.meta}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
