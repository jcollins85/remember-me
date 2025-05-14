// src/data.ts

import { Person } from "./types";

export const samplePeople: Person[] = [
  {
    id: "1",
    name: "Grant Bass",
    position: "Software Engineer",
    description: "Tall guy with a sleeve tattoo, friendly, talked about crypto.",
    venue: "The Tipsy Owl",
    dateMet: "2025-05-10T21:30:00.000Z",
    locationTag: "Toronto",
  },
  {
    id: "2",
    name: "Sarah Mitchell",
    position: "Nurse",
    description: "Recommended the pasta. Petite brunette with bright smile.",
    venue: "Blue Bayou",
    dateMet: "2025-05-09T20:15:00.000Z",
    locationTag: "Toronto",
  },
  {
    id: "3",
    name: "Alex Wong",
    description: "Vintage Raptors jacket, lives nearby.",
    venue: "Craft & Vine",
    dateMet: "2025-05-08T23:00:00.000Z",
  },
];
