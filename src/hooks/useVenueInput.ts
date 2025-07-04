import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UNCLASSIFIED } from '../constants';
import type { Venue } from '../types';

interface UseVenueInputArgs {
  initialName: string;
  venues: Venue[];
  addVenue: (venue: Venue) => void;
  mode: 'add' | 'edit';
}

/**
 * Manages venue input text, suggestions, and final resolution (lookup or create).
 */
export function useVenueInput({
  initialName,
  venues,
  addVenue,
  mode,
}: UseVenueInputArgs) {
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
    const names = venues.map((v) => v.name);
    const q = value.trim().toLowerCase();
    setSuggestions(
      q
        ? names.filter((n) => n.toLowerCase().includes(q)).slice(0, 5)
        : names.slice(0, 5)
    );
  }, [value, venues]);

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
    const typed = value.trim();
    const existing = venues.find((v) => v.name === typed);
    if (existing) {
      return existing;
    }
    const newVenue: Venue = {
      id: uuidv4(),
      name: typed || UNCLASSIFIED,
      locationTag: undefined,
      coords: undefined,
      favorite: false,
    };
    addVenue(newVenue);
    return newVenue;
  };

  return { value, touched, suggestions, onChange, onSelect, resolveVenue };
}
