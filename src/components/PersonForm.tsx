import { useState, useEffect } from "react";
import { Person } from "../types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  initialData?: Partial<Person>;
  onSubmit: (person: Person) => void;
  onCancel?: () => void;
  mode: "add" | "edit";
}

export default function PersonForm({
  initialData = {},
  onSubmit,
  onCancel,
  mode,
}: Props) {
  const [name, setName] = useState(initialData.name || "");
  const [position, setPosition] = useState(initialData.position || "");
  const [venue, setVenue] = useState(initialData.venue || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [tagsInput, setTagsInput] = useState((initialData.tags || []).join(", "));

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setName(initialData.name || "");
      setPosition(initialData.position || "");
      setVenue(initialData.venue || "");
      setDescription(initialData.description || "");
      setTagsInput((initialData.tags || []).join(", "));
    }
  }, [initialData, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanedTags = tagsInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== "")
      .sort();

    const person: Person = {
      id: initialData.id || uuidv4(),
      name,
      position,
      venue,
      description,
      dateMet: initialData.dateMet || new Date().toISOString(),
      tags: cleanedTags,
    };

    onSubmit(person);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Position / Role"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Venue (optional)"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
        rows={3}
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition"
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
