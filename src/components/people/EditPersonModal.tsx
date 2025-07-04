// src/components/people/EditPersonModal.tsx
import PersonForm from "./PersonForm";
import { Person, Tag } from "../../types";

interface Props {
  person: Person;
  onSave: (updated: Person) => void;
  onCancel: () => void;
  tags: Tag[];
  createTag: (name: string) => Tag;
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  people: Person[];
}

export default function EditPersonModal({
  person,
  onSave,
  onCancel,
  tags,
  createTag,
  getTagIdByName,
  getTagNameById,
  people,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-md m-4 rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex-none sticky top-0 z-10 bg-white border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-emerald-700">Edit Person</h2>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PersonForm
            initialData={person}
            onSubmit={onSave}
            onCancel={onCancel}
            mode="edit"
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
