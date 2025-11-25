// src/App.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Person, Venue } from "./types";

import { useTags } from "./context/TagContext";
import { usePeople } from './context/PeopleContext';
import { useVenues } from "./context/VenueContext";
import { useNotification } from './context/NotificationContext';

import { useGroupedPeople } from './hooks/useGroupedPeople';
import { useFavoriteSections } from './hooks/useFavouriteSections';
import { useFavorites } from './hooks/useFavourites';

import VenueSections from './components/venues/VenueSections';
import ModalManager from './components/common/ModalManager';
import Header from "./components/header/Header";
import { useFilteredSortedPeople } from "./components/people/useFilteredSortedPeople";
import { useVenueSort } from './components/venues/useVenueSort';
import { useSearchSort } from './components/header/useSearchSort';
import Footer from "./components/common/Footer";
import Notification from './components/common/Notification';

import { SortKey, VenueSortKey } from "./utils/sortHelpers";

import { UNCLASSIFIED } from "./constants";

type VenueView = "all" | "favs";

function App() {
  // ── Tag context ──
  const { tags, createTag, getTagIdByName, getTagNameById } = useTags();  
  
  // ── UI state ──
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // ── People state ──
  const { people, addPerson, updatePerson, deletePerson } = usePeople();

  // ── Favorites state (persisted) ──
  const [favoriteVenues, setFavoriteVenues] = useFavorites('favoriteVenues');

  // ── Modals/edit state ──
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // ── Sidebar menu ──
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // ── Sorting prefs ──  
  const [venueSortKey, setVenueSortKey] = useState<VenueSortKey>("recentVisit");
  const [venueSortDir, setVenueSortDir] = useState<"asc" | "desc">("desc");
  const [venueView, setVenueView] = useState<VenueView>("all");


  const { notification, showNotification } = useNotification();
  
  const {
    searchQuery, setSearchQuery,
    activeTags,  setActiveTags,
    personSort,  setPersonSort
  } = useSearchSort();

  // ── Venue context & lookup ──
  const { venues } = useVenues();
  const venuesById = useMemo(
    () => Object.fromEntries(venues.map((v) => [v.id, v])) as Record<string, Venue>,
    [venues]
  );  

  // ── Filter & sort hook ──
  const [sortField, sortDir] = personSort.split("-") as [SortKey, "asc" | "desc"];
  const filteredPeople = useFilteredSortedPeople(
    people,
    searchQuery,
    activeTags,
    sortField,
    sortDir === "asc"
  );

  // ── Handlers ──
  const toggleGroup = (venueName: string) => {
    setOpenGroups((prev: Record<string, boolean>) => {
      // default false if undefined
      const isOpen = prev[venueName] ?? false;
      return {
        ...prev,
        [venueName]: !isOpen,
      };
    });
  };

  const handleDelete = (id: string, name: string) => {
    setPersonToDelete({ id, name } as Person);
  };

  // ── Group by venue via new hook ──
  const groupedPeople = useGroupedPeople(filteredPeople, venuesById);

  // ── Initialize openGroups keys ──
  useEffect(() => {
    const groupKeys = Object.keys(
      people.reduce((acc, person) => {
        // Lookup name by ID, or fall back to UNCLASSIFIED
        const venueName = person.venueId
          ? venuesById[person.venueId]?.name ?? UNCLASSIFIED
          : UNCLASSIFIED;
        acc[venueName] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );

    setOpenGroups((prev) => {
      const updated = { ...prev };
      groupKeys.forEach((key) => {
        if (updated[key] === undefined) updated[key] = true;
      });
      return updated;
    });
  }, [people, venuesById]);

  // ── Prevent scrolling ──
  useEffect(() => {
    document.body.style.overflow =
      menuOpen || showAddModal || editingPerson || personToDelete
        ? "hidden"
        : "auto";
  }, [menuOpen, showAddModal, editingPerson, personToDelete]);

  const sortedVenues = useVenueSort(
    venues,
    people,
    venueSortKey,
    venueSortDir === "asc"
  );
  
  const sortedVenueNames = sortedVenues
    .map((v) => v.name)
    .filter((name) => groupedPeople[name]);

  const favoriteSections = useFavoriteSections(sortedVenueNames, favoriteVenues);
  const favoriteVenueNames = favoriteSections.favorites;
  const visibleVenueNames =
    venueView === "favs" ? favoriteVenueNames : sortedVenueNames;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTags={activeTags}
        setActiveTags={setActiveTags}
        venueSortKey={venueSortKey}
        venueSortDir={venueSortDir}
        setVenueSortKey={setVenueSortKey}
        setVenueSortDir={setVenueSortDir}
        personSort={personSort}
        setPersonSort={setPersonSort}
        onMenuOpen={() => setMenuOpen(true)}
        getTagNameById={getTagNameById}
        venueView={venueView}
        setVenueView={setVenueView}
        favoriteVenueCount={favoriteVenueNames.length}
      />

      <main className="flex-1 pb-24">
        <div className="p-6 grid gap-4 max-w-xl mx-auto">
          <ModalManager
            showAdd={showAddModal}
            onAddCancel={() => setShowAddModal(false)}
            onAdd={(newPerson) => {
              addPerson(newPerson);
              setShowAddModal(false);
              showNotification("Person added successfully!", "success");
            }}
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}

            editingPerson={editingPerson}
            onEditCancel={() => setEditingPerson(null)}
            onEdit={(updated) => {
              updatePerson(updated);
              setEditingPerson(null);
              showNotification("Person updated successfully!", "success");
            }}

            personToDelete={personToDelete}
            onDeleteCancel={() => setPersonToDelete(null)}
            onDeleteConfirm={(id) => {
              const deletedName = personToDelete?.name ?? "Person";
              deletePerson(id);
              setPersonToDelete(null);
              showNotification(`${deletedName} deleted.`, "info");
            }}
          />

          <VenueSections
            groupedPeople={groupedPeople}
            favoriteVenues={favoriteVenues}
            visibleVenueNames={visibleVenueNames}
            viewMode={venueView}
            personSort={personSort}
            activeTags={activeTags}
            setActiveTags={setActiveTags}
            getTagNameById={getTagNameById}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            setFavoriteVenues={setFavoriteVenues}
            onEdit={setEditingPerson}
            onDelete={handleDelete}
            onToggleFavorite={(id) => {
              const p = people.find(p => p.id === id);
              if (p) updatePerson({ ...p, favorite: !p.favorite });
            }}
          /> 
        </div>
      </main>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-14 right-6 bg-emerald-500 text-white text-3xl rounded-full w-14 h-14 shadow-lg hover:bg-emerald-600 transition z-40"
        aria-label="Add Person"
      >
        ＋
      </button>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-4 transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">Menu</h2>
        <ul className="space-y-3">
          <li>
            <button className="text-gray-700 hover:text-emerald-600">
              Placeholder Item 1
            </button>
          </li>
          <li>
            <button className="text-gray-700 hover:text-emerald-600">
              Placeholder Item 2
            </button>
          </li>
        </ul>
      </div>

      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      <Footer />
    </div>
  );
}

export default App;
