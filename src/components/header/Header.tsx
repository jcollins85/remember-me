import { useState } from "react";
import SortControls from "./SortControls";
import SearchBar from "./SearchBar";
import type { Dispatch, SetStateAction } from 'react';
import type { SortKey, VenueSortKey } from '../../utils/sortHelpers';

type Direction  = 'asc' | 'desc';
type SortString = `${SortKey}-${Direction}`;

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTags: string[];
  setActiveTags: Dispatch<SetStateAction<string[]>>;
  venueSortKey: VenueSortKey;
  venueSortDir: Direction;
  setVenueSortKey: Dispatch<SetStateAction<VenueSortKey>>;
  setVenueSortDir: Dispatch<SetStateAction<Direction>>;
  personSort: SortString;
  setPersonSort: Dispatch<SetStateAction<SortString>>;
  onMenuOpen: () => void;
  getTagNameById: (id: string) => string;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  activeTags,
  setActiveTags,
  venueSortKey,
  venueSortDir,
  setVenueSortKey,
  setVenueSortDir,
  personSort,
  setPersonSort,
  onMenuOpen,
  getTagNameById,
}: Props) {
  const [showControls, setShowControls] = useState(false);

  return (
    <>
      {/* Sticky top bar with hamburger and logo */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <button
          onClick={onMenuOpen}
          className="text-2xl text-emerald-600"
          aria-label="Open menu"
        >
          ☰
        </button>
        <img
          src="/remember-me-header-banner.png"
          alt="Remember Me"
          className="h-10 object-contain"
        />
      </div>

      {/* Search, filters, and sort controls container */}
      <div className="w-full px-6">
        <div className="bg-white shadow-md border border-neutral-200 rounded-xl px-4 py-4 max-w-xl mx-auto mt-4 mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* 🟢 Always visible tag filter chips */}
          {activeTags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Active tag:</span>
              {activeTags.map((tagId) => {
                const tagName = getTagNameById(tagId);
                return (
                  <span
                    key={tagId}
                    className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {tagName}
                    <button
                      onClick={() =>
                        setActiveTags((prev) => prev.filter((t) => t !== tagId))
                      }
                      className="text-red-500 ml-1 text-xs hover:underline"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
              <button
                onClick={() => setActiveTags([])}
                className="text-sm text-red-500 hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Toggle for Filters & Sort */}
          <div className="text-center mt-3">
            <button
              onClick={() => setShowControls(!showControls)}
              className="text-sm text-emerald-600 hover:underline focus:outline-none"
            >
              {showControls ? "Hide Sorts" : "Show Sorts"}
            </button>
          </div>

          {showControls && (
            <div className="mt-4">
              <SortControls
                venueSortKey={venueSortKey}
                venueSortDir={venueSortDir}
                setVenueSortKey={setVenueSortKey}
                setVenueSortDir={setVenueSortDir}
                personSort={personSort}
                setPersonSort={setPersonSort}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}