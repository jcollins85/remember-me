// PersonCard.tsx
import { Person } from "../../types";
import { motion } from "framer-motion";
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
    <div className="bg-[var(--color-card)] rounded-3xl p-5 shadow-level1/60">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <Highlight text={person.name} query={searchQuery} />
            <button
              onClick={() => onToggleFavorite(person.id)}
              title="Toggle favorite"
              className={`w-8 h-8 flex items-center justify-center rounded-full border relative overflow-hidden ${
                person.favorite
                  ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]"
                  : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-card-border)]"
              }`}
            >
              <span
                className={`absolute inset-0 rounded-full bg-[var(--color-accent)]/10 blur-lg transition-opacity duration-300 ${
                  person.favorite ? "opacity-100" : "opacity-0"
                }`}
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-[var(--color-accent)]/60 pointer-events-none"
                animate={
                  person.favorite
                    ? { scale: [1, 1.25, 0.6], opacity: [0.6, 0.4, 0] }
                    : { scale: [1, 0.7, 1], opacity: [0.3, 0.6, 0] }
                }
                transition={{ duration: 0.35 }}
                style={{ boxShadow: person.favorite ? "0 0 12px var(--color-accent)" : "0 0 6px rgba(0,0,0,0.12)" }}
              />
              <motion.span
                animate={
                  person.favorite
                    ? { scale: [0.8, 1.3, 1], rotate: [0, 10, 0] }
                    : { scale: [1.1, 0.9, 1], rotate: [0, -10, 0] }
                }
                transition={{ duration: 0.35 }}
                className="relative inline-flex"
              >
                <Star size={16} fill={person.favorite ? "currentColor" : "transparent"} />
              </motion.span>
            </button>
          </h3>

          {person.position && (
            <p className="text-[15px] text-[var(--color-text-secondary)] mt-1">
              <Highlight text={person.position} query={searchQuery} />
            </p>
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 tracking-wide uppercase">
            Date Met: {new Date(person.dateMet).toLocaleDateString()}
          </p>
          {person.description && (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-text-primary)]/85 mt-3">
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

      {person.tags && person.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {person.tags.map((tagId) => {
            const tagName = getTagNameById(tagId);
            const isActive = activeTags.includes(tagId);
            if (!tagName) return null;
            return (
              <motion.button
                key={tagId}
                onClick={() => toggleTagFilter(tagId)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                    : "bg-[var(--color-accent-muted)] text-[var(--color-text-primary)]/85 hover:bg-[var(--color-accent-muted)]/90"
                }`}
                title={
                  isActive
                    ? `Remove filter "${tagName}"`
                    : `Filter by "${tagName}"`
                }
                whileTap={{ scale: 0.94 }}
                animate={
                  isActive
                    ? { scale: [0.95, 1.1, 1], boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 8px 16px rgba(0,0,0,0.15)", "0 0 0 rgba(0,0,0,0)"] }
                    : { scale: [1.05, 0.96, 1], boxShadow: "0 0 0 rgba(0,0,0,0)" }
                }
                transition={{ duration: 0.3 }}
              >
                <Highlight text={tagName} query={searchQuery} />
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
