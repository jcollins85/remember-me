import { useEffect, useState } from "react";
import { samplePeople } from "./data";
import { Person } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import AddPersonForm from "./components/AddPersonForm";
import EditPersonForm from "./components/EditPersonForm";
import SearchBar from "./components/SearchBar";

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (venue: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [venue]: !prev[venue],
    }));
  };
  
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);  

  const closeAddModal = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowAddModal(false);
      setIsFadingOut(false);
    }, 300); // match your fadeOut duration
  };  

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem("people");
    return saved ? JSON.parse(saved) : samplePeople;
  });

  useEffect(() => {
    localStorage.setItem("people", JSON.stringify(people));
  }, [people]);  
  
  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (confirmed) {
      setPeople((prev) => prev.filter((person) => person.id !== id));
    }
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
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(person);
    return groups;
  }, {});   
 
  useEffect(() => {
    // Initialize openGroups when people list changes
    const groupKeys = Object.keys(
      people.reduce((acc, person) => {
        const key = person.venue || "Unknown Venue";
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );
  
    setOpenGroups((prev) => {
      const updated: Record<string, boolean> = { ...prev };
      groupKeys.forEach((key) => {
        if (updated[key] === undefined) {
          updated[key] = true; // default open
        }
      });
      return updated;
    });
  }, [people]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [menuOpen]);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm px-4 py-3">
        {/* Top Row: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-2xl text-emerald-600 focus:outline-none"
            aria-label="Open menu"
          >
            ☰
          </button>

          <img
            src="/remember-me-header-banner.png"
            alt="Remember Me banner"
            className="w-full h-[100px] object-contain"
          />
        </div>

        {/* Search Bar Below */}
        <div className="mt-4 max-w-md mx-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {activeTags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Filtering by tag:</span>
              {activeTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() =>
                      setActiveTags((prev) => prev.filter((t) => t !== tag))
                    }
                    className="text-red-500 ml-1 text-xs hover:underline"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button
                onClick={() => setActiveTags([])}
                className="text-sm text-red-500 hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 grid gap-4 max-w-xl mx-auto">        
        {showAddModal && (
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 transition-opacity duration-300 ${
              isFadingOut ? "animate-fadeOut" : "animate-fadeIn"
            }`}
            onClick={closeAddModal}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <AddPersonForm
                onAdd={(person) => {
                  setPeople([person, ...people]);
                  setShowNotification(true);
                  closeAddModal();
                  setTimeout(() => setShowNotification(false), 3000);
                }}
              />
              <button
                onClick={() => closeAddModal()}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showNotification && (
          <div className="fixed bottom-24 right-6 bg-green-600 text-white px-4 py-2 rounded shadow z-50 animate-fadeIn">
            Person added successfully!
          </div>
        )}

        {editingPerson && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 animate-fadeIn"
            onClick={() => setEditingPerson(null)}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <EditPersonForm
                person={editingPerson}
                onSave={(updated) => {
                  setPeople((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  );
                  setEditingPerson(null);
                }}                
              />
              <button
                onClick={() => setEditingPerson(null)}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {Object.entries(groupedPeople).map(([venue, group]) => {
          const isOpen = openGroups[venue] ?? true; // default to open

          return (
            <div key={venue} className="mb-8">
              <button
                onClick={() => toggleGroup(venue)}
                className="text-left w-full text-xl font-bold text-gray-700 mb-2 hover:underline"
              >
                {isOpen ? "▼" : "▶"} {venue}
              </button>    
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <AnimatePresence mode="popLayout">
                  <motion.div layout className="flex flex-col gap-4">
                  {[...group]
                    .sort((a, b) => {
                      if (a.favorite && !b.favorite) return -1;
                      if (!a.favorite && b.favorite) return 1;
                      return a.name.localeCompare(b.name); // fallback sort
                    })
                    .map((person) => (
                      <motion.div
                        key={person.id}
                        layout
                        layoutId={`person-${person.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition relative"
                      >
                        <button
                          onClick={() => handleDelete(person.id, person.name)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                          aria-label={`Delete ${person.name}`}
                          title="Delete"
                        >
                          ❌
                        </button>
                        <button
                          onClick={() => setEditingPerson(person)}
                          className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 text-sm"
                          aria-label={`Edit ${person.name}`}
                          title="Edit"
                        >
                          ✏️
                        </button>

                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {person.name}
                          <button
                            onClick={() =>
                              setPeople((prev) =>
                                prev.map((p) =>
                                  p.id === person.id ? { ...p, favorite: !p.favorite } : p
                                )
                              )
                            }
                            className="text-yellow-400 transition-transform duration-200 ease-in-out hover:scale-110"
                            title={person.favorite ? "Unmark Favorite" : "Mark as Favorite"}
                          >
                            {person.favorite ? "★" : "☆"}
                          </button>
                        </h3>

                        {person.position && (
                          <p className="text-sm text-gray-500">{person.position}</p>
                        )}
                        {person.description && (
                          <p className="text-gray-700 text-sm mt-1 whitespace-pre-line">
                            {person.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Met on: {new Date(person.dateMet).toLocaleDateString()}
                        </p>
                        {person.tags && person.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {person.tags.map((tag, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setActiveTags((prev) =>
                                    prev.includes(tag)
                                      ? prev.filter((t) => t !== tag)
                                      : [...prev, tag]
                                  );
                                }}
                                className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full hover:bg-emerald-200 transition"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </motion.div>              
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-emerald-500 text-white text-3xl rounded-full w-14 h-14 shadow-lg hover:bg-emerald-600 transition z-50"
        aria-label="Add Person"
      >
        ＋
      </button>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slideout Drawer (always rendered) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-4 transform transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h2 className="text-lg font-semibold text-emerald-600 mb-4">Menu</h2>
        <ul className="space-y-3">
          <li><button className="text-gray-700 hover:text-emerald-600">Placeholder Item 1</button></li>
          <li><button className="text-gray-700 hover:text-emerald-600">Placeholder Item 2</button></li>
        </ul>
      </div>

    </div>
  );
}

export default App;
