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
        className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Delete</h2>
        <p className="text-sm text-gray-700 mb-6">
          Are you sure you want to delete <strong>{name}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
