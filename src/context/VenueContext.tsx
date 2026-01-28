import React, { createContext, ReactNode, useContext, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { sampleVenues } from '../data';
import { Venue } from '../types';
import { useNotification } from './NotificationContext';

// Public venue store API (coords, proximity toggles, and metadata).
interface VenueContextType {
  venues: Venue[];
  addVenue: (v: Venue) => void;
  updateVenue: (v: Venue) => void;
  replaceVenues: (venues: Venue[]) => void;
}

// Venue store mirrors People/Tags so all spatial metadata (coords, proximity toggles) stay in sync.
const VenueContext = createContext<VenueContextType | undefined>(undefined);

export const VenueProvider = ({ children }: { children: ReactNode }) => {
  const { showNotification } = useNotification();
  const handleStorageError = useCallback(
    (action: 'read' | 'write') => {
      const verb = action === 'read' ? 'loading' : 'saving';
      showNotification(`Problem ${verb} venues. Changes may not persist.`, 'error');
    },
    [showNotification]
  );

  const seedVenues =
    import.meta.env.VITE_SHOW_DEV_TOOLS === 'true' ||
    import.meta.env.VITE_SEED_SAMPLE_DATA === 'true'
      ? sampleVenues
      : [];
  const [venues, setVenues] = useLocalStorage<Venue[]>('venues', seedVenues, {
    onError: handleStorageError,
  });

  const addVenue = (venue: Venue) =>
    setVenues(prev => [...prev, venue]);

  const updateVenue = (venue: Venue) =>
    setVenues(prev => prev.map(v => v.id === venue.id ? venue : v));

  const replaceVenues = (next: Venue[]) => {
    setVenues(() => [...next]);
  };

  return (
    <VenueContext.Provider value={{ venues, addVenue, updateVenue, replaceVenues }}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenues = (): VenueContextType => {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenues must be used within VenueProvider');
  return ctx;
};
