import React, { createContext, ReactNode, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { sampleVenues } from '../data';
import { Venue } from '../types';

interface VenueContextType {
  venues: Venue[];
  addVenue: (v: Venue) => void;
  updateVenue: (v: Venue) => void;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export const VenueProvider = ({ children }: { children: ReactNode }) => {
  const [venues, setVenues] = useLocalStorage<Venue[]>('venues', sampleVenues);

  const addVenue = (venue: Venue) =>
    setVenues(prev => [...prev, venue]);

  const updateVenue = (venue: Venue) =>
    setVenues(prev => prev.map(v => v.id === venue.id ? venue : v));

  return (
    <VenueContext.Provider value={{ venues, addVenue, updateVenue }}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenues = (): VenueContextType => {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('useVenues must be used within VenueProvider');
  return ctx;
};