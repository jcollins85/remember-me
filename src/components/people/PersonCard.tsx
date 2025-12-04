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
  searchQuery: string;
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, query }: { text?: string; query: string }) {
  if (!text) return null;
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(trimmed)})`, "ig");
  const parts = text.split(regex);
  const lower = trimmed.toLowerCase();
  return (
    <>
      {parts.map((part, idx) =>
        part.toLowerCase() === lower ? (
          <mark key={idx} className="bg-[var(--color-accent-muted)] text-[var(--color-text-primary)] px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}

export default function PersonCard({
  person,
  onEdit,
  onDelete,
  onToggleFavorite,
  getTagNameById,
  activeTags,
  setActiveTags,
  searchQuery,
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
    <div className="bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-2xl p-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Highlight text={person.name} query={searchQuery} />
            <button
              onClick={() => onToggleFavorite(person.id)}
              title="Toggle favorite"
              className={`p-1 rounded-full border ${
                person.favorite
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]"
                  : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-card-border)]"
              }`}
            >
              <Star size={16} fill={person.favorite ? "currentColor" : "transparent"} />
            </button>
          </h3>

          {person.position && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              <Highlight text={person.position} query={searchQuery} />
            </p>
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Date Met: {new Date(person.dateMet).toLocaleDateString()}
          </p>
          {person.description && (
            <p className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)]/80 mt-2">
              <Highlight text={person.description} query={searchQuery} />
            </p>
          )}
        </div>

        <div className="flex gap-2">
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

      <div className="flex flex-wrap gap-2 mt-3">
        {person.tags && person.tags.length > 0 ? (
          person.tags.map((tagId) => {
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
                <Highlight text={tagName} query={searchQuery} />
              </button>
            );
          })
        ) : (
          <span className="text-xs text-[var(--color-text-secondary)] italic">
            no tags yet
          </span>
        )}
      </div>
    </div>
  );
}
