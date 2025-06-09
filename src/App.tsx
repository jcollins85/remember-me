// src/App.tsx
import React, { useState, useEffect, useMemo } from "react";
import { samplePeople } from "./data";
import { Person, Venue } from "./types";
import { useTags } from "./context/TagContext";
import { useFilteredSortedPeople } from "./components/people/useFilteredSortedPeople";
import { SortKey } from "./utils/sortHelpers";
import { useVenueSort } from './components/venues/useVenueSort';
import { useSearchSort } from './components/header/useSearchSort';
import { usePeople } from './context/PeopleContext';
import { useVenues } from "./context/VenueContext";
import { UNCLASSIFIED } from "./constants";
import { useNotification } from './context/NotificationContext';

import Header from "./components/header/Header";
import VenueGroupList from "./components/venues/VenueGroupList";
import AddPersonModal from "./components/people/AddPersonModal";
import EditPersonModal from "./components/people/EditPersonModal";
import Footer from "./components/common/Footer";
import DeleteConfirmModal from "./components/people/DeleteConfirmModal";
import Notification from './components/common/Notification';

function App() {
  // ── UI state ──
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [favoriteVenues, setFavoriteVenues] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteVenues");
    return saved ? JSON.parse(saved) : [];
  });

  // ── Tag context ──
  const { tags, createTag, getTagIdByName, getTagNameById } = useTags();  

  // ── People state ──
  const { people, addPerson, updatePerson, deletePerson } = usePeople();

  // ── Modals/edit state ──
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // ── Sidebar menu ──
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // ── Sorting prefs ──
  const [venueSort, setVenueSort] = useState<"asc" | "desc">("asc");

  const { notification, showNotification } = useNotification();
  
  const {
    searchQuery,
    setSearchQuery,
    activeTags,
    setActiveTags,
    personSort,
    setPersonSort
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

  // ── Persist favorites ──
  useEffect(() => {
    localStorage.setItem("favoriteVenues", JSON.stringify(favoriteVenues));
  }, [favoriteVenues]);

  // ── Handlers ──
  const toggleGroup = (venue: string) => {
    setOpenGroups((prev) => ({ ...prev, [venue]: !prev[venue] }));
  };

  const handleDelete = (id: string, name: string) => {
    setPersonToDelete({ id, name } as Person);
  };

  // ── Group by venueId (lookup name) ──
  const groupedPeople = filteredPeople.reduce<Record<string, Person[]>>(
    (groups, person) => {
      // Lookup the venue’s name via your VenueContext map
      const venueName = person.venueId
        ? venuesById[person.venueId]?.name ?? UNCLASSIFIED
        : UNCLASSIFIED;

      if (!groups[venueName]) groups[venueName] = [];
      groups[venueName].push(person);
      return groups;
    },
    {}
  );

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
        : "";
  }, [menuOpen, showAddModal, editingPerson, personToDelete]);

  const venueNames = Object.keys(groupedPeople);
  const sortedVenueNames = useVenueSort(venueNames, favoriteVenues, venueSort);  

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTags={activeTags}
        setActiveTags={setActiveTags}
        venueSort={venueSort}
        setVenueSort={setVenueSort}
        personSort={personSort}
        setPersonSort={setPersonSort}
        onMenuOpen={() => setMenuOpen(true)}
        getTagNameById={getTagNameById}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-6 grid gap-4 max-w-xl mx-auto">
          {showAddModal && (
            <AddPersonModal
              tags={tags}
              people={people}
              getTagIdByName={getTagIdByName}
              getTagNameById={getTagNameById}
              createTag={createTag}
              onAdd={(newPerson) => {
                addPerson(newPerson)
                setShowAddModal(false);
                showNotification("Person added successfully!", "success");
              }}
              onCancel={() => setShowAddModal(false)}
            />
          )}

          {editingPerson && (
            <EditPersonModal
              tags={tags}
              people={people}
              getTagIdByName={getTagIdByName}
              getTagNameById={getTagNameById}
              createTag={createTag}
              person={editingPerson}
              onSave={(updated) => {
                updatePerson(updated)
                setEditingPerson(null);
                showNotification("Person updated successfully!", "success");
              }}
              onCancel={() => setEditingPerson(null)}
            />
          )}

          {sortedVenueNames.map((venueName) => (
            <VenueGroupList
              key={venueName}
              venue={venueName}
              group={groupedPeople[venueName] || []}
              personSort={personSort}
              activeTags={activeTags}
              setActiveTags={setActiveTags}
              getTagNameById={getTagNameById}
              favoriteVenues={favoriteVenues}
              setFavoriteVenues={setFavoriteVenues}
              isOpen={openGroups[venueName] ?? true}
              toggleGroup={toggleGroup}
              onEdit={setEditingPerson}
              onDelete={handleDelete}
              onToggleFavorite={(personId) => {
                // find the toggled person
                const person = people.find((p) => p.id === personId);
                if (!person) return;
                // flip their favorite flag
                updatePerson({ ...person, favorite: !person.favorite });
              }}
            />
          ))}
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

      {personToDelete && (
        <DeleteConfirmModal
          name={personToDelete.name}
          onCancel={() => setPersonToDelete(null)}
          onConfirm={() => {
            deletePerson(personToDelete.id);            
            setPersonToDelete(null);
            showNotification(`${personToDelete.name} deleted.`, "info");
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
