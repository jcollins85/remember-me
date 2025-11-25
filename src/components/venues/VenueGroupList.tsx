// VenueGroupList.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Person } from "../../types";
import PersonCard from "../people/PersonCard";

interface VenueGroupListProps {
  venue: string;
  group: Person[];
  isOpen: boolean;
  toggleGroup: (venue: string) => void;
  personSort: string;
  onEdit: (person: Person) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  getTagNameById: (id: string) => string;
  favoriteVenues: string[];
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function VenueGroupList({
  venue,
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
}: VenueGroupListProps) {
  const sortedGroup = [...group].sort((a, b) => {
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

  const isFavorite = favoriteVenues.includes(venue);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => toggleGroup(venue)}
          className="text-left text-xl font-bold text-gray-700 flex items-center gap-2 mb-2"
          aria-label={`Toggle ${venue}`}
        >
          {isOpen ? "▼" : "▶"}
          <span className="flex items-center gap-1">
            {venue} <span className="text-sm text-gray-500">({group.length})</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setFavoriteVenues((prev) =>
                  prev.includes(venue)
                    ? prev.filter((v) => v !== venue)
                    : [...prev, venue]
                );
              }}
              className="text-yellow-400 text-lg cursor-pointer hover:scale-110 transition"
              title={
                isFavorite ? "Unmark Favorite Venue" : "Mark as Favorite Venue"
              }
            >
              {isFavorite ? "★" : "☆"}
            </span>
          </span>
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          <motion.div layout className="flex flex-col gap-4">
            {sortedGroup.map((person) => (
              <motion.div
                key={person.id}
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
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
