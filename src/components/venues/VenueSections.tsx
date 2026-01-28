import React from "react";
import VenueGroupList from "./VenueGroupList";
import type { Person } from "../../types";
import { UNCLASSIFIED } from "../../constants";
import InlineLogo from "../../assets/brand/MetHere-inline-clean-transparent-tight.svg";

interface Props {
  groupedPeople: Record<string, Person[]>;
  favoriteVenues: string[];
  visibleVenueIds: string[];
  totalVenueCount: number;
  viewMode: "all" | "favs";
  venueNameById: Record<string, string>;
  personSort: string;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
  getTagNameById: (id: string) => string;
  openGroups: Record<string, boolean>;
  toggleGroup: (venueKey: string) => void;
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
  visibleVenueIds,
  totalVenueCount,
  viewMode,
  venueNameById,
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

  if (visibleVenueIds.length === 0) {
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
      {visibleVenueIds.map((venueId) => {
        const venueName =
          venueId === UNCLASSIFIED
            ? UNCLASSIFIED
            : venueNameById[venueId] ?? UNCLASSIFIED;
        return (
          <VenueGroupList
            key={venueId}
            venue={venueName}
            venueId={venueId}
            groupKey={venueId}
            group={groupedPeople[venueId] ?? []}
          personSort={personSort}
          activeTags={activeTags}
          setActiveTags={setActiveTags}
          getTagNameById={getTagNameById}
          favoriteVenues={favoriteVenues}
          setFavoriteVenues={setFavoriteVenues}
          isOpen={openGroups[venueId] ?? true}
          toggleGroup={toggleGroup}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          searchQuery={searchQuery}
          distanceLabel={distanceLabels[venueId]}
        />
        );
      })}
    </div>
  );
}
