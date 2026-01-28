// types.ts

export interface Venue {
  id: string;
  name: string;
  locationTag?: string;
  coords?: { lat: number; lon: number };
  favorite: boolean;
  proximityAlertsEnabled?: boolean;
  proximityEnterCount?: number;
  proximityLastEnterAt?: number;
}

export interface Person {
  id: string;
  name: string;
  position?: string;
  description?: string;
  venueId?: string;
  dateMet: string;
  createdAt: string;
  updatedAt?: string;  
  tags?: string[]; // array of tag IDs
  favorite?: boolean;
}

export interface Tag {
  id: string;
  name: string;   // lowercase, trimmed
  count: number;  // how many people reference this tag
  lastUsed: number; // timestamp (ms) of last time this tag was committed
}
