// modals/DeleteConfirmModal.tsx
import { useState } from "react";

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
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-3xl bg-white text-[var(--color-text-primary)] shadow-[0_20px_40px_rgba(15,23,42,0.18)] border border-white/80 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-red-500">Caution</p>
            <h2 className="text-lg font-semibold">Confirm Delete</h2>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to delete <strong>{name}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-4 py-2 rounded-full border border-white/70 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-full shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
