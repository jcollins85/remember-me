import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
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
  const showLocationControls = true;
  const { showNotification } = useNotification();
  // ── Basic fields ──
  const [name, setName] = useState(initialData.name || "");
  const [position, setPosition] = useState(initialData.position || "");
  const [description, setDescription] = useState(initialData.description || "");

  // ── Venue hook ──
  const { venues, addVenue, updateVenue } = useVenues();
  const initialVenueName =
    initialData.venueId
      ? venues.find((v) => v.id === initialData.venueId)?.name || ""
      : "";
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
    initialData.coords ?? null
  );
  const [manualLat, setManualLat] = useState(
    initialData.coords ? initialData.coords.lat.toFixed(4) : ""
  );
  const [manualLon, setManualLon] = useState(
    initialData.coords ? initialData.coords.lon.toFixed(4) : ""
  );
  const [locationTag, setLocationTag] = useState<string>(
    initialData.locationTag ?? ""
  );
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isSavingVenueLocation, setIsSavingVenueLocation] = useState(false);
  useEffect(() => {
    if (coords && !Number.isNaN(coords.lat) && !Number.isNaN(coords.lon)) {
      const latString = coords.lat.toFixed(4);
      const lonString = coords.lon.toFixed(4);
      setManualLat(latString);
      setManualLon(lonString);
      setLocationTag(`${latString}, ${lonString}`);
    }
  }, [coords]);
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

  const captureCurrentLocation = async () => {
    try {
      setIsCapturingLocation(true);
      const { lat, lon } = await getCurrentCoordinates();
      setCoords({ lat, lon });
      setLocationTag(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
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

  const applyLocationToVenue = async () => {
    if (!coords) {
      showNotification("Capture a location first.", "error");
      return;
    }
    const trimmedVenue = venue.trim().toLowerCase();
    if (!trimmedVenue) {
      showNotification("Select a venue to attach this location.", "error");
      return;
    }
    const matchedVenue = venues.find(
      (v) => v.name.trim().toLowerCase() === trimmedVenue
    );
    if (!matchedVenue) {
      showNotification("Location can only be attached to existing venues.", "error");
      return;
    }
    try {
      setIsSavingVenueLocation(true);
      updateVenue({
        ...matchedVenue,
        coords: { lat: coords.lat, lon: coords.lon },
      });
      showNotification(`Location saved to ${matchedVenue.name}`, "success");
    } catch {
      showNotification("Unable to update venue location.", "error");
    } finally {
      setIsSavingVenueLocation(false);
    }
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
      locationTag: locationTag || undefined,
      coords: coords ?? undefined,
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

  return (
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
        <div className="mt-2 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">Suggested venues</p>
          <div
            ref={venueRail.ref}
            className="relative overflow-x-auto whitespace-nowrap gap-2 px-1 pb-3 pr-10 tag-suggestion-rail"
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
      {showLocationControls && (
        <div className="mt-4 space-y-3 rounded-2xl bg-[var(--color-card)]/70 px-4 py-3">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Capture a meeting location and attach it to this venue.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={captureCurrentLocation}
              disabled={isCapturingLocation}
              className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-xs font-semibold shadow hover:brightness-110 transition disabled:opacity-60"
            >
              {isCapturingLocation ? "Capturing…" : "Use current location"}
            </button>
            {coords && (
              <>
                <div className="text-sm text-[var(--color-text-secondary)]">{locationTag}</div>
                <button
                  type="button"
                  onClick={() => {
                    if (coords) {
                      navigator.clipboard
                        ?.writeText(`${coords.lat}, ${coords.lon}`)
                        .then(() => showNotification("Coordinates copied", "info"))
                        .catch(() => showNotification("Unable to copy coordinates.", "error"));
                    }
                  }}
                  className="px-2 py-1 rounded-full border border-white/70 text-xs hover:bg-white"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (coords) {
                      window.open(`https://maps.google.com/?q=${coords.lat},${coords.lon}`, "_blank");
                    }
                  }}
                  className="px-2 py-1 rounded-full border border-white/70 text-xs hover:bg-white"
                >
                  Open in Maps
                </button>
              </>
            )}
          </div>
          {coords && venue.trim() && (
            <button
              type="button"
              onClick={applyLocationToVenue}
              disabled={isSavingVenueLocation}
              className="px-4 py-2 rounded-full border border-[var(--color-card-border)] bg-[var(--color-card)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/90 transition disabled:opacity-50"
            >
              {isSavingVenueLocation ? "Saving…" : `Attach to "${venue}"`}
            </button>
          )}
          {formErrors.coords && <p className="text-red-500 text-xs">{formErrors.coords}</p>}
        </div>
      )}

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
  );
}
