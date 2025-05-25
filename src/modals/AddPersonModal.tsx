import PersonForm from "../components/PersonForm";
import { Person } from "../types";

interface Props {
  onAdd: (person: Person) => void;
  onCancel: () => void;
}

export default function AddPersonModal({ onAdd, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 transition-opacity duration-300 animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // 👈 important: prevents modal content clicks from closing
      >
        <PersonForm
          mode="add"
          onSubmit={onAdd}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
