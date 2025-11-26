// PersonCard.tsx
import { Person } from "../../types";
import { Pencil, Star, Trash2 } from "lucide-react";

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
    <div className="glass-panel p-4 border border-white/40">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            {person.name}
            <button
              onClick={() => onToggleFavorite(person.id)}
              title="Toggle favorite"
              className={`p-1 rounded-full border ${person.favorite ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]" : "bg-white text-[var(--color-text-secondary)] border-white/70"}`}
            >
              <Star size={16} fill={person.favorite ? "currentColor" : "transparent"} />
            </button>
          </h3>

          {person.position && (
            <p className="text-sm text-[var(--color-text-secondary)]">{person.position}</p>
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Date Met: {new Date(person.dateMet).toLocaleDateString()}
          </p>
          {person.description && (
            <p className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)]/80 mt-2">{person.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(person)}
            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(person.id, person.name)}
            className="p-2 rounded-full text-red-500 hover:text-red-600 transition"
            title="Delete"
          >
            <Trash2 size={16} />
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
                className={`px-3 py-1 rounded-full text-sm transition border ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white shadow-sm border-[var(--color-accent)]"
                    : "bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] border-[var(--color-accent-muted)]/80 hover:bg-[var(--color-accent-muted)]/80"
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
