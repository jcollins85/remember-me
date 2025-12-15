import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, Bell, User, Search } from "lucide-react";
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
  onOpenNotifications: () => void;
  unreadNotifications: number;
}

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
  onOpenNotifications,
  onOpenProfile,
  venueView,
  setVenueView,
  favoriteVenueCount,
  totalVenueCount,
  unreadNotifications,
}) => {
  const [sortSheet, setSortSheet] = useState<"venue" | "people" | null>(null);
  const [isTopCollapsed, setIsTopCollapsed] = useState(false);

  const toggleSheet = (sheet: "venue" | "people") => {
    setSortSheet((prev) => (prev === sheet ? null : sheet));
  };

  useEffect(() => {
  }, []);
  const segments: Segment<"all" | "favs">[] = [
    { key: "all",  label: `All Venues (${totalVenueCount})` },
    { key: "favs", label: `Favourites (${favoriteVenueCount})` },
  ];

  useEffect(() => {
    const COLLAPSE_AT = 80;
    const EXPAND_AT = 20;
    const handleScroll = () => {
      const y = window.scrollY;
      setIsTopCollapsed((prev) => {
        if (!prev && y > COLLAPSE_AT) return true;
        if (prev && y < EXPAND_AT) return false;
        return prev;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-40">
      {/* ── Top Tier ─────────────────────────────────────────────── */}
      <div
        className={`px-4 sm:px-6 md:px-8 lg:px-10 ${
          isTopCollapsed ? "py-0 h-0" : "py-2.5"
        } bg-white/80 backdrop-blur-[26px] border-b border-white/40 shadow-[0_10px_22px_rgba(15,23,42,0.1)] flex items-center justify-between transition-all duration-300 ${
          isTopCollapsed ? "-translate-y-2 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } dark:bg-[var(--color-surface)] dark:border-[var(--color-card-border)]`}
      >
        <button
          aria-label="Settings"
          onClick={onOpenSettings}
          className="p-2 rounded-md hover:bg-white/60 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        >
          <Settings size={20} />
        </button>
        <img src="/remember-me-header-banner.png" alt="Remember Me" className="h-10 object-contain" />
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="p-2 rounded-md hover:bg-white/60 relative text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
            onClick={onOpenNotifications}
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
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
      <div className="bg-white/70 backdrop-blur-[26px] border-b border-white/40 shadow-[0_14px_30px_rgba(15,23,42,0.1)] dark:bg-[var(--color-surface-alt)] dark:border-[var(--color-card-border)]">
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 pt-3.5 pb-4 space-y-3.5">
          {/* Search with icon INSIDE the field */}
          <div className="relative w-full max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-accent)] drop-shadow-sm" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person, tag or venue…"
              className="w-full h-12 pl-10 pr-12 rounded-full bg-white/80 backdrop-blur-sm border border-white/70 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-level1 dark:bg-[var(--color-card)] dark:border-[var(--color-card-border)]"
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

          <div className="mt-4 flex flex-col items-center gap-2 text-[12px]">
            <div className="flex justify-center gap-3 w-full flex-wrap">
              <button
                onClick={() => toggleSheet("venue")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition pill-chip ${
                  sortSheet === "venue"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
                }`}
              >
                Venues · {venueSortKey === "name" ? "Name" : venueSortKey === "recentVisit" ? "Recent" : "Known"}
                {venueSortDir === "asc" ? " ↑" : " ↓"}
              </button>
              <button
                onClick={() => toggleSheet("people")}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition pill-chip ${
                  sortSheet === "people"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
                }`}
              >
                People · {personSort.replace("dateMet", "Met").replace("updatedAt", "Updated").replace("asc", " ↑").replace("desc", " ↓")}
              </button>
            </div>

          </div>

          {/* Segmented control centered */}
      <div className="flex justify-center pt-4">
        <SegmentedControl segments={segments} value={venueView} onChange={setVenueView} className="shadow-level1" />
      </div>
    </div>
      </div>
      </div>

      <AnimatePresence>
        {sortSheet && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSortSheet(null)}
          >
            <motion.div
              className="w-full rounded-t-3xl bg-white px-6 pt-5 pb-6 space-y-5 shadow-[0_-18px_45px_rgba(15,23,42,0.25)]"
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-2" />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
