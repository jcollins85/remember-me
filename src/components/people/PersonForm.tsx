import React, { useState, useEffect, useRef } from "react";
import { useVenues } from "../../context/VenueContext";
import { UNCLASSIFIED } from "../../constants";
import { Person, Tag, Venue } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { useTagInput } from "../../hooks/useTagInput";
import { useVenueInput } from "../../hooks/useVenueInput";
import { validatePersonForm, ValidationErrors } from "../../utils/validation";

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
}: Props) {
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
  });

  // ── Form validation ──
  const [touchedName, setTouchedName] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});

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
  const [locationTag, setLocationTag] = useState<string>(
    initialData.locationTag ?? ""
  );

  // ── Prevent blur on suggestion click ──
  const ignoreBlurRef = useRef(false);

  // ── Submit handler ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Name required
    if (!name.trim()) {
      setTouchedName(true);
      return;
    }
    // Validate other fields
    const { isValid, errors } = validatePersonForm({
      name,
      dateMet,
      venue,
      tags: currentTags,
    });
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

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
      dateMet,
      createdAt: mode === "add" ? now : initialData.createdAt!,
      updatedAt: mode === "edit" ? now : undefined,
      locationTag: locationTag || undefined,
      coords: coords ?? undefined,
      tags: tagIds,
      favorite: initialData.favorite ?? false,
    };

    onSubmit(person);
  };

  return (
    <form id="person-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouchedName(true)}
          className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
            touchedName && !name.trim() ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {touchedName && !name.trim() && (
          <p className="text-red-500 text-xs mt-1">Name is required</p>
        )}
      </div>

      {/* Date Met */}
      <div>
        <label htmlFor="date-met" className="block text-sm font-medium text-gray-700 mb-1">
          Date Met
        </label>
        <input
          id="date-met"
          type="date"
          value={dateMet}
          onChange={(e) => setDateMet(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
        {formErrors.dateMet && (
          <p className="text-red-500 text-xs mt-1">{formErrors.dateMet}</p>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) return alert('Geolocation not supported');
            navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude: lat, longitude: lon } = pos.coords;
              setCoords({ lat, lon });
              setLocationTag(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            });
          }}
          className="px-3 py-1 bg-emerald-500 text-white rounded text-sm"
        >
          Use Current Location
        </button>
        {coords && <span className="text-sm text-gray-600">{locationTag}</span>}
      </div>

      {/* Position */}
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
          Position / Role
        </label>
        <input
          id="position"
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
          Venue (optional)
        </label>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={(e) => onVenueChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
              className="inline-block mr-3 px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          rows={3}
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div role="list" className="overflow-x-auto whitespace-nowrap mb-2 px-1 pb-2">
          {currentTags.length > 0 ? (
            currentTags.map((tagName) => (
              <span key={tagName} className="inline-block mr-3 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm">
                {tagName}
                <button
                  type="button"
                  onClick={() => removeTag(tagName)}
                  className="ml-1 text-red-500 hover:underline"
                  aria-label={`Remove tag ${tagName}`}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="inline-block mr-3 text-gray-400 text-sm italic">
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
          className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <div className="text-xs text-gray-500 text-right mt-1">{currentInput.length} / 25</div>
        <div className="overflow-x-auto whitespace-nowrap mt-2 px-1 pb-2">
          {suggestions.map((tag, idx) => (
            <button
              key={tag.id}
              type="button"
              onPointerDown={() => {
                ignoreBlurRef.current = true;
              }}
              onClick={() => {
                commitTag(tag.name);
                resetInput(); 
              }}
              className={
                `inline-block mr-3 px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200${
                  idx === highlightedIndex ? ' ring-2 ring-emerald-600' : ''
                }`
              }
            >
              {tag.name}
            </button>
          ))}
        </div>
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        {liveMsg && <div className="text-sm text-gray-600 mt-1">{liveMsg}</div>}
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
            className={`flex-1 py-2 rounded-md text-white text-center transition ${
              name.trim() ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Save
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}
