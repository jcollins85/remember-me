import React from "react";
import VenueGroupList from "./VenueGroupList";
import type { Person } from "../../types";
import InlineLogo from "../../assets/brand/MetHere-inline-clean-transparent-tight.svg";

interface Props {
  groupedPeople: Record<string, Person[]>;
  favoriteVenues: string[];
  visibleVenueNames: string[];
  totalVenueCount: number;
  viewMode: "all" | "favs";
  venueIdByName: Record<string, string>;
  personSort: string;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  getTagNameById: (id: string) => string;
  openGroups: Record<string, boolean>;
  toggleGroup: (venueName: string) => void;
  setFavoriteVenues: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (p: Person) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  distanceLabels: Record<string, string>;
}

// Renders the masonry of venue cards (favourites vs all) and handles the empty state messaging.
export default function VenueSections({
  groupedPeople,
  favoriteVenues,
  visibleVenueNames,
  totalVenueCount,
  viewMode,
  venueIdByName,
  personSort,
  activeTags,
  setActiveTags,
  getTagNameById,
  openGroups,
  toggleGroup,
  setFavoriteVenues,
  onEdit,
  onDelete,
  onToggleFavorite,
  searchQuery,
  distanceLabels,
}: Props) {
  const hasAnyVenues = totalVenueCount > 0;
  const hasFavorites = favoriteVenues.length > 0;
  const emptyMessage =
    viewMode === "favs"
      ? hasFavorites
        ? "No favourite venues match your filters. Try clearing search or tags."
        : "No favourite venues yet. Tap the star next to a venue to pin it here."
      : hasAnyVenues
        ? "No venues match your filters. Try clearing search or tags."
        : "Add your first venue to start remembering where you met people.";

  if (visibleVenueNames.length === 0) {
    return (
      <div className="glass-panel px-6 py-10 text-center text-[var(--color-text-secondary)] space-y-4">
        <div className="w-full flex items-center justify-center pb-1">
          <img src={InlineLogo} alt="MetHere logo" className="h-6 w-auto opacity-70" />
        </div>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">Nothing to show yet</p>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2">
      {visibleVenueNames.map((venueName) => (
        <VenueGroupList
          key={venueName}
          venue={venueName}
          venueId={venueIdByName[venueName]}
          group={groupedPeople[venueName] ?? []}
          personSort={personSort}
          activeTags={activeTags}
          setActiveTags={setActiveTags}
          getTagNameById={getTagNameById}
          favoriteVenues={favoriteVenues}
          setFavoriteVenues={setFavoriteVenues}
          isOpen={openGroups[venueName] ?? true}
          toggleGroup={toggleGroup}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          searchQuery={searchQuery}
          distanceLabel={distanceLabels[venueName]}
        />
      ))}
    </div>
  );
}
