// src/App.tsx
import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Person, Venue } from "./types";

// App orchestrates global state, high-level flows, and cross-cutting concerns
// (search/sort, proximity, insights, analytics, and top-level modals).
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
import OnboardingScreen from "./components/onboarding/OnboardingScreen";
import { useFilteredSortedPeople } from "./components/people/useFilteredSortedPeople";
import { useVenueSort } from './components/venues/useVenueSort';
import { useSearchSort } from './components/header/useSearchSort';
import Notification from './components/common/Notification';
import SettingsPanel from "./components/settings/SettingsPanel";
import ProfilePanel from "./components/profile/ProfilePanel";
import PermissionPromptModal from "./components/common/PermissionPromptModal";

import { SortKey, VenueSortKey } from "./utils/sortHelpers";
import { triggerImpact, ImpactStyle } from "./utils/haptics";
import { useAnalytics } from "./context/AnalyticsContext";

import { UNCLASSIFIED } from "./constants";
import { samplePeople, sampleTags, sampleVenues } from "./data";

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { Geolocation as CapacitorGeolocation } from "@capacitor/geolocation";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";

import { isProximityAlertsEnabled, setProximityAlertsEnabled } from "./utils/proximityAlerts";
import { togglePersonFavorite } from "./utils/favorites";
import {
  cancelProximityNotifications,
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem("onboarding_seen");
    } catch {
      return false;
    }
  });
  // ── Tag context ──
  const { tags, createTag, getTagIdByName, getTagNameById, replaceTags } = useTags();

  // ── Venue context & lookup ──
  const { venues, replaceVenues, updateVenue } = useVenues();
  const hasPinnedVenue = useMemo(
    () => venues.some((venue) => Boolean(venue.coords)),
    [venues]
  );
  
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
  const [showSortModal, setShowSortModal] = useState(false);
  const [showProximityPrePrompt, setShowProximityPrePrompt] = useState(false);
  const [pendingProximitySource, setPendingProximitySource] = useState<"settings" | "venue_toggle" | null>(null);
  const [pendingProximityCallback, setPendingProximityCallback] = useState<(() => void) | null>(null);
  const [pendingVenueFocusId, setPendingVenueFocusId] = useState<string | null>(null);
  const [proximityEnabled, setProximityEnabled] = useState(() =>
    proximitySupported && isProximityAlertsEnabled()
  );

  // ── Sorting prefs ──  
  const [venueSortKey, setVenueSortKey] = useState<VenueSortKey>("recentVisit");
  const [venueSortDir, setVenueSortDir] = useState<"asc" | "desc">("desc");
  const [venueView, setVenueView] = useState<VenueView>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const {
    toasts,
    showNotification,
    dismissToast,
  } = useNotification();

  // Capture a lightweight location snapshot so we can show venue distances and feed smart
  // monitoring without aggressively polling the GPS (500m distance filter keeps battery happy).
  useEffect(() => {
    if (showOnboarding || !hasPinnedVenue || !proximityEnabled || !proximitySupported) {
      setUserLocation(null);
      return;
    }
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
        showNotification(
          "Location access is disabled. Enable it to power nearby alerts.",
          "info"
        );
      }
    };
    fetchLocation();
    return () => {
      cancelled = true;
      if (watchId) {
        CapacitorGeolocation.clearWatch({ id: watchId });
      }
    };
  }, [showOnboarding, hasPinnedVenue, proximityEnabled, proximitySupported, showNotification]);
  
  const {
    searchQuery, setSearchQuery,
    activeTags,  setActiveTags,
    personSort,  setPersonSort
  } = useSearchSort();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const { trackEvent, trackFirstEvent } = useAnalytics();

  const venuesById = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])) as Record<string, Venue>,
    [venues]
  );
  const venueIdByName = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.name, v.id])) as Record<string, string>,
    [venues]
  );

  // Keep a lightweight, local count for "venue enters" to power insights.
  const handleVenueRegionEnter = useCallback(
    (venueId: string) => {
      const venue = venuesById[venueId];
      if (!venue) return;
      const nextCount = (venue.proximityEnterCount ?? 0) + 1;
      updateVenue({ ...venue, proximityEnterCount: nextCount, proximityLastEnterAt: Date.now() });
    },
    [venuesById, updateVenue]
  );

  // Enrich venues with person/favorite counts for proximity notifications.
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

  // Use a nearest subset to keep geofencing lightweight on battery.
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
        results_count: filteredPeople.length,
      });
    }, 500);
    return () => window.clearTimeout(handler);
  }, [searchQuery, filteredPeople.length, trackEvent]);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem("onboarding_seen", "true");
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

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

    const removedIds = venues
      .filter((venue) => !clonedVenues.some((next) => next.id === venue.id))
      .map((venue) => venue.id)
      .filter(Boolean);
    cancelProximityNotifications(removedIds);
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
    cancelProximityNotifications(venues.map((venue) => venue.id).filter(Boolean));
    replacePeople([]);
    replaceVenues([]);
    replaceTags([]);
    setFavoriteVenues([]);
    resetAchievements();
    localStorage.removeItem("onboarding_seen");
    setShowOnboarding(true);
    showNotification("App reset to a blank state.", "info");
  };

  // Remove venues that no longer have people attached, and drop orphaned favourites.
  const pruneVenuesForPeople = (nextPeople: Person[]) => {
    const activeVenueIds = new Set(
      nextPeople.map((person) => person.venueId).filter(Boolean) as string[]
    );
    const removedIds = venues
      .filter((venue) => !activeVenueIds.has(venue.id))
      .map((venue) => venue.id)
      .filter(Boolean);
    const prunedVenues = venues.filter((venue) => activeVenueIds.has(venue.id));
    if (prunedVenues.length === venues.length) {
      return;
    }
    cancelProximityNotifications(removedIds);
    replaceVenues(prunedVenues);
    const activeVenueNames = new Set(prunedVenues.map((venue) => venue.name));
    setFavoriteVenues((prev) => prev.filter((name) => activeVenueNames.has(name)));
  };

  // One-time pre-prompt to explain why iOS will ask for permissions.
  const shouldShowProximityPrePrompt = () => {
    if (!proximitySupported) return false;
    try {
      return localStorage.getItem("proximity_preprompt_seen") !== "true";
    } catch {
      return false;
    }
  };

  const enableProximity = (source?: "settings" | "venue_toggle") => {
    if (!proximitySupported) {
      showNotification("Nearby venue alerts are only available in the iOS app.", "info");
      return;
    }
    if (proximityEnabled) return;
    setProximityAlertsEnabled(true);
    setProximityEnabled(true);
    trackFirstEvent("proximity_enabled", "first_proximity_enabled", {
      ...(source ? { source } : {}),
    });
    trackEvent("proximity_toggle", {
      enabled: true,
      ...(source ? { source } : {}),
    });
  };

  const handleProximityToggle = async () => {
    if (!proximitySupported) {
      showNotification("Nearby venue alerts are only available in the iOS app.", "info");
      return;
    }
    const next = !proximityEnabled;
    if (next && shouldShowProximityPrePrompt()) {
      setPendingProximitySource("settings");
      setShowProximityPrePrompt(true);
      return;
    }
    if (next) {
      enableProximity("settings");
      return;
    }
    cancelProximityNotifications(venues.map((venue) => venue.id).filter(Boolean));
    setProximityAlertsEnabled(next);
    setProximityEnabled(next);
    trackEvent("proximity_toggle", { enabled: next });
  };

  const enableGlobalProximity = (options?: { source?: "settings" | "venue_toggle"; onEnabled?: () => void }) => {
    if (!proximitySupported) {
      showNotification("Nearby venue alerts are only available in the iOS app.", "info");
      return;
    }
    if (proximityEnabled) {
      options?.onEnabled?.();
      return;
    }
    if (shouldShowProximityPrePrompt()) {
      setPendingProximitySource(options?.source ?? "settings");
      setPendingProximityCallback(() => options?.onEnabled ?? null);
      setShowProximityPrePrompt(true);
      return;
    }
    enableProximity(options?.source ?? "settings");
    options?.onEnabled?.();
  };

  const handlePrePromptConfirm = () => {
    try {
      localStorage.setItem("proximity_preprompt_seen", "true");
    } catch {
      // ignore
    }
    const source = pendingProximitySource;
    const callback = pendingProximityCallback;
    setPendingProximitySource(null);
    setPendingProximityCallback(null);
    setShowProximityPrePrompt(false);
    if (source) {
      enableProximity(source);
      callback?.();
    }
  };

  const handlePrePromptCancel = () => {
    setPendingProximitySource(null);
    setPendingProximityCallback(null);
    setShowProximityPrePrompt(false);
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

  useEffect(() => {
    if (!proximitySupported) return;
    let handle: PluginListenerHandle | null = null;
    (async () => {
      handle = await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (event) => {
          const venueId = event.notification?.extra?.venueId;
          if (typeof venueId === "string" && venueId.length > 0) {
            setPendingVenueFocusId(venueId);
          }
        }
      );
    })();
    return () => {
      handle?.remove();
    };
  }, [proximitySupported]);

  useEffect(() => {
    if (!pendingVenueFocusId) return;
    const venue = venuesById[pendingVenueFocusId];
    if (!venue) {
      showNotification("That venue is no longer available.", "info");
      setPendingVenueFocusId(null);
      return;
    }
    setVenueView("all");
    setSearchQuery("");
    setActiveTags([]);
    setOpenGroups((prev) => ({ ...prev, [venue.name]: true }));
    const targetId = `venue-card-${venue.id}`;
    const timer = window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        showNotification("Unable to locate that venue in the list.", "info");
      }
    }, 200);
    setPendingVenueFocusId(null);
    return () => window.clearTimeout(timer);
  }, [pendingVenueFocusId, venuesById, setSearchQuery, setActiveTags, showNotification]);

  // ── Prevent scrolling ──
  useEffect(() => {
    const shouldLock =
      showSettings ||
      showProfile ||
      showAddModal ||
      editingPerson ||
      personToDelete ||
      showSortModal;
    document.body.style.overflow = shouldLock ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSettings, showProfile, showAddModal, editingPerson, personToDelete, showSortModal]);

  // Guard against someone syncing an “on” toggle from device and then opening the PWA.
  useEffect(() => {
    if (!proximitySupported && isProximityAlertsEnabled()) {
      setProximityAlertsEnabled(false);
      setProximityEnabled(false);
    }
  }, [proximitySupported]);

  // Kick off / stop the native watcher whenever the global toggle or monitored venues change.
  useEffect(() => {
    if (showOnboarding) {
      stopProximityAlerts();
      return;
    }
    let cancelled = false;
    if (!proximityEnabled || !proximitySupported) {
      stopProximityAlerts();
      return;
    }
    (async () => {
      const result = await startProximityAlerts(monitoredSubset, {
        onRegionEnter: handleVenueRegionEnter,
      });
      if (!cancelled && !result.ok) {
        setProximityAlertsEnabled(false);
        setProximityEnabled(false);
        const errorCode = result.error ?? "unknown";
        showNotification(errorCode ?? "Unable to enable proximity alerts.", "error");
        trackEvent("proximity_error", { error_code: errorCode, error_stage: "start" });
      }
      if (!cancelled && result.ok) {
        trackEvent("proximity_started", { monitored_venues_count: monitoredSubset.length });
      }
    })();
    return () => {
      cancelled = true;
      stopProximityAlerts();
    };
  }, [proximityEnabled, showNotification, monitoredSubset, proximitySupported, showOnboarding, handleVenueRegionEnter]);

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
    const pinsSaved = venues.reduce(
      (count, venue) => (venue.coords ? count + 1 : count),
      0
    );
    // "Nearby alerts" now reflects delivered alert count, not enabled venues.
    const nearbyAlerts = venues.reduce(
      (count, venue) => count + (venue.proximityEnterCount ?? 0),
      0
    );

    const lastMet = [...people]
      .filter((person) => person.dateMet)
      .sort((a, b) => new Date(b.dateMet).getTime() - new Date(a.dateMet).getTime())[0];
    const lastInteraction = lastMet
      ? { name: lastMet.name, date: lastMet.dateMet }
      : undefined;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // Rolling 30-day count for the "Lately" insight.
    const recentPeopleCount = people.filter((person) => {
      const createdAt = new Date(person.createdAt).getTime();
      return !Number.isNaN(createdAt) && createdAt >= thirtyDaysAgo;
    }).length;
    // "Most visited" picks the venue with >1 enters and highest count.
    const repeatVenue = venues
      .filter((venue) => (venue.proximityEnterCount ?? 0) > 1)
      .sort((a, b) => (b.proximityEnterCount ?? 0) - (a.proximityEnterCount ?? 0))[0];
    const placeYouReturnTo = repeatVenue
      ? { name: repeatVenue.name, count: repeatVenue.proximityEnterCount ?? 0 }
      : undefined;

    return {
      topVenue,
      topTag,
      favoritesCount,
      lastInteraction,
      pinsSaved,
      nearbyAlerts,
      recentPeopleCount,
      placeYouReturnTo,
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

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

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
        onOpenSettings={() => {
          trackEvent("settings_opened");
          setShowSettings(true);
        }}
        onOpenProfile={() => {
          trackEvent("profile_opened");
          setShowProfile(true);
        }}
        getTagNameById={getTagNameById}
        venueView={venueView}
        setVenueView={setVenueView}
        favoriteVenueCount={favoriteVenueNames.length}
        totalVenueCount={sortedVenueNames.length}
        showSortModal={showSortModal}
        setShowSortModal={setShowSortModal}
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
              const nextPeople = [newPerson, ...people];
              addPerson(newPerson);
              pruneVenuesForPeople(nextPeople);
              setShowAddModal(false);
              showNotification(`${newPerson.name} added`, "success");
              if (people.length === 0) {
                trackEvent("first_person_added");
              }
              const venueMeta = getVenueAnalyticsMeta(newPerson.venueId);
              trackEvent("person_added", {
                ...venueMeta,
                tags_count: newPerson.tags?.length ?? 0,
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
              const nextPeople = people.map((person) =>
                person.id === updated.id ? updated : person
              );
              updatePerson(updated);
              pruneVenuesForPeople(nextPeople);
              setEditingPerson(null);
              showNotification(`${updated.name} updated`, "success");
              const venueMeta = getVenueAnalyticsMeta(updated.venueId);
              trackEvent("person_updated", {
                id: updated.id,
                ...venueMeta,
                tags_count: updated.tags?.length ?? 0,
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
                tags_count: deletedPerson?.tags?.length ?? 0,
                favorite: deletedPerson?.favorite ?? false,
              });
              const nextPeople = people.filter((person) => person.id !== id);
              deletePerson(id);
              pruneVenuesForPeople(nextPeople);
              setPersonToDelete(null);
              showNotification(`${deletedName} deleted`, "info");
            }}
            globalProximityEnabled={proximityEnabled}
            onEnableGlobalProximity={enableGlobalProximity}
          />

          <VenueSections
            groupedPeople={groupedPeople}
            favoriteVenues={favoriteVenues}
            visibleVenueNames={visibleVenueNames}
            totalVenueCount={venues.length}
            viewMode={venueView}
            venueIdByName={venueIdByName}
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
              const p = people.find((person) => person.id === id);
              if (!p) return;
              const updatedPerson = togglePersonFavorite(p);
              const nextFavorite = !!updatedPerson.favorite;
              updatePerson(updatedPerson);
              if (nextFavorite) {
                trackFirstEvent("favorite_added", "first_favorite_added", {
                  type: "person",
                });
              }
              if (nextFavorite) {
                trackEvent("person_favorited");
              }
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

      <AnimatePresence>
        {showProximityPrePrompt && (
          <PermissionPromptModal
            onConfirm={handlePrePromptConfirm}
            onCancel={handlePrePromptCancel}
          />
        )}
      </AnimatePresence>

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
