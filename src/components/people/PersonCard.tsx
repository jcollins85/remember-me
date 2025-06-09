// PersonCard.tsx
import { Person } from "../types";

interface Props {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
  getTagNameById: (id: string) => string;
  activeTags: string[];
  setActiveTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PersonCard({
  person,
  onEdit,
  onDelete,
  onToggleFavorite,
  getTagNameById,
  activeTags,
  setActiveTags,
}: Props) {
  const toggleTagFilter = (tagId: string) => {
    setActiveTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((t) => t !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-1">
            {person.name}
            <button
              onClick={() => onToggleFavorite(person.id)}
              title="Toggle favorite"
              className="text-yellow-500 text-lg"
            >
              {person.favorite ? "★" : "☆"}
            </button>
          </h3>

          {person.position && (
            <p className="text-sm text-gray-600">{person.position}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Date Met: {new Date(person.dateMet).toLocaleDateString()}
          </p>
          {person.description && (
            <p className="text-sm text-gray-700 mt-2">{person.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(person)}
            className="text-blue-500 hover:text-blue-600 text-lg"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(person.id, person.name)}
            className="text-red-500 hover:text-red-600 text-lg"
            title="Delete"
          >
            ❌
          </button>
        </div>
      </div>

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {person.tags.map((tagId) => {
            const tagName = getTagNameById(tagId);
            const isActive = activeTags.includes(tagId);
            return (
              <button
                key={tagId}
                onClick={() => toggleTagFilter(tagId)}
                className={`px-2 py-1 rounded-full text-sm transition ${
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
                title={
                  isActive
                    ? `Remove filter "${tagName}"`
                    : `Filter by "${tagName}"`
                }
              >
                {tagName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
