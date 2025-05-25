import React from "react";

interface Props {
  venueSort: string;
  setVenueSort: (val: string) => void;
  personSort: string;
  setPersonSort: (val: string) => void;
}

export default function SortControls({
  venueSort,
  setVenueSort,
  personSort,
  setPersonSort,
}: Props) {
  return (
    <div className="mt-3 flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 text-sm bg-white/60 backdrop-blur border border-neutral-200 shadow-sm rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium whitespace-nowrap">Sort Venues:</label>
            <select
            value={venueSort}
            onChange={(e) => setVenueSort(e.target.value)}
            className="border border-neutral-300 rounded px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
            >
            <option value="asc">A–Z</option>
            <option value="desc">Z–A</option>
            </select>
        </div>

        <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium whitespace-nowrap">Sort People:</label>
            <select
            value={personSort}
            onChange={(e) => setPersonSort(e.target.value)}
            className="border rounded p-2 text-sm"
            >
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="position-asc">Position (A–Z)</option>
            <option value="position-desc">Position (Z–A)</option>
            <option value="date-newest">Date Met (Newest First)</option>
            <option value="date-oldest">Date Met (Oldest First)</option>
            </select>
        </div>
    </div>
  );
}
