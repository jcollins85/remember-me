import React, { Dispatch, SetStateAction, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, User, Search, X } from "lucide-react";
import type { SortKey, VenueSortKey } from "../../utils/sortHelpers";
import SegmentedControl, { Segment } from "../ui/SegmentedControl";
import SortControls from "./SortControls";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTags: string[];
  setActiveTags: Dispatch<SetStateAction<string[]>>;
  venueSortKey: VenueSortKey;
  venueSortDir: "asc" | "desc";
  setVenueSortKey: Dispatch<SetStateAction<VenueSortKey>>;
  setVenueSortDir: Dispatch<SetStateAction<"asc" | "desc">>;
  personSort: `${SortKey}-${"asc"|"desc"}`;
  setPersonSort: Dispatch<SetStateAction<`${SortKey}-${"asc"|"desc"}`>>;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  getTagNameById: (id: string) => string;
  venueView: "all" | "favs";
  setVenueView: Dispatch<SetStateAction<"all" | "favs">>;
  favoriteVenueCount: number;
  totalVenueCount: number;
  sortSheet: "venue" | "people" | null;
  setSortSheet: Dispatch<SetStateAction<"venue" | "people" | null>>;
}

// Sticky header that hosts search, sort toggles, and the segmented control
// while keeping the UI responsive to scroll/collapse events.
const Header: React.FC<HeaderProps> = ({
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
  onOpenSettings,
  onOpenProfile,
  venueView,
  setVenueView,
  favoriteVenueCount,
  totalVenueCount,
  sortSheet,
  setSortSheet,
}) => {
  const toggleSheet = (sheet: "venue" | "people") => {
    setSortSheet((prev) => (prev === sheet ? null : sheet));
  };

  const segments: Segment<"all" | "favs">[] = useMemo(
    () => [
      { key: "all", label: `All Venues (${totalVenueCount})` },
      { key: "favs", label: `Favourites (${favoriteVenueCount})` },
    ],
    [totalVenueCount, favoriteVenueCount]
  );

  return (
    <>
      <div className="sticky z-40" style={{ top: 0 }}>
        <div className="relative">
          <div
            className="absolute inset-x-0 pointer-events-none bg-[var(--color-surface)]/92 backdrop-blur-[30px] border-b border-[var(--color-card-border)]/70 shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
            style={{
              top: "calc(-1 * env(safe-area-inset-top))",
              height: "calc(100% + env(safe-area-inset-top))",
            }}
          />
          <div
            className="relative space-y-2.5"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 6px)" }}
          >
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 pb-1">
        <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
          <button
            aria-label="Settings"
            onClick={onOpenSettings}
            className="p-2 rounded-md hover:bg-white/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
          >
            <Settings size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)] drop-shadow-sm" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person, tag or venue…"
              className="w-full h-12 pl-10 pr-12 rounded-full bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-card-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-level1"
            />
            {searchQuery && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            aria-label="Profile"
            className="p-2 rounded-md hover:bg-white/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
            onClick={onOpenProfile}
          >
            <User size={20} />
          </button>
        </div>
      </div>

      {/* ── Utility Tier ─────────────────────────────────────────── */}
      <div className="bg-transparent">
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 pt-1 pb-2 space-y-1.5">

          <div className="flex flex-col items-center gap-1.5 text-[12px]">
            <div className="flex justify-center gap-3 w-full flex-wrap">
              <button
                onClick={() => toggleSheet("venue")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition pill-chip ${
                  sortSheet === "venue"
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "border-[color:var(--color-card-border)] bg-[var(--color-card)] text-[var(--color-text-primary)]"
                }`}
              >
                Venues · {venueSortKey === "name" ? "Name" : venueSortKey === "recentVisit" ? "Recent" : "Known"}
                {venueSortDir === "asc" ? " ↑" : " ↓"}
              </button>
              <button
                onClick={() => toggleSheet("people")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition pill-chip ${
                  sortSheet === "people"
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "border-[color:var(--color-card-border)] bg-[var(--color-card)] text-[var(--color-text-primary)]"
                }`}
              >
                People · {personSort.replace("dateMet", "Met").replace("updatedAt", "Updated").replace("asc", " ↑").replace("desc", " ↓")}
              </button>
            </div>

          </div>

          {/* Segmented control centered */}
      <div className="flex justify-center pt-1.5">
        <SegmentedControl segments={segments} value={venueView} onChange={setVenueView} className="shadow-level1" />
      </div>
    </div>
      </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sortSheet && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSortSheet(null)}
          >
            <motion.div
              className="glass-panel w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col relative bg-[var(--color-card)]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-card-border)] shadow-[0_8px_18px_rgba(15,23,42,0.15)] hover:bg-[var(--color-card)]/90 flex items-center justify-center"
                onClick={(event) => {
                  event.stopPropagation();
                  setSortSheet(null);
                }}
                aria-label="Close sort options"
              >
                <X size={16} />
              </button>
              <div className="overflow-y-auto px-5 pb-5 pt-6 space-y-4" style={{ scrollbarGutter: "stable" }}>
                <SortControls
                  variant={sortSheet}
                  venueSortKey={venueSortKey}
                  venueSortDir={venueSortDir}
                  setVenueSortKey={setVenueSortKey}
                  setVenueSortDir={setVenueSortDir}
                  personSort={personSort}
                  setPersonSort={setPersonSort}
                  onClose={() => setSortSheet(null)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
