// AddPersonModal.tsx
import PersonForm from "./PersonForm";
import { Tag, Person } from "../../types";

interface Props {
  onAdd: (person: Person) => void;
  onCancel: () => void;
  tags: Tag[];
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  createTag: (name: string) => Tag;
  people: Person[]; // pass people for usage counts
}

export default function AddPersonModal({
  onAdd,
  onCancel,
  tags,
  getTagIdByName,
  getTagNameById,
  createTag,
  people,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start overflow-y-auto">
      <div
        className="
          bg-white rounded-lg shadow-lg 
          w-full max-w-md 
          sm:h-auto h-screen 
          m-4 
          flex flex-col 
          max-h-[90vh] 
          overflow-y-auto
          "
      >
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">Add Person</h2>
          <PersonForm
            onSubmit={onAdd}
            onCancel={onCancel}
            mode="add"
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}
          />
        </div>
      </div>
    </div>
  );
}
