import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVenues } from "../../context/VenueContext";
import { UNCLASSIFIED } from "../../constants";
import { Person, Tag, Venue } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { useTagInput } from "../../hooks/useTagInput";
import { useVenueInput } from "../../hooks/useVenueInput";
import { validatePersonForm, ValidationErrors } from "../../utils/validation";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";
import { useAnalytics } from "../../context/AnalyticsContext";
import LocationSection from "./LocationSection";

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
  globalProximityEnabled: boolean;
  onEnableGlobalProximity: () => void;
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
  globalProximityEnabled,
  onEnableGlobalProximity,
}: Props) {
  const { trackEvent } = useAnalytics();
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
  const [pendingLocation, setPendingLocation] = useState<{
    coords: { lat: number; lon: number } | null;
    locationTag: string;
    proximityEnabled: boolean;
  } | null>(null);
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

  const applyTag = (tagName: string, source: "input" | "suggestion" | "create" | "submit") => {
    commitTag(tagName);
    trackEvent("tag_applied", { source });
  };

  const handleTagBlur = () => {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    // only commit if there’s something left uncommitted
    if (currentInput.trim()) {
      applyTag(currentInput, "input");
    }
    // and clear the input & suggestions
    onInputChange({ target: { value: '' } } as any);
    onInputBlur();
  };  

  // ── Date & location metadata (validation only) ──
  const today = new Date().toISOString().split("T")[0];
  const [dateMet, setDateMet] = useState(
    initialData.dateMet ? initialData.dateMet.split("T")[0] : today
  );
  const [locationValidationCoords, setLocationValidationCoords] = useState<{
    lat: string;
    lon: string;
  } | null>(() => {
    if (initialVenueRecord?.coords) {
      return {
        lat: initialVenueRecord.coords.lat.toFixed(4),
        lon: initialVenueRecord.coords.lon.toFixed(4),
      };
    }
    return null;
  });



  // ── Prevent blur on suggestion click ──
  const ignoreBlurRef = useRef(false);

  // ── Submit handler ──
  const persistLocationForVenue = (venueRecord: Venue) => {
    if (!pendingLocation) return;
    const { coords, locationTag: pendingTag, proximityEnabled } = pendingLocation;
    const currentTag = venueRecord.locationTag ?? "";
    const targetTag = pendingTag || currentTag;
    const currentProximity = venueRecord.proximityAlertsEnabled !== false;
    const needsCoords =
      coords &&
      (!venueRecord.coords ||
        Math.abs(venueRecord.coords.lat - coords.lat) > 0.000001 ||
        Math.abs(venueRecord.coords.lon - coords.lon) > 0.000001);
    const needsTag = pendingTag && pendingTag !== currentTag;
    const needsProximity = proximityEnabled !== currentProximity;
    if (!needsCoords && !needsTag && !needsProximity) return;
    updateVenue({
      ...venueRecord,
      coords: coords ?? venueRecord.coords,
      locationTag: targetTag,
      proximityAlertsEnabled: proximityEnabled,
    });
    setPendingLocation(null);
  };

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
      latitude: locationValidationCoords?.lat ?? "",
      longitude: locationValidationCoords?.lon ?? "",
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
    if (leftover) applyTag(leftover, "submit");

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
      persistLocationForVenue(matchedVenue);
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
          Venue Name
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
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Suggested venues</p>
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

      <LocationSection
        venueName={venue}
        canUseLocation={canUseLocation}
        labelClass={labelClass}
        formError={formErrors.coords}
        resolveVenue={resolveVenue}
        getSelectedVenue={getSelectedVenue}
        onValidationCoordsChange={setLocationValidationCoords}
        onPendingChange={setPendingLocation}
        globalProximityEnabled={globalProximityEnabled}
        onEnableGlobalProximity={onEnableGlobalProximity}
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description
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
                <span className="ml-1 h-3.5 w-3.5 text-red-500 text-sm leading-none inline-flex items-center justify-center">×</span>
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
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Suggested tags</p>
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
                    applyTag(tag.name, "suggestion");
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
                      applyTag(pendingTag, "create");
                      clearInput();
                      trackEvent("custom_tag_created");
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
    </>
  );
}
