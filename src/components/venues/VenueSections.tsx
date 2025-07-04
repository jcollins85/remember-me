import React from 'react';
import CollapsibleSection from '../common/CollapsibleSection';
import VenueGroupList from './VenueGroupList';
import type { Person } from '../../types';

interface Props {
  groupedPeople: Record<string, Person[]>;
  favoriteVenues: string[];
  sortedVenueNames: string[];
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
  sortedVenueNames,
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
  // split favorites vs others
  const favoriteGroups = sortedVenueNames.filter(name => favoriteVenues.includes(name));
  const otherGroups    = sortedVenueNames.filter(name => !favoriteVenues.includes(name));

  return (
    <>
      {favoriteGroups.length > 0 && (
        <CollapsibleSection title="★ Favorite Venues" defaultOpen>
          {favoriteGroups.map(venueName => (
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
        </CollapsibleSection>
      )}

      <CollapsibleSection title="All Venues" defaultOpen={false}>
        {otherGroups.map(venueName => (
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
      </CollapsibleSection>
    </>
  );
}
