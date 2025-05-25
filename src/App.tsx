import { useEffect, useState } from "react";
import { samplePeople } from "./data";
import { Person } from "./types";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import { motion, AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import VenueGroupList from "./components/VenueGroupList";
import AddPersonModal from "./modals/AddPersonModal";
import EditPersonModal from "./modals/EditPersonModal";
import Notification from "./components/Notification";

function App() {
  const [searchQuery, setSearchQuery] = useState("");  
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [favoriteVenues, setFavoriteVenues] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteVenues");
    return saved ? JSON.parse(saved) : [];
  });

  const [notification, setNotification] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem("people");
    return saved ? JSON.parse(saved) : samplePeople;
  });

  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [personSort, setPersonSort] = useState("name-asc");
  const [venueSort, setVenueSort] = useState("asc");

  useEffect(() => {
    localStorage.setItem("people", JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem("favoriteVenues", JSON.stringify(favoriteVenues));
  }, [favoriteVenues]);

  const toggleGroup = (venue: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [venue]: !prev[venue],
    }));
  };

  const handleDelete = (id: string, name: string) => {
    setPersonToDelete({ id, name } as Person); // only id and name are needed for modal
  };

  const filteredPeople = people.filter((person) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      person.name.toLowerCase().includes(query) ||
      (person.position?.toLowerCase().includes(query) ?? false) ||
      (person.venue?.toLowerCase().includes(query) ?? false) ||
      (person.description?.toLowerCase().includes(query) ?? false) ||
      (person.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false);

    const matchesTag =
      activeTags.length === 0 ||
      (person.tags?.some((tag) => activeTags.includes(tag)) ?? false);

    return matchesSearch && matchesTag;
  });

  const groupedPeople = filteredPeople.reduce((groups: Record<string, Person[]>, person) => {
    const groupKey = person.venue || "Unknown Venue";
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(person);
    return groups;
  }, {});

  useEffect(() => {
    const groupKeys = Object.keys(
      people.reduce((acc, person) => {
        const key = person.venue || "Unknown Venue";
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );

    setOpenGroups((prev) => {
      const updated = { ...prev };
      groupKeys.forEach((key) => {
        if (updated[key] === undefined) {
          updated[key] = true;
        }
      });
      return updated;
    });
  }, [people]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-neutral-50">
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
      />

      <div className="p-6 grid gap-4 max-w-xl mx-auto">
        {showAddModal && (
          <AddPersonModal
            onAdd={(newPerson) => {
              setPeople([newPerson, ...people]);
              setShowAddModal(false);
              showNotification("Person added successfully!", "success");
            }}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        {editingPerson && (
          <EditPersonModal
            person={editingPerson}
            onSave={(updated) => {
              setPeople((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
              );
              setEditingPerson(null);
              showNotification("Person updated successfully!", "success");
            }}
            onCancel={() => setEditingPerson(null)}
          />
        )}

        {Object.keys(groupedPeople).length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg font-medium">No results found.</p>
            {searchQuery || activeTags.length > 0 ? (
              <p className="text-sm mt-2">Try adjusting your search or clearing filters.</p>
            ) : (
              <p className="text-sm mt-2">Add someone new to get started!</p>
            )}
          </div>
        )}

        {Object.entries(groupedPeople)
          .sort(([a], [b]) => {
            const aFav = favoriteVenues.includes(a);
            const bFav = favoriteVenues.includes(b);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return a.localeCompare(b);
          })
          .map(([venue, group]) => (
            <VenueGroupList
              key={venue}
              venue={venue}
              group={group}
              isOpen={openGroups[venue] ?? true}
              toggleGroup={toggleGroup}
              personSort={personSort}
              onEdit={setEditingPerson}
              onDelete={handleDelete}
              onToggleFavorite={(id) =>
                setPeople((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p))
                )
              }
              activeTags={activeTags}
              setActiveTags={setActiveTags}
              favoriteVenues={favoriteVenues}
              setFavoriteVenues={setFavoriteVenues}
            />
          ))}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-emerald-500 text-white text-3xl rounded-full w-14 h-14 shadow-lg hover:bg-emerald-600 transition z-50"
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
          <li><button className="text-gray-700 hover:text-emerald-600">Placeholder Item 1</button></li>
          <li><button className="text-gray-700 hover:text-emerald-600">Placeholder Item 2</button></li>
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
            setPeople((prev) =>
              prev.filter((p) => p.id !== personToDelete.id)
            );
            showNotification(`${personToDelete.name} has been deleted.`, "info");
            setPersonToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
