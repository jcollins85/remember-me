import { Person } from "../types";

interface Props {
  person: Person;
  onDelete: (id: string, name: string) => void;
  onEdit: (person: Person) => void;
  onToggleFavorite: (id: string) => void;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PersonCard({
  person,
  onDelete,
  onEdit,
  onToggleFavorite,
  activeTags,
  setActiveTags,
}: Props) {
  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition relative">
      {/* Actions */}
      <button
        onClick={() => onDelete(person.id, person.name)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
        aria-label={`Delete ${person.name}`}
        title="Delete"
      >
        ❌
      </button>
      <button
        onClick={() => onEdit(person)}
        className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 text-sm"
        aria-label={`Edit ${person.name}`}
        title="Edit"
      >
        ✏️
      </button>

      {/* Main Content */}
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {person.name}
        <button
          onClick={() => onToggleFavorite(person.id)}
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

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {person.tags.map((tag, i) => (
            <button
              key={i}
              onClick={() => toggleTag(tag)}
              className={`${
                activeTags.includes(tag)
                  ? "bg-emerald-300 text-emerald-900"
                  : "bg-emerald-100 text-emerald-800"
              } text-xs px-2 py-1 rounded-full hover:bg-emerald-200 transition`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}