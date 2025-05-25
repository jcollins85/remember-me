import { useState, useEffect } from "react";
import { Person } from "../types";

interface Props {
  person: Person;
  onSave: (updated: Person) => void;  
}

export default function EditPersonForm({ person, onSave}: Props) {
  const [name, setName] = useState(person.name);
  const [position, setPosition] = useState(person.position || "");
  const [venue, setVenue] = useState(person.venue || "");
  const [description, setDescription] = useState(person.description || "");
  const [tagsInput, setTagsInput] = useState((person.tags || []).join(", "));

  useEffect(() => {
    setName(person.name);
    setVenue(person.venue || "");
    setDescription(person.description || "");
  }, [person]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPerson: Person = {
        ...person,
        name,
        position,
        venue,
        description,
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag !== "")
          .sort(),
    };       

    onSave(updatedPerson);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 max-w-xl mx-auto space-y-3 border border-blue-200">
      <h2 className="text-lg font-semibold text-blue-600">Edit Person</h2>

      <input
        type="text"
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
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Venue"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Description"
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
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Save
        </button>
      </div>
    </form>
  );
}
