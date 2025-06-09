// types.ts

export interface Venue {
  id: string;
  name: string;
  locationTag?: string;
  coords?: { lat: number; lon: number };
}

export interface Person {
  id: string;
  name: string;
  position?: string;
  description?: string;
  venueId?: string;
  dateMet: string;
  locationTag?: string;
  createdAt: string;
  updatedAt?: string;  
  coords?: { lat: number; lon: number };
  tags?: string[]; // array of tag IDs
  favorite?: boolean;
}

export interface Tag {
  id: string;
  name: string;   // lowercase, trimmed
  count: number;  // how many people reference this tag
  lastUsed: number; // timestamp (ms) of last time this tag was committed
}
