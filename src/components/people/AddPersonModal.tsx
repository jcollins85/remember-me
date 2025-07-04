// src/components/people/AddPersonModal.tsx
import PersonForm from "./PersonForm";
import { Tag, Person } from "../../types";

interface Props {
  onAdd: (person: Person) => void;
  onCancel: () => void;
  tags: Tag[];
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  createTag: (name: string) => Tag;
  people: Person[];
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
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md m-4 flex flex-col max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex-none sticky top-0 z-10 bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-emerald-700">Add Person</h2>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PersonForm
            onSubmit={onAdd}
            onCancel={onCancel}
            mode="add"
            tags={tags}
            people={people}
            getTagIdByName={getTagIdByName}
            getTagNameById={getTagNameById}
            createTag={createTag}
            hideActions
          />
        </div>

        {/* FOOTER */}
        <div className="flex-none sticky bottom-0 z-10 bg-white border-t px-6 py-4 flex justify-end gap-2">
          <button
            type="submit"
            form="person-form"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Save
          </button>          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
