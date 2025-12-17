import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { UserPlus2, UserPen, X } from "lucide-react";
import PersonForm from "./PersonForm";
import { Person, Tag } from "../../types";

type Mode = "add" | "edit";

interface Props {
  mode: Mode;
  person?: Person;
  onSubmit: (person: Person) => void;
  onCancel: () => void;
  tags: Tag[];
  people: Person[];
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  createTag: (name: string) => Tag;
}

export default function PersonModal({
  mode,
  person,
  onSubmit,
  onCancel,
  tags,
  people,
  getTagIdByName,
  getTagNameById,
  createTag,
}: Props) {
  const title = mode === "add" ? "Add Person" : "Edit Person";
  const [isSaving, setIsSaving] = useState(false);
  const initialData = mode === "edit" ? person : undefined;
  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root") ?? document.body
      : null;

  if (!modalRoot) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      onClick={onCancel}
      style={{ willChange: "opacity" }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        className="glass-panel w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{ willChange: "transform, opacity" }}
      >
        <div className="flex-none sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-lg border-b border-white/40 px-6 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.08)] pr-14">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-muted)] text-[var(--color-accent)] flex items-center justify-center shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
              {mode === "add" ? <UserPlus2 size={18} /> : <UserPen size={18} />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]/80">
                {mode === "add" ? "Create new connection" : "Update connection"}
              </p>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/85 text-[var(--color-text-primary)] shadow-[0_8px_18px_rgba(15,23,42,0.15)] hover:bg-white transition flex items-center justify-center"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="relative flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollbarGutter: "stable", WebkitOverflowScrolling: "touch" }}
        >
          <PersonForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onCancel}
            mode={mode}
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}
            hideActions
            onSubmittingChange={setIsSaving}
          />
        </div>

        <div className="flex-none sticky bottom-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-white/40 px-6 py-4 flex justify-end gap-2 shadow-[0_-6px_18px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-white/70 text-sm text-[var(--color-text-secondary)] hover:bg-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="person-form"
            disabled={isSaving}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold shadow-level1 hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    modalRoot
  );
}
