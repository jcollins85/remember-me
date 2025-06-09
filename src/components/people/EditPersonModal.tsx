// EditPersonModal.tsx
import { Person, Tag } from "../../types";
import PersonForm from "./PersonForm";

interface Props {
  person: Person;
  onSave: (updated: Person) => void;
  onCancel: () => void;
  tags: Tag[];
  createTag: (name: string) => Tag;
  getTagIdByName: (name: string) => string | null;
  getTagNameById: (id: string) => string;
  people: Person[]; // pass people for usage counts
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
        className="
          bg-white 
          w-full max-w-md 
          sm:h-auto h-screen
          m-4 
          rounded-xl shadow-xl 
          flex flex-col 
          max-h-[90vh] 
          overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">Edit Person</h2>
          <PersonForm
            mode="edit"
            initialData={person}
            onSubmit={onSave}
            onCancel={onCancel}
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
