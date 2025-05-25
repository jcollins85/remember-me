// modals/EditPersonModal.tsx
import { Person } from "../types";
import PersonForm from "../components/PersonForm";

interface Props {
  person: Person;
  onSave: (updated: Person) => void;
  onCancel: () => void;
}

export default function EditPersonModal({ person, onSave, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <PersonForm
          mode="edit"
          initialData={person}
          onSubmit={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
