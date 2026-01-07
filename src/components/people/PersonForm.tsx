import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVenues } from "../../context/VenueContext";
import { UNCLASSIFIED } from "../../constants";
import { Person, Tag, Venue } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { useTagInput } from "../../hooks/useTagInput";
import { useVenueInput } from "../../hooks/useVenueInput";
import { validatePersonForm, ValidationErrors } from "../../utils/validation";
import { useNotification } from "../../context/NotificationContext";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { MapKitBridge } from "mapkit-bridge";

interface Props {
  initialData?: Partial<Person>;
  onSubmit: (person: Person) => void;
  onCancel?: () => void;
  mode: "add" | "edit";
  tags: Tag[];
  people: Person[];
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  createTag: (name: string) => Tag;
  hideActions?: boolean;
  onSubmittingChange?: (submitting: boolean) => void;
}

// PersonForm handles the add/edit workflow, coordinating venue/tag helpers
// plus validation before delegating the final payload back to the modal.
export default function PersonForm({
  initialData = {},
  onSubmit,
  onCancel,
  mode,
  tags,
  people,
  getTagIdByName,
  getTagNameById,
  createTag,
  hideActions = false,
  onSubmittingChange,
}: Props) {
const mapPreviewPlaceholder =
  "data:image/svg+xml,%3Csvg width='640' height='360' viewBox='0 0 640 360' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='640' height='360' fill='%23f8f4ef'/%3E%3Cpath d='M0 40h640M0 120h640M0 200h640M0 280h640' stroke='%23e5dbcf' stroke-width='2'/%3E%3Cpath d='M80 0v360M200 0v360M320 0v360M440 0v360M560 0v360' stroke='%23e5dbcf' stroke-width='2'/%3E%3Cpath d='M0 260l80-40 60 30 100-50 90 60 90-80 120 40 100-70 0 210H0z' fill='%23d5e5f0'/%3E%3Cpath d='M0 300l90-60 120 70 120-70 120 50 190-140V360H0z' fill='%23c7e0da'/%3E%3C/svg%3E";
  const { showNotification } = useNotification();
  // ── Basic fields ──
  const [name, setName] = useState(initialData.name || "");
  const [position, setPosition] = useState(initialData.position || "");
  const [description, setDescription] = useState(initialData.description || "");

  // ── Venue hook ──
  const { venues, addVenue, updateVenue } = useVenues();
  const initialVenueRecord = initialData.venueId
    ? venues.find((v) => v.id === initialData.venueId)
    : undefined;
  const getSelectedVenue = () => {
    const typed = venue.trim().toLowerCase();
    if (!typed) return null;
    return (
      venues.find(
        (v) => v.name.trim().toLowerCase() === typed
      ) ?? null
    );
  };
  const initialVenueName = initialVenueRecord?.name ?? "";
  const venueUsage = useMemo(() => {
    return venues.reduce((acc, venue) => {
      acc[venue.id] = people.filter((p) => p.venueId === venue.id).length;
      return acc;
    }, {} as Record<string, number>);
  }, [venues, people]);
  const {
    value: venue,
    touched: venueTouched,
    suggestions: venueSuggestions,
    onChange: onVenueChange,
    onSelect: onVenueSelect,
    resolveVenue,
  } = useVenueInput({
    initialName: initialVenueName,
    venues,
    addVenue,
    mode,
    venueUsage,
  });

  // ── Form validation ──
  const [touchedName, setTouchedName] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [venuePulse, setVenuePulse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    return () => {
      onSubmittingChange?.(false);
    };
  }, [onSubmittingChange]);

  useEffect(() => {
    if (!venuePulse) return;
    const id = window.setTimeout(() => setVenuePulse(null), 250);
    return () => window.clearTimeout(id);
  }, [venuePulse]);

  // ── Tag hook ──
  const {
    tags: currentTags,
    input: currentInput,
    suggestions,
    highlightedIndex,
    error,
    liveMsg,
    handlers: {
      onInputChange,
      onInputKeyDown,
      onInputBlur,
      commit: commitTag,
      remove: removeTag,
      resetInput,
      clearInput,
    },
  } = useTagInput({
    initialTags:
      mode === "edit" && initialData.tags
        ? (initialData.tags as string[]).map((id) =>
            getTagNameById(id).trim().toLowerCase()
          )
        : [],
    allTags: tags,
  });
  const [tagPulse, setTagPulse] = useState<string | null>(null);

  useEffect(() => {
    if (!tagPulse) return;
    const id = window.setTimeout(() => setTagPulse(null), 250);
    return () => window.clearTimeout(id);
  }, [tagPulse]);

  const handleTagBlur = () => {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    // only commit if there’s something left uncommitted
    if (currentInput.trim()) {
      commitTag(currentInput);
    }
    // and clear the input & suggestions
    onInputChange({ target: { value: '' } } as any);
    onInputBlur();
  };  

  // ── Date, coords, locationTag ──
  const today = new Date().toISOString().split("T")[0];
  const [dateMet, setDateMet] = useState(
    initialData.dateMet ? initialData.dateMet.split("T")[0] : today
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    initialVenueRecord?.coords ?? null
  );
  const [manualLat, setManualLat] = useState(
    initialVenueRecord?.coords ? initialVenueRecord.coords.lat.toFixed(4) : ""
  );
  const [manualLon, setManualLon] = useState(
    initialVenueRecord?.coords ? initialVenueRecord.coords.lon.toFixed(4) : ""
  );
  const [locationTag, setLocationTag] = useState<string>(
    initialVenueRecord?.locationTag ?? ""
  );
  const [recentlyAttached, setRecentlyAttached] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  useEffect(() => {
    if (!recentlyAttached) return;
    const timer = window.setTimeout(() => setRecentlyAttached(false), 1500);
    return () => window.clearTimeout(timer);
  }, [recentlyAttached]);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSavingVenueLocation, setIsSavingVenueLocation] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState<string | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceVenue, setReplaceVenue] = useState<Venue | null>(null);
  const [pendingReplaceAction, setPendingReplaceAction] = useState<(() => Promise<void>) | null>(null);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<
    { name: string; address: string; lat: number; lng: number }[]
  >([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  useEffect(() => {
    if (coords && !Number.isNaN(coords.lat) && !Number.isNaN(coords.lon)) {
      const latString = coords.lat.toFixed(4);
      const lonString = coords.lon.toFixed(4);
      setManualLat(latString);
      setManualLon(lonString);
      setLocationTag((prev) => prev || `${latString}, ${lonString}`);
    }
  }, [coords]);

  // Hydrate previously saved location data when an existing venue is selected.
  useEffect(() => {
    const typed = venue.trim();
    if (!typed) {
      setCoords(null);
      setLocationTag("");
      setMapSnapshot(null);
      setSnapshotError(null);
      return;
    }
    const existing = venues.find(
      (v) => v.name.trim().toLowerCase() === typed.toLowerCase()
    );
    if (!existing) {
      if (coords) {
        setCoords(null);
      }
      setLocationTag("");
      setMapSnapshot(null);
      setSnapshotError(null);
      return;
    }
    if (!existing.coords) {
      return;
    }
    const sameCoords =
      coords &&
      Math.abs(coords.lat - existing.coords.lat) < 0.000001 &&
      Math.abs(coords.lon - existing.coords.lon) < 0.000001;
    if (!sameCoords) {
      setCoords({ lat: existing.coords.lat, lon: existing.coords.lon });
    }
    if (existing.locationTag && existing.locationTag !== locationTag) {
      setLocationTag(existing.locationTag);
    }
  }, [venue, venues, coords, locationTag]);
  const updateCoordsFromManual = (latStr: string, lonStr: string) => {
    const latVal = parseFloat(latStr);
    const lonVal = parseFloat(lonStr);
    if (
      !latStr ||
      !lonStr ||
      Number.isNaN(latVal) ||
      Number.isNaN(lonVal)
    ) {
      setCoords(null);
      setLocationTag("");
      return;
    }
    setCoords({ lat: latVal, lon: lonVal });
    setLocationTag(`${latVal.toFixed(4)}, ${lonVal.toFixed(4)}`);
  };

  useEffect(() => {
    let cancelled = false;

    if (!coords) {
      setMapSnapshot(null);
      setSnapshotError(null);
      setIsSnapshotLoading(false);
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      setMapSnapshot(null);
      setSnapshotError("Preview available on device");
      return;
    }

    const fetchSnapshot = async () => {
      try {
        setIsSnapshotLoading(true);
        const result = await MapKitBridge.getSnapshot({
          lat: coords.lat,
          lng: coords.lon,
          width: 640,
          height: 288,
          spanMeters: 800,
        });
        if (!cancelled) {
          const newLabel = result.address || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
          setMapSnapshot(`data:image/png;base64,${result.imageData}`);
          setSnapshotError(null);
          if (newLabel !== locationTag) {
            setLocationTag(newLabel);
            await autoAttachVenue(coords, newLabel, { silent: true });
          }
        }
      } catch (error) {
        console.warn("Map snapshot error", error);
        if (!cancelled) {
          setMapSnapshot(null);
          setSnapshotError("Preview unavailable");
        }
      } finally {
        if (!cancelled) {
          setIsSnapshotLoading(false);
        }
      }
    };

    fetchSnapshot();

    return () => {
      cancelled = true;
    };
  }, [coords, locationTag, venue]);

  useEffect(() => {
    if (!showPlaceSearch) {
      setPlaceQuery("");
      setPlaceResults([]);
      setPlaceLoading(false);
      setPlaceError(null);
      return;
    }
    const trimmed = placeQuery.trim();
    if (trimmed.length < 2 || !Capacitor.isNativePlatform()) {
      setPlaceResults([]);
      setPlaceLoading(false);
      return;
    }
    let cancelled = false;
    const handler = window.setTimeout(async () => {
      try {
        setPlaceLoading(true);
        setPlaceError(null);
        const { results } = await MapKitBridge.searchPlaces({
          query: trimmed,
          near: coords ? { lat: coords.lat, lng: coords.lon } : undefined,
        });
        if (!cancelled) {
          setPlaceResults(results);
        }
      } catch (error) {
        console.warn("Place search error", error);
        if (!cancelled) {
          setPlaceError("Couldn't search right now");
        }
      } finally {
        if (!cancelled) {
          setPlaceLoading(false);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handler);
    };
  }, [placeQuery, showPlaceSearch, coords]);

  const getCurrentCoordinates = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Geolocation.requestPermissions();
      }
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
      });
      return {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
    } catch (nativeError) {
      console.warn("Native geolocation error", nativeError);
    }
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported on this device.");
    }
    return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => reject(err),
        { enableHighAccuracy: true }
      );
    });
  };

  const runCurrentCapture = async () => {
    try {
      setIsCapturingLocation(true);
      const { lat, lon } = await getCurrentCoordinates();
      setCoords({ lat, lon });
      const autoLabel = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      setLocationTag((prev) => prev || autoLabel);
      await autoAttachVenue({ lat, lon }, locationTag || autoLabel);
      showNotification("Location captured", "info");
    } catch (error: any) {
      console.warn("Location capture error", error);
      const message =
        (typeof error?.message === "string" && error.message) ||
        "Couldn't access your location.";
      showNotification(message, "error");
    } finally {
      setIsCapturingLocation(false);
    }
  };

  const captureCurrentLocation = async () => {
    if (maybeConfirmReplace(runCurrentCapture)) {
      return;
    }
    await runCurrentCapture();
  };

  const runPlaceAttach = (place: { name: string; address: string; lat: number; lng: number }) => async () => {
    const coordsPayload = { lat: place.lat, lon: place.lng };
    setCoords(coordsPayload);
    setLocationTag(place.address);
    await autoAttachVenue(coordsPayload, place.address);
    showNotification(`Location set to ${place.name}`, "info");
  };

  const handlePlaceSelect = (place: { name: string; address: string; lat: number; lng: number }) => {
    setShowPlaceSearch(false);
    setPlaceQuery("");
    setPlaceResults([]);
    if (maybeConfirmReplace(runPlaceAttach(place))) {
      return;
    }
    runPlaceAttach(place)();
  };

  const autoAttachVenue = async (
    coordinates: { lat: number; lon: number },
    label: string,
    options?: { silent?: boolean }
  ) => {
    let selectedVenue = getSelectedVenue();
    if (!selectedVenue) {
      selectedVenue = resolveVenue();
    }
    try {
      setIsSavingVenueLocation(true);
      updateVenue({
        ...selectedVenue,
        coords: { lat: coordinates.lat, lon: coordinates.lon },
        locationTag: label,
      });
      setLocationTag(label);
      if (!options?.silent) {
        setRecentlyAttached(true);
        showNotification(`Location saved to ${selectedVenue.name}`, "success");
      }
    } catch (err) {
      console.warn("Venue attach error", err);
      setAttachError("Couldn't save the pin. Try again?");
      showNotification("Unable to update venue location.", "error");
    } finally {
      setIsSavingVenueLocation(false);
    }
  };

  const handleReplaceConfirm = async () => {
    setShowReplaceModal(false);
    setReplaceVenue(null);
    const action = pendingReplaceAction;
    setPendingReplaceAction(null);
    if (action) {
      await action();
    }
  };

  const handleReplaceCancel = () => {
    setShowReplaceModal(false);
    setReplaceVenue(null);
    setPendingReplaceAction(null);
  };

  const maybeConfirmReplace = (action: () => Promise<void>): boolean => {
    const venueRecord = getSelectedVenue();
    if (venueRecord?.coords) {
      setReplaceVenue(venueRecord);
      setPendingReplaceAction(() => action);
      setShowReplaceModal(true);
      return true;
    }
    return false;
  };

  // ── Prevent blur on suggestion click ──
  const ignoreBlurRef = useRef(false);

  // ── Submit handler ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    // Name required
    if (!name.trim()) {
      triggerImpact(ImpactStyle.Heavy);
      setTouchedName(true);
      return;
    }
    // Validate other fields
    const normalizedDate = dateMet || today;
    const { isValid, errors } = validatePersonForm({
      name,
      dateMet: normalizedDate,
      venue,
      tags: currentTags,
      position,
      description,
      latitude: manualLat,
      longitude: manualLon,
    });
    if (!isValid) {
      triggerImpact(ImpactStyle.Heavy);
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    if (!dateMet) {
      setDateMet(normalizedDate);
    }
    setFormErrors({});

    // Commit any leftover tag
    const leftover = currentInput.trim();
    if (leftover) commitTag(leftover);

    // Resolve tags to IDs
    const tagIds = currentTags.map((tagName) => {
      const existing = getTagIdByName(tagName);
      return existing ?? createTag(tagName).id;
    });

    const now = new Date().toISOString();

    // Resolve venue via hook
    const matchedVenue = resolveVenue();

  const person: Person = {
      id: (initialData.id as string) || uuidv4(),
      name: name.trim(),
      position: position.trim() || undefined,
      venueId: matchedVenue.id,
      description: description.trim() || undefined,
      dateMet: normalizedDate,
      createdAt: mode === "add" ? now : initialData.createdAt!,
      updatedAt: mode === "edit" ? now : undefined,
      tags: tagIds,
      favorite: initialData.favorite ?? false,
    };

    setIsSubmitting(true);
    onSubmittingChange?.(true);
    try {
      onSubmit(person);
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-2";
  const inputShell = "w-full max-w-md";
  const inputClass =
    "w-full px-3 py-2 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-level1";

  const useOverflowIndicator = (deps: React.DependencyList) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const measure = () => {
        const overflow = el.scrollWidth - el.clientWidth > 4;
        setHasOverflow(overflow);
        if (overflow) {
          setShowHint(true);
        }
      };
      measure();
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      };
    }, deps);

    useEffect(() => {
      if (!hasOverflow) return;
      const timer = window.setTimeout(() => setShowHint(false), 700);
      return () => window.clearTimeout(timer);
    }, [hasOverflow]);

    return { ref, hasOverflow, showHint } as const;
  };

  const venueRail = useOverflowIndicator([venueSuggestions.length]);
  const appliedTagsRail = useOverflowIndicator([currentTags.length]);
  const suggestionRail = useOverflowIndicator([suggestions.length, currentInput]);
  const canUseLocation = Boolean(venue.trim());

  useEffect(() => {
    if (!showPlaceSearch) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPlaceSearch]);

  return (
    <>
    <form id="person-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClass}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          className={`${inputClass} ${touchedName && !name.trim() ? "border-red-400" : ""}`}
          required
        />
        {touchedName && !name.trim() && (
          <p className="text-red-500 text-xs mt-1">Name is required</p>
        )}
      </div>

      {/* Date Met */}
      <div>
        <label htmlFor="date-met" className={labelClass}>
          Date Met <span className="text-red-500">*</span>
        </label>
        <input
          id="date-met"
          type="date"
          value={dateMet}
          onChange={(e) => setDateMet(e.target.value)}
          className={`${inputClass} ${formErrors.dateMet ? "border-red-400" : ""}`}
          required
          max={today}
        />
        {formErrors.dateMet && (
          <p className="text-red-500 text-xs mt-1">{formErrors.dateMet}</p>
        )}
      </div>

      {/* Position */}
      <div>
        <label htmlFor="position" className={labelClass}>
          Position / Role
        </label>
        <input
          id="position"
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={inputClass}
        />
        {formErrors.position && (
          <p className="text-red-500 text-xs mt-1">{formErrors.position}</p>
        )}
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue" className={labelClass}>
          Venue (optional)
        </label>
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">
          Name or select the venue to enable location tools.
        </p>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={(e) => onVenueChange(e.target.value)}
          className={inputClass}
        />
        {venueTouched && venue.length > 50 && (
          <p className="text-red-500 text-xs mt-1">Venue name is too long</p>
        )}
        {formErrors.venue && (
          <p className="text-red-500 text-xs mt-1">{formErrors.venue}</p>
        )}
      </div>
      {venueSuggestions.length > 0 && (
        <div className="mt-1.5 mb-1 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Suggested venues</p>
          <div
            ref={venueRail.ref}
            className="relative overflow-x-auto whitespace-nowrap gap-2 px-1 pb-1.5 pr-10 tag-suggestion-rail"
            style={{ scrollbarGutter: "stable", WebkitOverflowScrolling: "touch" }}
          >
            {venueSuggestions.map((name) => {
              const pulsing = venuePulse === name;
              return (
                <motion.button
                  key={name}
                  type="button"
                  className="inline-block mr-3 px-3 py-1 rounded-full text-sm bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border border-[var(--color-accent-muted)] hover:bg-[var(--color-accent-muted)]/80"
                  onPointerDown={() => {
                    ignoreBlurRef.current = true;
                  }}
                  onClick={async () => {
                    await triggerImpact(ImpactStyle.Light);
                    onVenueSelect(name);
                    setVenuePulse(name);
                    ignoreBlurRef.current = false;
                  }}
                  animate={
                    pulsing
                      ? {
                          scale: [0.94, 1.05, 1],
                          boxShadow: [
                            "0 0 0 rgba(0,0,0,0)",
                            "0 10px 20px rgba(15,23,42,0.15)",
                            "0 0 0 rgba(0,0,0,0)",
                          ],
                        }
                      : {
                          scale: 1,
                          boxShadow: "0 0 0 rgba(0,0,0,0)",
                        }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onAnimationComplete={() => {
                    if (pulsing) setVenuePulse(null);
                  }}
                >
                  {name}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Location section */}
      <AnimatePresence mode="wait" initial={false}>
        {canUseLocation ? (
          <motion.section
            key="location-section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-1.5 space-y-4"
          >
            <div>
              <p className={labelClass.replace("mb-2", "")}>Location (optional)</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Add a map pin for this venue (optional).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={captureCurrentLocation}
                disabled={isCapturingLocation}
                className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:brightness-110 disabled:opacity-60"
              >
                {isCapturingLocation ? "Capturing…" : "Use current location"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!Capacitor.isNativePlatform()) {
                    showNotification("Search is available on device only.", "info");
                    return;
                  }
                  setShowPlaceSearch(true);
                }}
                className="rounded-full border border-white/40 bg-[var(--color-card)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              >
                Search for a place
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {coords ? (
                <motion.div
                  key="map-card"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-4 rounded-[30px] border border-[var(--color-card-border)] bg-[var(--color-card)]/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.15)]"
                >
                  <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[var(--color-card)]/60">
                    <img
                      src={mapSnapshot ?? mapPreviewPlaceholder}
                      alt="Map preview"
                      className="h-48 w-full object-cover transition-opacity"
                    />
                    {!mapSnapshot && coords && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                          <div className="h-6 w-6 rounded-full bg-[var(--color-accent)] shadow-lg" />
                        </div>
                      </div>
                    )}
                    {isSnapshotLoading && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-card)]/50 text-xs font-semibold text-[var(--color-text-secondary)]">
                        Generating preview…
                      </div>
                    )}
                    {coords && venue.trim() && (recentlyAttached || attachError) && (
                      recentlyAttached && !attachError ? (
                        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[var(--color-card)]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-primary)]">
                          Saved to “{venue.trim()}”
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => autoAttachVenue(coords, locationTag || venue.trim())}
                          className="absolute left-3 top-3 rounded-full bg-red-600/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                        >
                          Retry pin save
                        </button>
                      )
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[var(--color-text-primary)]">
                      {venue.trim() || "The Broadview Rooftop"}
                    </p>
                    {coords && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {locationTag || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const text =
                          locationTag?.trim() || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
                        navigator.clipboard
                          ?.writeText(text)
                          .then(() => showNotification("Coordinates copied", "info"))
                          .catch(() => showNotification("Unable to copy coordinates.", "error"));
                      }}
                      className="rounded-full border border-[var(--color-card-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                    >
                      Copy address
                    </button>
                    <button
                      type="button"
                      disabled={!coords}
                      onClick={() => {
                        if (coords) {
                          if (Capacitor.isNativePlatform()) {
                            window.open(`maps://?ll=${coords.lat},${coords.lon}`, "_blank");
                          } else {
                            window.open(`https://maps.google.com/?q=${coords.lat},${coords.lon}`, "_blank");
                          }
                        }
                      }}
                      className="rounded-full border border-[var(--color-card-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                    >
                      Open in Maps
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {formErrors.coords && <p className="text-red-500 text-xs">{formErrors.coords}</p>}
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} min-h-[120px]`}
          rows={3}
        />
        {formErrors.description && (
          <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className={labelClass}>
          Tags
        </label>
        <div
          role="list"
          ref={appliedTagsRail.ref}
          className="relative overflow-x-auto whitespace-nowrap mb-2 px-1 pb-4 pr-10"
          style={{ scrollbarGutter: "stable", WebkitOverflowScrolling: "touch" }}
        >
          {currentTags.length > 0 ? (
            currentTags.map((tagName) => (
              <button
                type="button"
                key={tagName}
                onClick={async () => {
                  await triggerImpact(ImpactStyle.Light);
                  removeTag(tagName);
                }}
                className="inline-flex items-center mr-3 bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] px-3 py-1 rounded-full text-sm hover:bg-[var(--color-accent-muted)]/80 transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                aria-label={`Remove tag ${tagName}`}
              >
                {tagName}
                <span className="ml-2 text-red-500 text-base">×</span>
              </button>
            ))
          ) : (
            <span className="inline-block mr-3 text-[var(--color-text-secondary)] text-sm italic">
              no tags added
            </span>
          )}
        </div>

        <input
          id="tag-input"
          type="text"
          placeholder="Add a tag"
          value={currentInput}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onBlur={handleTagBlur} 
          autoComplete="off"
          className={inputClass}
        />
        <div className="text-xs text-[var(--color-text-secondary)] text-right mt-1">{currentInput.length} / 25</div>
        <div className="mt-3 space-y-1">
          {suggestions.length > 0 && (
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Suggested tags</p>
          )}
          <div
            ref={suggestionRail.ref}
            className="relative overflow-x-auto whitespace-nowrap px-3 pb-3 pr-12 tag-suggestion-rail"
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ scrollbarGutter: "stable", WebkitOverflowScrolling: "touch" }}
          >
            {suggestions.map((tag, idx) => {
              const pulsing = tagPulse === tag.id;
              return (
                <motion.button
                  key={tag.id}
                  type="button"
                  onPointerDown={() => {
                    ignoreBlurRef.current = true;
                  }}
                  onClick={async () => {
                    await triggerImpact(ImpactStyle.Light);
                    commitTag(tag.name);
                    clearInput();
                    setTagPulse(tag.id);
                  }}
                  className={`inline-block mr-3 px-3 py-1 rounded-full text-sm bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border border-[var(--color-accent-muted)] hover:bg-[var(--color-accent-muted)]/80 ${
                    idx === highlightedIndex ? "ring-2 ring-[var(--color-accent)]" : ""
                  }`}
                  animate={
                    pulsing
                      ? {
                          scale: [0.94, 1.05, 1],
                          boxShadow: [
                            "0 0 0 rgba(0,0,0,0)",
                            "0 10px 20px rgba(15,23,42,0.15)",
                            "0 0 0 rgba(0,0,0,0)",
                          ],
                        }
                      : {
                          scale: 1,
                          boxShadow: "0 0 0 rgba(0,0,0,0)",
                        }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onAnimationComplete={() => {
                    if (pulsing) setTagPulse(null);
                  }}
                >
                  {tag.name}
                </motion.button>
              );
            })}
            {(() => {
              const pendingTag = currentInput
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9-\s]/g, "")
                .replace(/\s{2,}/g, " ");
              if (
                pendingTag &&
                !currentTags.includes(pendingTag) &&
                !tags.some((tag) => tag.name === pendingTag)
              ) {
                return (
                  <button
                    type="button"
                    onPointerDown={() => {
                      ignoreBlurRef.current = true;
                    }}
                    onClick={async () => {
                      await triggerImpact(ImpactStyle.Light);
                      commitTag(pendingTag);
                      clearInput();
                    }}
                    className="inline-block mr-3 px-3 py-1 rounded-full text-sm border border-dashed border-[var(--color-accent)] text-[var(--color-accent)] bg-white/70 hover:bg-white"
                  >
                    Create “{pendingTag}”
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </div>
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        {liveMsg && <div className="text-sm text-[var(--color-text-secondary)] mt-1">{liveMsg}</div>}
        {formErrors.tags && (
          <p className="text-red-500 text-xs mt-1">{formErrors.tags}</p>
        )}
      </div>

      {/* only show these when not in a modal wrapper */}
      {!hideActions && (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className={`flex-1 py-2 rounded-full text-white text-center font-semibold transition ${
              name.trim()
                ? "bg-[var(--color-accent)] hover:brightness-110 shadow"
                : "bg-[var(--color-accent-muted)]/50 text-[var(--color-text-secondary)]/70 cursor-not-allowed"
            }`}
          >
            Save
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-white/70 rounded-full text-sm text-[var(--color-text-secondary)] hover:bg-white transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
    {showReplaceModal && replaceVenue && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-sm rounded-[32px] bg-[var(--color-card)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)] text-center space-y-4"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Replace saved pin?
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              “{replaceVenue.name}” already has a location. Replacing it will update the pin for everyone linked to this venue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleReplaceCancel}
              className="rounded-full border border-[var(--color-card-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/80"
            >
              Keep existing
            </button>
            <button
              type="button"
              onClick={handleReplaceConfirm}
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.25)] hover:brightness-110"
            >
              Replace location
            </button>
          </div>
        </div>
      </div>
    )}
    {showPlaceSearch && (
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none bg-[var(--color-card)]/50 backdrop-blur-md">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto w-[min(80vw,380px)] rounded-[30px] bg-white p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)] space-y-4 max-h-[80vh] flex flex-col border border-black/5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Search for a place
            </p>
            <button
              type="button"
              onClick={() => setShowPlaceSearch(false)}
              className="text-lg font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
            >
              ×
            </button>
          </div>
          <div className="rounded-[26px] border border-black/10 bg-white px-4 py-2 flex items-center gap-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
            <span className="text-[var(--color-text-secondary)]">⌕</span>
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              placeholder="Search (e.g. Bar Raval)"
              className="flex-1 bg-transparent text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]"
              autoFocus
            />
          </div>
          <div className="max-h-[55vh] overflow-y-auto pr-1 flex-1 bg-white rounded-[20px] px-2 py-2 space-y-1">
            {placeLoading && (
              <p className="text-xs text-[var(--color-text-secondary)] px-1">Searching…</p>
            )}
            {placeError && (
              <p className="text-xs text-red-500 px-1">{placeError}</p>
            )}
            {!placeLoading && !placeError && placeResults.length === 0 && placeQuery.trim().length >= 2 && (
              <p className="text-xs text-[var(--color-text-secondary)] px-1">No matches found.</p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
