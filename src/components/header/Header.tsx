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
  const [openSheet, setOpenSheet] = useState<null | "venue" | "people">(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isTopCollapsed, setIsTopCollapsed] = useState(false);

  const toggleSheet = (sheet: "venue" | "people") => {
    setOpenSheet((prev) => (prev === sheet ? null : sheet));
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (openSheet && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpenSheet(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openSheet]);

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
    <div className="sticky top-0 z-40">
      {/* ── Top Tier ─────────────────────────────────────────────── */}
      <div
        className={`px-4 ${
          isTopCollapsed ? "py-0 h-0" : "py-2"
        } bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-level1 flex items-center justify-between transition-all duration-300 ${
          isTopCollapsed ? "-translate-y-2 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        } dark:bg-[var(--color-surface)] dark:border-[var(--color-card-border)]`}
      >
        <button aria-label="Settings" onClick={onOpenSettings} className="p-2 rounded-md hover:bg-white/50">
          <Settings size={20} className="text-textPrimary" />
        </button>
        <img src="/remember-me-header-banner.png" alt="Remember Me" className="h-10 object-contain" />
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="p-2 rounded-md hover:bg-white/50 relative"
            onClick={onOpenNotifications}
          >
            <Bell size={20} className="text-textPrimary" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
          <button aria-label="Profile" className="p-2 rounded-md hover:bg-white/50" onClick={onOpenProfile}>
            <User size={20} className="text-textPrimary" />
          </button>
        </div>
      </div>

      {/* ── Utility Tier ─────────────────────────────────────────── */}
      <div className="bg-white/65 backdrop-blur-[30px] border-b border-white/40 shadow-level1 dark:bg-[var(--color-surface-alt)] dark:border-[var(--color-card-border)]">
        <div className="px-4 sm:px-6 md:px-8 lg:px-10 pt-3">
          {/* Search with icon INSIDE the field */}
          <div className="relative w-full max-w-xl mx-auto">
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

          <div ref={drawerRef} className="mt-3 flex flex-col items-center gap-2 text-[12px]">
            <div className="flex justify-center gap-3 w-full">
              <button
                onClick={() => toggleSheet("venue")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition pill-chip ${
                  openSheet === "venue"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
                }`}
              >
                Venues · {venueSortKey === "name" ? "Name" : venueSortKey === "recentVisit" ? "Recent" : "Known"}
                {venueSortDir === "asc" ? " ↑" : " ↓"}
              </button>
              <button
                onClick={() => toggleSheet("people")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition pill-chip ${
                  openSheet === "people"
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-muted)] text-[var(--color-accent)] shadow-level1"
                    : "text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]"
                }`}
              >
                People · {personSort.replace("dateMet", "Met").replace("updatedAt", "Updated").replace("asc", " ↑").replace("desc", " ↓")}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {openSheet && (
                <motion.div
                  key={openSheet}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full max-w-xl overflow-hidden"
                >
                  <div className="mt-2 bg-white/90 backdrop-blur-lg border border-white/40 px-4 py-3 rounded-2xl shadow-level2 dark:bg-[var(--color-card)] dark:border-[var(--color-card-border)]">
                    <SortControls
                      variant={openSheet}
                      venueSortKey={venueSortKey}
                      venueSortDir={venueSortDir}
                      setVenueSortKey={setVenueSortKey}
                      setVenueSortDir={setVenueSortDir}
                      personSort={personSort}
                      setPersonSort={setPersonSort}
                      onClose={() => setOpenSheet(null)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Segmented control centered */}
          <div className="flex justify-center py-3">
            <SegmentedControl segments={segments} value={venueView} onChange={setVenueView} className="shadow-level1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
