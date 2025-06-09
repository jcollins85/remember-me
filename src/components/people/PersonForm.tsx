// PersonForm.tsx
import { useState, useEffect, useRef } from "react";
import { useVenues } from "../../context/VenueContext";
import { UNCLASSIFIED } from "../../constants";
import { Person, Tag, Venue } from "../../types";
import { v4 as uuidv4 } from "uuid";

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
}: Props) {
  // ── Basic person fields ──  
  const [name, setName] = useState(initialData.name || "");
  const [position, setPosition] = useState(initialData.position || "");  
  const [description, setDescription] = useState(initialData.description || "");
  const { venues, addVenue } = useVenues();
    const initialVenueName =
    initialData.venueId
        ? venues.find((v) => v.id === initialData.venueId)?.name || ""
        : "";
    const [venue, setVenue] = useState<string>(initialVenueName);  

  // ── Track if name/venue fields were touched for validation ──
  const [touchedName, setTouchedName] = useState(false);
  const [venueInputTouched, setVenueInputTouched] = useState(false);

  // ── Tag-related state ──
  const [currentTags, setCurrentTags] = useState<string[]>(() => {
    if (mode === "edit" && initialData.tags) {
      return (initialData.tags as string[]).map((id) =>
        getTagNameById(id).trim().toLowerCase()
      );
    }
    return [];
  });
  const [currentInput, setCurrentInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const typingTimeout = useRef<number | null>(null);

  // ── Venue-suggestion state ──
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);

  // ── Visual-feedback / error messages ──
  const [shakeInput, setShakeInput] = useState<boolean>(false);
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [liveMessage, setLiveMessage] = useState<string>("");

  const today = new Date().toISOString().split('T')[0];
    const [dateMet, setDateMet] = useState<string>(
    initialData.dateMet
        ? initialData.dateMet.split('T')[0]
        : today
    );

    const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    initialData.coords ?? null
    );
    const [locationTag, setLocationTag] = useState<string>(
    initialData.locationTag ?? ''
    );    

  // ── Prevent blur-commit when suggestion is clicked ──
  const ignoreBlurRef = useRef(false);

  // ── Limits ──
  const MAX_TAG_LENGTH = 25;
  const MAX_TAG_COUNT = 15;

  // ── Reset tag & name/venue state whenever opening in “add” mode ──
  useEffect(() => {
    if (mode === "add") {
      setCurrentTags([]);
      setCurrentInput("");
      setSuggestions([]);
      setVenue("");
      setVenueSuggestions([]);
      setErrorMessage("");
      setLiveMessage("");
      setActiveSuggestionIndex(null);
      setTouchedName(false);
      setVenueInputTouched(false);
    }
  }, [mode]);

    // ── Suggest from global VenueContext ──
    useEffect(() => {
    const names = venues.map((v) => v.name);
    const q = venue.trim().toLowerCase();
    setVenueSuggestions(
        q
        ? names.filter((n) => n.toLowerCase().includes(q)).slice(0, 5)
        : names.slice(0, 5)
    );
    }, [venue, venues]);

  // ── Clear the input on mount if editing ──
  useEffect(() => {
    if (mode === "edit" && initialData.tags) {
      setCurrentInput("");
      setActiveSuggestionIndex(null);
    }
  }, [initialData.tags, mode]);

  // ── Compute “usage count” for each tag ──
  const computeTagUsage = (): { tag: Tag; count: number }[] => {
    const usageMap: Record<string, number> = {};
    tags.forEach((t) => {
      usageMap[t.id] = t.count; // count stored in Tag
    });
    return tags
      .map((t) => ({ tag: t, count: t.count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.tag.lastUsed - a.tag.lastUsed;
      });
  };

  // ── Debounced update of tag suggestions based on currentInput ──
  useEffect(() => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      const typedLower = currentInput.trim().toLowerCase();
      const usageArray = computeTagUsage();

      if (typedLower.length === 0) {
        const topFive = usageArray.slice(0, 5).map((u) => u.tag);
        setSuggestions(topFive);
      } else {
        const matches = usageArray
          .filter((u) => u.tag.name.includes(typedLower))
          .slice(0, 5)
          .map((u) => u.tag);
        setSuggestions(matches);
      }
      setActiveSuggestionIndex(null);
    }, 200);

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [currentInput, tags]);

  // ── Sanitizer (lowercase, allow letters, digits, dashes, spaces) ──
  const sanitizeTagName = (raw: string): string => {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, "")
      .replace(/\s{2,}/g, " ");
  };

  // ── Try to commit a tag; handle empty, too-long, duplicate, or count limits ──
  const commitTag = (raw: string) => {
    const sanitized = sanitizeTagName(raw);
    if (!sanitized) {
      setErrorMessage("");
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 300);
      return;
    }
    if (sanitized.length > MAX_TAG_LENGTH) {
      setErrorMessage(`Tag must be ${MAX_TAG_LENGTH} characters or fewer`);
      setShakeInput(true);
      setTimeout(() => {
        setShakeInput(false);
        setErrorMessage("");
      }, 1000);
      return;
    }
    if (currentTags.includes(sanitized)) {
      setHighlightedTag(sanitized);
      setLiveMessage(`Tag “${sanitized}” already added`);
      setTimeout(() => {
        setHighlightedTag(null);
        setLiveMessage("");
      }, 500);
      return;
    }
    if (currentTags.length >= MAX_TAG_COUNT) {
      setErrorMessage(`Maximum of ${MAX_TAG_COUNT} tags reached`);
      setTimeout(() => setErrorMessage(""), 1500);
      return;
    }
    setCurrentTags((prev) => {
      const updated = [...prev, sanitized];
      setLiveMessage(`Tag “${sanitized}” added`);
      setTimeout(() => setLiveMessage(""), 1000);
      return updated;
    });
  };

  // ── Called when user clicks a tag suggestion pill ──
  const addTagFromSuggestion = (tagName: string) => {
    ignoreBlurRef.current = true;
    commitTag(tagName);
    setCurrentInput("");
    setActiveSuggestionIndex(null);
  };

  // ── Called on tag input change; if a comma appears, split & commit tokens ──
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue.includes(",")) {
      const parts = rawValue.split(",");
      const toCommit = parts.slice(0, -1);
      toCommit.forEach((segment) => commitTag(segment));
      setCurrentInput(parts[parts.length - 1]);
    } else {
      setCurrentInput(rawValue);
    }
  };

  // ── Handle arrow keys + Enter + Escape in the tag input ──
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = suggestions.length;
    if (e.key === "ArrowDown" && count > 0) {
      e.preventDefault();
      setActiveSuggestionIndex((idx) =>
        idx === null ? 0 : (idx + 1) % count
      );
      return;
    }
    if (e.key === "ArrowUp" && count > 0) {
      e.preventDefault();
      setActiveSuggestionIndex((idx) =>
        idx === null ? count - 1 : (idx - 1 + count) % count
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex !== null && suggestions[activeSuggestionIndex]) {
        const selected = suggestions[activeSuggestionIndex].name;
        commitTag(selected);
        setCurrentInput("");
        setActiveSuggestionIndex(null);
      } else {
        commitTag(currentInput);
        setCurrentInput("");
        setActiveSuggestionIndex(null);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setCurrentInput("");
      setActiveSuggestionIndex(null);
      setSuggestions([]);
    }
  };

  // ── Commit tag when input loses focus (“Done” on mobile) ──
  const handleTagBlur = () => {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    if (currentInput.trim()) {
      commitTag(currentInput);
      setCurrentInput("");
    }
    setActiveSuggestionIndex(null);
  };

  // ── Remove a committed tag pill ──
  const removeCommittedTag = (tagName: string) => {
    setCurrentTags((prev) => {
      const updated = prev.filter((t) => t !== tagName);
      setLiveMessage(`Tag “${tagName}” removed`);
      setTimeout(() => setLiveMessage(""), 1000);
      return updated;
    });
  };

  // ── On form submit: commit leftover tag, dedupe, then build Person object ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setTouchedName(true);
      return;
    }

    const leftoverRaw = currentInput.trim();
    if (leftoverRaw) {
      commitTag(leftoverRaw);
    }

    const allNames = [...currentTags];
    const uniqueNames = Array.from(new Set(allNames.filter((t) => t.length > 0)));

    const tagIds = uniqueNames.map((tagName) => {
      const existing = getTagByName(tagName);
      return existing ? existing.id : createTag(tagName).id;
    });

    const now = new Date().toISOString();

    // ── Lookup or create Venue ──
    const typed = venue.trim();
    let matched = venues.find((v) => v.name === typed);
    if (!matched) {
    matched = {
        id: uuidv4(),
        name: typed || UNCLASSIFIED,
        locationTag: locationTag || undefined,
        coords: coords || undefined,
    };
    addVenue(matched);
    }

    const person: Person = {
      id: (initialData.id as string) || uuidv4(),
      name: name.trim(),
      position: position.trim() || undefined,
      venueId: matched.id,
      description: description.trim() || undefined,
      dateMet,
        createdAt: mode === 'add' ? now : initialData.createdAt!,
        updatedAt: mode === 'edit' ? now : undefined,    
        locationTag: locationTag || undefined,
        coords: coords ?? undefined,          
      tags: tagIds,
      favorite: initialData.favorite || false,
    };

    onSubmit(person);
  };

  const getTagByName = (name: string) => {
    const clean = name.trim().toLowerCase();
    return tags.find((t) => t.name === clean);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
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
            touchedName && !name.trim() ? "border-red-500" : "border-gray-300"
          }`}
          required
        />
        {touchedName && !name.trim() && (
          <p className="text-red-500 text-xs mt-1">Name is required</p>
        )}
      </div>

        <div className="mb-4">
        <label htmlFor="date-met" className="block text-sm font-medium text-gray-700">
            Date Met
        </label>
        <input
            id="date-met"
            type="date"
            value={dateMet}
            onChange={e => setDateMet(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
        </div>      

        <div className="mb-4 flex items-center space-x-2">
        <button
            type="button"
            onClick={() => {
            if (!navigator.geolocation) {
                alert('Geolocation not supported');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                const { latitude: lat, longitude: lon } = pos.coords;
                setCoords({ lat, lon });
                // optional: you could reverse-geocode here to fill a locationTag
                setLocationTag(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                },
                (err) => {
                console.error(err);
                alert('Unable to fetch location');
                }
            );
            }}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm"
        >
            Use Current Location
        </button>
        {coords && (
            <span className="text-sm text-gray-600">
            {locationTag}
            </span>
        )}
        </div>

      {/* Position Field */}
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

      {/* Venue Field */}
      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
          Venue (optional)
        </label>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={(e) => {
            setVenue(e.target.value);
            setVenueInputTouched(true);
          }}
          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
        {venueInputTouched && venue.length > 50 && (
          <p className="text-red-500 text-xs mt-1">Venue name is too long</p>
        )}
      </div>

      {/* Venue suggestions as horizontally scrollable pills */}
      {venueSuggestions.length > 0 && (
        <div className="overflow-x-auto whitespace-nowrap gap-2 mt-2 px-1 pb-2">
          {venueSuggestions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVenue(v);
                setVenueSuggestions([]);
              }}
              className="inline-block mr-3 px-2 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Description Field */}
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

      {/* Tag section */}
      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>

        {/* Committed tags as horizontally scrollable pills */}
        <div role="list" className="overflow-x-auto whitespace-nowrap mb-2 px-1 pb-2">
          {currentTags.length > 0 ? (
            currentTags
              .slice()
              .sort((a, b) => a.localeCompare(b))
              .map((tagName) => (
                <span
                  key={tagName}
                  role="listitem"
                  className={`inline-block mr-3 ${
                    highlightedTag === tagName ? "ring-2 ring-red-500 animate-pulse" : ""
                  } bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm`}
                >
                  {tagName}
                  <button
                    type="button"
                    onClick={() => removeCommittedTag(tagName)}
                    className="ml-1 text-emerald-600 hover:text-emerald-800 inline-block align-middle"
                    title={`Remove tag ${tagName}`}
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

        {/* Tag input */}
        <div>
          <input
            id="tag-input"
            type="text"
            placeholder="Add a tag"
            value={currentInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            onBlur={handleTagBlur}
            autoComplete="off"
            enterKeyHint="done"
            maxLength={MAX_TAG_LENGTH}
            disabled={currentTags.length >= MAX_TAG_COUNT}
            aria-describedby="tag-instructions"
            className={`w-full p-2 border rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
              shakeInput ? "border-red-500 animate-pulse" : "border-gray-300"
            } ${
              currentTags.length >= MAX_TAG_COUNT ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
          {/* Character counter */}
          <div className="text-xs text-gray-500 text-right mt-1">
            {currentInput.length} / {MAX_TAG_LENGTH}
          </div>
          <div id="tag-instructions" className="sr-only">
            Type a tag, then press comma, Enter, or tap outside to add
          </div>
        </div>

        {/* Suggested tags as horizontally scrollable pills */}
        <div className="overflow-x-auto whitespace-nowrap mt-2 px-1 pb-2">
          {tags.length === 0 ? (
            <span className="inline-block mr-3 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-sm">
              No tags yet – start typing
            </span>
          ) : suggestions.length > 0 ? (
            suggestions.map((tag, idx) => (
              <button
                key={tag.id}
                type="button"
                onPointerDown={() => {
                  ignoreBlurRef.current = true;
                }}
                onClick={() => addTagFromSuggestion(tag.name)}
                disabled={currentTags.length >= MAX_TAG_COUNT}
                className={`inline-block mr-3 px-2 py-1 rounded-full text-sm transition ${
                  currentTags.length >= MAX_TAG_COUNT
                    ? "opacity-50 cursor-not-allowed bg-emerald-100 text-emerald-400"
                    : highlightedTag === tag.name && activeSuggestionIndex === idx
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                {tag.name}
              </button>
            ))
          ) : currentInput.trim().length > 0 ? (
            <span className="inline-block mr-3 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-sm">
              No matches – press Enter to create “{sanitizeTagName(currentInput)}”
            </span>
          ) : null}
        </div>

        {/* Error / limit message below input */}
        {errorMessage && <div className="text-red-500 text-xs mt-1">{errorMessage}</div>}
        {currentTags.length >= MAX_TAG_COUNT && !errorMessage && (
          <div className="text-gray-500 text-xs mt-1">Maximum of {MAX_TAG_COUNT} tags reached</div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className={`flex-1 py-2 rounded-md text-white text-center transition ${
            name.trim()
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gray-300 cursor-not-allowed"
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
    </form>
  );
}