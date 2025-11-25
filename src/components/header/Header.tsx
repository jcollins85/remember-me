import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Settings, Bell, User } from "lucide-react";
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
  onMenuOpen: () => void;
  getTagNameById: (id: string) => string;
  venueView: "all" | "favs";
  setVenueView: Dispatch<SetStateAction<"all" | "favs">>;
  favoriteVenueCount: number;
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
  onMenuOpen,
  venueView,
  setVenueView,
  favoriteVenueCount,
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
    { key: "all",  label: "All Venues" },
    { key: "favs", label: `Favourites (${favoriteVenueCount})` },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const shouldCollapse = window.scrollY > 40;
      setIsTopCollapsed((prev) => (prev === shouldCollapse ? prev : shouldCollapse));
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
        } bg-white/80 backdrop-blur-md ring-1 ring-white/40 border-b border-white/30 shadow-level1 flex items-center justify-between transition-all duration-300 ${
          isTopCollapsed ? "-translate-y-2 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <button aria-label="Settings" onClick={onMenuOpen} className="p-2 rounded-md hover:bg-white/50">
          <Settings size={20} className="text-textPrimary" />
        </button>
        <img src="/remember-me-header-banner.png" alt="Remember Me" className="h-10 object-contain" />
        <div className="flex items-center gap-2">
          <button aria-label="Alerts" className="p-2 rounded-md hover:bg-white/50">
            <Bell size={20} className="text-textPrimary" />
          </button>
          <button aria-label="Profile" className="p-2 rounded-md hover:bg-white/50">
            <User size={20} className="text-textPrimary" />
          </button>
        </div>
      </div>

      {/* ── Utility Tier ─────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md ring-1 ring-white/40 border-b border-white/30">
        <div className="px-4 pt-3">
          {/* Search with icon INSIDE the field */}
          <div className="relative w-full max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues…"
              className="w-full h-10 pl-4 pr-12 rounded-lg bg-white/70 backdrop-blur-sm border border-neutral-200 text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div ref={drawerRef} className="mt-3 flex flex-col items-center gap-2 text-[12px]">
            <div className="flex justify-center gap-3 w-full">
              <button
                onClick={() => toggleSheet("venue")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition backdrop-blur border ${
                  openSheet === "venue"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-level1"
                    : "border-white/80 bg-white/25 text-textPrimary shadow-sm"
                }`}
              >
                Venues · {venueSortKey === "name" ? "Name" : venueSortKey === "recentVisit" ? "Recent" : "Known"}
                {venueSortDir === "asc" ? " ↑" : " ↓"}
              </button>
              <button
                onClick={() => toggleSheet("people")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition backdrop-blur border ${
                  openSheet === "people"
                    ? "border-slate-900 bg-slate-900/10 text-slate-900 shadow-level1"
                    : "border-white/80 bg-white/25 text-textPrimary shadow-sm"
                }`}
              >
                People · {personSort.replace("dateMet", "Met").replace("updatedAt", "Updated").replace("asc", " ↑").replace("desc", " ↓")}
              </button>
            </div>

            <div
              className={`w-full max-w-xl overflow-hidden transition-[max-height,opacity] duration-250 ${
                openSheet ? "max-h-36 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {openSheet && (
                <div className="mt-2 bg-white/90 backdrop-blur-lg border border-white/40 px-4 py-3 rounded-2xl shadow-level2">
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
              )}
            </div>
          </div>

          {/* Segmented control centered */}
          <div className="flex justify-center py-3">
            <SegmentedControl segments={segments} value={venueView} onChange={setVenueView} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
