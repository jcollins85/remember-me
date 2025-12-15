import { useState } from "react";
import { motion } from "framer-motion";
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

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center overflow-y-auto overscroll-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-md m-4 flex flex-col max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex-none sticky top-0 z-10 bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
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

        {/* FOOTER */}
        <div className="flex-none sticky bottom-0 z-10 bg-white/90 border-t px-6 py-4 flex justify-end gap-2">
          <button
            type="submit"
            form="person-form"
            disabled={isSaving}
            className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold shadow-level1 hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-white/70 text-sm text-[var(--color-text-secondary)] hover:bg-white transition"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
