// modals/DeleteConfirmModal.tsx
interface Props {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ name, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="glass-panel p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Delete</h2>
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
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-full shadow"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
