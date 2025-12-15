// modals/DeleteConfirmModal.tsx
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ name, onConfirm, onCancel }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      onConfirm();
    } catch (error) {
      setIsDeleting(false);
      throw error;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="w-full max-w-sm rounded-3xl glass-panel border border-white/70 p-6 text-[var(--color-text-primary)] space-y-4"
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-red-500">Caution</p>
              <h2 className="text-lg font-semibold">Confirm Delete</h2>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-4 py-2 rounded-full border border-white/70 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-full shadow-level1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
