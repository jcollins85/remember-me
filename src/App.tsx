import { useEffect, useState } from "react";
import { samplePeople } from "./data";
import { Person } from "./types";
import AddPersonForm from "./components/AddPersonForm";
import EditPersonForm from "./components/EditPersonForm";
import SearchBar from "./components/SearchBar";

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (venue: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [venue]: !prev[venue],
    }));
  };
  
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
    return (
      person.name.toLowerCase().includes(query) ||
      (person.position?.toLowerCase().includes(query) ?? false) ||
      (person.venue?.toLowerCase().includes(query) ?? false) ||
      (person.position?.toLowerCase().includes(query) ?? false) ||
      (person.description?.toLowerCase().includes(query) ?? false) ||
      (person.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false)
    );
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <img
          src="/remember-me-header-banner.png"
          alt="Remember Me banner"
          className="w-full max-w-none"
          style={{ aspectRatio: "4 / 1" }}
        />

        <div className="px-4 py-3">
          <div className="max-w-md mx-auto">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
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
          <EditPersonForm
            person={editingPerson}
            onSave={(updated) => {
              setPeople((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
              );
              setEditingPerson(null);
            }}
            onCancel={() => setEditingPerson(null)}
          />
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

              {isOpen && (
                <div className="grid gap-4">
                  {group.map((person) => (
                    <div
                      key={person.id}
                      className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition relative"
                    >
                      {/* your edit/delete buttons and content */}
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

                      <h3 className="text-lg font-semibold">{person.name}</h3>
                      {person.position && (
                        <p className="text-sm text-gray-500">{person.position}</p>
                      )}
                      {person.description && (
                        <p className="text-gray-700 text-sm mt-1">{person.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Met on: {new Date(person.dateMet).toLocaleDateString()}
                      </p>
                      {person.tags && person.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {person.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
}

export default App;
