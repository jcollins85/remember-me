import React, { Dispatch, SetStateAction, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, User, Search, X, ListFilter } from "lucide-react";
import type { SortKey, VenueSortKey } from "../../utils/sortHelpers";
import SegmentedControl, { Segment } from "../ui/SegmentedControl";
import SortControls from "./SortControls";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";
import { useAnalytics } from "../../context/AnalyticsContext";

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
  showSortModal: boolean;
  setShowSortModal: Dispatch<SetStateAction<boolean>>;
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
  showSortModal,
  setShowSortModal,
}) => {
  const { trackEvent } = useAnalytics();
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
        {/* Two-layer approach: a glass backdrop spanning the safe area plus the actual header content */}
        <div className="relative">
          <div
            className="absolute inset-x-0 pointer-events-none bg-[var(--color-surface)]/92 backdrop-blur-[30px] border-b border-[var(--color-card-border)]/70 shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
            style={{
              top: "calc(-1 * env(safe-area-inset-top))",
              height: "calc(100% + env(safe-area-inset-top))",
            }}
          />
          <div
            className="relative space-y-1"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 6px)" }}
          >
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 pb-1">
        <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
          <button
            aria-label="Settings"
            onClick={onOpenSettings}
            className="p-2 rounded-md hover:bg-white/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
          >
            <Settings size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)] drop-shadow-[0_1px_2px_rgba(15,23,42,0.2)] z-10" size={20} strokeWidth={2.4} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, tags, venues"
              className="w-full h-12 pl-11 pr-16 rounded-full bg-[var(--color-card)] backdrop-blur-sm border border-[var(--color-card-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/80 placeholder:text-[0.9rem] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-level1"
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
            <button
              aria-label="Sort"
              className={`absolute top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition ${
                searchQuery ? "right-9" : "right-3.5"
              }`}
              onClick={() => {
                trackEvent("sort_modal_opened");
                setShowSortModal(true);
              }}
            >
              <ListFilter size={18} />
            </button>
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
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 pt-0 pb-2 space-y-0.5">

          {/* Segmented control centered */}
      <div className="flex justify-center pt-0.5">
        <SegmentedControl segments={segments} value={venueView} onChange={setVenueView} className="shadow-level1" />
      </div>
    </div>
      </div>
          </div>
        </div>
      </div>

      {/* Sort sheet reuses the Modal glass visual but stays scoped to the header */}
      <AnimatePresence>
        {showSortModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSortModal(false)}
          >
            <motion.div
              className="glass-panel w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col relative bg-[var(--color-card)]"
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
                  triggerImpact(ImpactStyle.Light);
                  setShowSortModal(false);
                }}
                aria-label="Close sort options"
              >
                <X size={16} />
              </button>
              <div className="overflow-y-auto px-5 pb-5 pt-6 space-y-4" style={{ scrollbarGutter: "stable" }}>
                <SortControls
                  variant="venue"
                  venueSortKey={venueSortKey}
                  venueSortDir={venueSortDir}
                  setVenueSortKey={setVenueSortKey}
                  setVenueSortDir={setVenueSortDir}
                  personSort={personSort}
                  setPersonSort={setPersonSort}
                />
                <SortControls
                  variant="people"
                  venueSortKey={venueSortKey}
                  venueSortDir={venueSortDir}
                  setVenueSortKey={setVenueSortKey}
                  setVenueSortDir={setVenueSortDir}
                  personSort={personSort}
                  setPersonSort={setPersonSort}
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
