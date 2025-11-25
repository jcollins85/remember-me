import React from 'react';
import VenueGroupList from './VenueGroupList';
import type { Person } from '../../types';

interface Props {
  groupedPeople: Record<string, Person[]>;
  favoriteVenues: string[];
  visibleVenueNames: string[];
  viewMode: "all" | "favs";
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
}

export default function VenueSections({
  groupedPeople,
  favoriteVenues,
  visibleVenueNames,
  viewMode,
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
}: Props) {
  const emptyMessage =
    viewMode === "favs"
      ? "No favourite venues yet. Tap the star next to a venue to pin it here."
      : "No venues to show. Try adding a person or clearing filters.";

  if (visibleVenueNames.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white/70 p-6 text-center text-sm text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleVenueNames.map((venueName) => (
        <VenueGroupList
          key={venueName}
          venue={venueName}
          group={groupedPeople[venueName]}
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
        />
      ))}
    </div>
  );
}
