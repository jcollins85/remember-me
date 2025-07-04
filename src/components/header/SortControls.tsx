import React from "react";
import type { SortKey, VenueSortKey } from "../../utils/sortHelpers";

type Direction = "asc" | "desc";
type PersonSortString = `${SortKey}-${Direction}`;

interface Props {
  venueSortKey: VenueSortKey;
  venueSortDir: Direction;
  setVenueSortKey: (key: VenueSortKey) => void;
  setVenueSortDir: (dir: Direction) => void;
  personSort: PersonSortString;
  setPersonSort: (val: PersonSortString) => void;
}

export default function SortControls({
  venueSortKey,
  venueSortDir,
  setVenueSortKey,
  setVenueSortDir,
  personSort,
  setPersonSort,
}: Props) {
  return (
    <div className="mt-4 bg-white border border-neutral-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Venue Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="venue-sort" className="text-gray-600 font-medium whitespace-nowrap">
            Sort Venues:
          </label>
          <select
            id="venue-sort"
            value={`${venueSortKey}-${venueSortDir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split("-") as [VenueSortKey, Direction];
              setVenueSortKey(key);
              setVenueSortDir(dir);
            }}
            className="px-2 py-1 bg-gray-100 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="recentVisit-desc">Recent Visit (Newest)</option>
            <option value="recentVisit-asc">Recent Visit (Oldest)</option>
            <option value="knownCount-desc">Most Known</option>
            <option value="knownCount-asc">Least Known</option>
          </select>
        </div>

        {/* People Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="person-sort" className="text-gray-600 font-medium whitespace-nowrap">
            Sort People:
          </label>
          <select
            id="person-sort"
            value={personSort}
            onChange={(e) => setPersonSort(e.target.value as PersonSortString)}
            className="px-2 py-1 bg-gray-100 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="dateMet-desc">Date Met (Newest)</option>
            <option value="dateMet-asc">Date Met (Oldest)</option>
            <option value="updatedAt-desc">Last Updated (Newest)</option>
            <option value="updatedAt-asc">Last Updated (Oldest)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
