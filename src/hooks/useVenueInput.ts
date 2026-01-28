import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UNCLASSIFIED } from '../constants';
import type { Venue } from '../types';

interface UseVenueInputArgs {
  initialName: string;
  venues: Venue[];
  addVenue: (venue: Venue) => void;
  mode: 'add' | 'edit';
  venueUsage?: Record<string, number>;
}

/**
 * Manages venue input text, suggestions, and final resolution (lookup or create).
 */
export function useVenueInput({
  initialName,
  venues,
  addVenue,
  mode,
  venueUsage = {},
}: UseVenueInputArgs) {
  const normalizeVenue = (raw: string) => {
    const trimmed = raw.trim().replace(/\s+/g, " ");
    return {
      display: trimmed,
      normalized: trimmed.toLowerCase(),
    };
  };
  const [value, setValue] = useState<string>(initialName);
  const [touched, setTouched] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Reset input on mode change (e.g., new "Add" form)
  useEffect(() => {
    if (mode === 'add') {
      setValue('');
      setTouched(false);
    }
  }, [mode]);

  // Generate suggestions based on current value
  useEffect(() => {
    const names = venues
      .map((v) => ({
        name: v.name,
        count: venueUsage[v.id] ?? 0,
      }));
    const q = normalizeVenue(value).normalized;
    setSuggestions(
      q
        ? names
            .filter((entry) => normalizeVenue(entry.name).normalized.includes(q))
            .slice(0, 5)
            .map((entry) => entry.name)
        : names
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((entry) => entry.name)
    );
  }, [value, venues, venueUsage]);

  const onChange = (newValue: string) => {
    setValue(newValue);
    setTouched(true);
  };

  const onSelect = (selection: string) => {
    setValue(selection);
    setSuggestions([]);
  };

  /**
   * Look up existing venue by name, or create a new one if not found.
   */
  const resolveVenue = (): Venue => {
    const { display, normalized } = normalizeVenue(value);
    const existing = venues.find(
      (v) => normalizeVenue(v.name).normalized === normalized
    );
    if (existing) {
      return existing;
    }
    const newVenue: Venue = {
      id: uuidv4(),
      name: display || UNCLASSIFIED,
      locationTag: undefined,
      coords: undefined,
      favorite: false,
      proximityAlertsEnabled: true,
      proximityEnterCount: 0,
      proximityLastEnterAt: undefined,
    };
    addVenue(newVenue);
    return newVenue;
  };

  return { value, touched, suggestions, onChange, onSelect, resolveVenue };
}
