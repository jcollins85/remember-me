import React, { useState, useEffect, useRef } from "react";
import { useVenues } from "../../context/VenueContext";
import { UNCLASSIFIED } from "../../constants";
import { Person, Tag, Venue } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { useTagInput } from "../../hooks/useTagInput";
import { useVenueInput } from "../../hooks/useVenueInput";
import { validatePersonForm, ValidationErrors } from "../../utils/validation";
import { useNotification } from "../../context/NotificationContext";

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
  const showLocationControls = false;
  const { showNotification } = useNotification();
  // ── Basic fields ──
  const [name, setName] = useState(initialData.name || "");
  const [position, setPosition] = useState(initialData.position || "");
  const [description, setDescription] = useState(initialData.description || "");

  // ── Venue hook ──
  const { venues, addVenue } = useVenues();
  const initialVenueName =
    initialData.venueId
      ? venues.find((v) => v.id === initialData.venueId)?.name || ""
      : "";
  const venueUsage = venues.reduce((acc, venue) => {
    acc[venue.id] = people.filter((p) => p.venueId === venue.id).length;
    return acc;
  }, {} as Record<string, number>);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    return () => {
      onSubmittingChange?.(false);
    };
  }, [onSubmittingChange]);

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

  // ── Prevent blur on suggestion click ──
  const ignoreBlurRef = useRef(false);

  // ── Submit handler ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    // Name required
    if (!name.trim()) {
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
  const inputClass =
    "w-full px-3 py-2 rounded-2xl border border-white/70 bg-white/90 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-level1";

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

      {/* Location */}
      {showLocationControls && (
      <div className="space-y-3">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Save where you met by capturing coordinates. You can tap to open them in Maps later.
        </p>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                showNotification("Geolocation not supported on this device.", "error");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude: lat, longitude: lon } = pos.coords;
                  setCoords({ lat, lon });
                  setLocationTag(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                  showNotification("Location captured", "success");
                },
                () => {
                  showNotification("Couldn't access your location.", "error");
                }
              );
            }}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-xs font-semibold shadow hover:brightness-110 transition"
          >
            Use current location
          </button>
          {coords && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span>{locationTag}</span>
              <button
                type="button"
                onClick={() => {
                  if (coords) {
                    navigator.clipboard
                      ?.writeText(`${coords.lat}, ${coords.lon}`)
                      .then(() => showNotification("Coordinates copied", "info"))
                      .catch(() =>
                        showNotification("Unable to copy coordinates.", "error")
                      );
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
                    window.open(`https://maps.google.com/?q=${coords.lat},${coords.lon}`, '_blank');
                  }
                }}
                className="px-2 py-1 rounded-full border border-white/70 text-xs hover:bg-white"
              >
                Open in Maps
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              type="number"
              step="0.0001"
              value={manualLat}
              onChange={(e) => {
                const value = e.target.value;
                setManualLat(value);
                updateCoordsFromManual(value, manualLon);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              type="number"
              step="0.0001"
              value={manualLon}
              onChange={(e) => {
                const value = e.target.value;
                setManualLon(value);
                updateCoordsFromManual(manualLat, value);
              }}
              className={inputClass}
            />
          </div>
        </div>
        {formErrors.coords && (
          <p className="text-red-500 text-xs">{formErrors.coords}</p>
        )}
      </div>
      )}

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
        <div className="overflow-x-auto whitespace-nowrap gap-2 mt-2 px-1 pb-2">
          {venueSuggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onVenueSelect(name)}
              className="inline-block mr-3 px-3 py-1 rounded-full text-sm bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border border-[var(--color-accent-muted)] hover:bg-[var(--color-accent-muted)]/80"
            >
              {name}
            </button>
          ))}
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
        <div role="list" className="overflow-x-auto whitespace-nowrap mb-2 px-1 pb-2">
          {currentTags.length > 0 ? (
            currentTags.map((tagName) => (
              <span key={tagName} className="inline-flex items-center mr-3 bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] px-3 py-1 rounded-full text-sm">
                {tagName}
                <button
                  type="button"
                  onClick={() => removeTag(tagName)}
                  className="ml-2 text-red-500 hover:text-red-600"
                  aria-label={`Remove tag ${tagName}`}
                >
                  ×
                </button>
              </span>
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
        <div
          className="overflow-x-auto whitespace-nowrap mt-3 px-3 pb-2"
          onWheel={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {suggestions.map((tag, idx) => (
            <button
              key={tag.id}
              type="button"
              onPointerDown={() => {
                ignoreBlurRef.current = true;
              }}
              onClick={() => {
                commitTag(tag.name);
                clearInput(); 
              }}
              className={`inline-block mr-3 px-3 py-1 rounded-full text-sm bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border border-[var(--color-accent-muted)] hover:bg-[var(--color-accent-muted)]/80 ${
                idx === highlightedIndex ? "ring-2 ring-[var(--color-accent)]" : ""
              }`}
            >
              {tag.name}
            </button>
          ))}
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
                  onClick={() => {
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
