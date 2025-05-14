import { useEffect, useState } from "react";
import { samplePeople } from "./data";
import { Person } from "./types";
import AddPersonForm from "./components/AddPersonForm";
import EditPersonForm from "./components/EditPersonForm";
import SearchBar from "./components/SearchBar";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (venue: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [venue]: !prev[venue],
    }));
  };
  
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">
        Remember Me
      </h1>      

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div className="grid gap-4 max-w-xl mx-auto">        
        <AddPersonForm onAdd={(newPerson) => setPeople([newPerson, ...people])} />

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
                      className="bg-white rounded-xl p-4 shadow hover:shadow-md transition relative"
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
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
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
    </div>
  );
}

export default App;
