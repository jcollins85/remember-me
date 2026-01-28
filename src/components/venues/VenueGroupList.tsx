// VenueGroupList.tsx
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Person } from "../../types";
import PersonCard from "../people/PersonCard";
import { UNCLASSIFIED } from "../../constants";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { triggerImpact, ImpactStyle } from "../../utils/haptics";
import { useAnalytics } from "../../context/AnalyticsContext";
import { toggleVenueFavoriteName } from "../../utils/favorites";

interface VenueGroupListProps {
  venue: string;
  venueId?: string;
  groupKey: string;
  group: Person[];
  isOpen: boolean;
  toggleGroup: (venueKey: string) => void;
  personSort: string;
  onEdit: (person: Person) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  getTagNameById: (id: string) => string;
  favoriteVenues: string[];
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
  searchQuery: string;
  distanceLabel?: string;
}

// Each venue card collapses/expands and houses the PersonCard list plus favourite toggle.
export default function VenueGroupList({
  venue,
  venueId,
  groupKey,
  group,
  isOpen,
  toggleGroup,
  personSort,
  onEdit,
  onDelete,
  onToggleFavorite,
  activeTags,
  setActiveTags,
  favoriteVenues,
  setFavoriteVenues,
  getTagNameById,
  searchQuery,
  distanceLabel,
}: VenueGroupListProps) {
  const { trackEvent, trackFirstEvent } = useAnalytics();
  const groupList = Array.isArray(group) ? group : [];
  // Keep favourite folks near the top and then respect the chosen person sort key.
  const sortedGroup = [...groupList].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;

    switch (personSort) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "position-asc":
        return (a.position || "").localeCompare(b.position || "");
      case "position-desc":
        return (b.position || "").localeCompare(a.position || "");
      case "date-newest":
        return new Date(b.dateMet).getTime() - new Date(a.dateMet).getTime();
      case "date-oldest":
        return new Date(a.dateMet).getTime() - new Date(b.dateMet).getTime();
      default:
        return 0;
    }
  });

  const isUnclassified = venue === UNCLASSIFIED;
  const isFavorite = isUnclassified ? false : favoriteVenues.includes(venue);
  const displayName = isUnclassified ? "No venue yet" : venue;

  return (
    <div
      id={venueId ? `venue-card-${venueId}` : undefined}
      className={`mb-2.5 glass-panel border border-[var(--color-card-border)]/70 px-4 py-3 rounded-3xl shadow-level1 ${
        isUnclassified ? "border-dashed" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 py-1">
        <button
          onClick={() => {
            toggleGroup(groupKey);
          }}
          className="text-left text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2"
          aria-label={`Toggle ${displayName}`}
        >
          <span className="text-sm text-[var(--color-text-secondary)]">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          {displayName}
          <span className="text-sm text-[var(--color-text-secondary)]">({groupList.length})</span>
        </button>
        {!isUnclassified && (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await triggerImpact(isFavorite ? ImpactStyle.Light : ImpactStyle.Medium);
              setFavoriteVenues((prev) => toggleVenueFavoriteName(prev, venue));
              if (!isFavorite) {
                trackFirstEvent("favorite_added", "first_favorite_added", {
                  type: "venue",
                });
              }
              if (!isFavorite) {
                trackEvent("venue_favorited", { venue_name: venue });
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full border relative overflow-hidden ${
              isFavorite
                ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-card-border)]"
            }`}
            title={isFavorite ? "Unmark Favorite Venue" : "Mark as Favorite Venue"}
          >
            <span
              className={`absolute inset-0 rounded-full bg-white/20 blur-lg transition-opacity duration-300 ${
                isFavorite ? "opacity-60" : "opacity-0"
              }`}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-white/70 pointer-events-none"
              animate={
                isFavorite
                  ? { scale: [1, 1.3, 0.7], opacity: [0.6, 0.4, 0] }
                  : { scale: [1, 0.75, 1], opacity: [0.3, 0.6, 0] }
              }
              transition={{ duration: 0.4 }}
            />
            <motion.span
              animate={
                isFavorite
                  ? { scale: [0.85, 1.25, 1], rotate: [0, -12, 0] }
                  : { scale: [1.1, 0.9, 1], rotate: [0, 8, 0] }
              }
              transition={{ duration: 0.35 }}
              className="relative inline-flex"
            >
              <Star size={16} fill={isFavorite ? "currentColor" : "transparent"} />
            </motion.span>
          </button>
        )}
      </div>
      {distanceLabel && (
        <p className="flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]/85 ml-7 -mt-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-muted)]" />
          {distanceLabel}
        </p>
      )}

      {isUnclassified && (
        <p className="text-xs text-[var(--color-text-secondary)] mb-2">
          Assign a venue to move people out of "No venue yet."
        </p>
      )}

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          <motion.div layout className="flex flex-col">
            {sortedGroup.map((person, idx) => (
              <Fragment key={person.id}>
                <motion.div
                  layout
                  layoutId={`person-${person.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <PersonCard
                    person={person}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                    getTagNameById={getTagNameById}
                    activeTags={activeTags}
                    setActiveTags={setActiveTags}
                    searchQuery={searchQuery}
                  />
                </motion.div>
                {idx < sortedGroup.length - 1 && (
                  <div className="mx-2 my-3 border-t border-[var(--color-accent-muted)]" />
                )}
              </Fragment>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
